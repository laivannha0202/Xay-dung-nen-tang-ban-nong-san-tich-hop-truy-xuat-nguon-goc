import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiDatChoTonKho, TrangThaiThanhToan } from '../../generated/prisma/client';
import { DatChoTonKhoService } from '../ton-kho/dat-cho-ton-kho.service';

import type { PhanHoiCallbackThanhToanDto } from './dto/phan-hoi-callback-thanh-toan.dto';
import type {
  TenPaymentGateway,
  VerifyPaymentCallbackResult,
} from './gateway/payment-gateway.adapter';
import { PaymentGatewayRegistry } from './gateway/payment-gateway.registry';

@Injectable()
export class ThanhToanCallbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: PaymentGatewayRegistry,
    private readonly datChoTonKhoService: DatChoTonKhoService,
  ) {}

  async xuLy(
    gatewayName: TenPaymentGateway,
    rawParams: Readonly<Record<string, unknown>>,
  ): Promise<PhanHoiCallbackThanhToanDto> {
    const gateway = this.registry.get(gatewayName);
    const params = this.chuanHoaParams(rawParams);

    const verified = await gateway.verifyCallback({
      params,
    });

    if (!verified.validSignature) {
      throw new BadRequestException('Payment callback có chữ ký không hợp lệ.');
    }

    const externalReference = verified.externalReference?.trim();

    if (!externalReference) {
      throw new BadRequestException('Payment callback thiếu external reference.');
    }

    const transaction = await this.prisma.giaoDichThanhToan.findUnique({
      where: {
        maGiaoDich: externalReference,
      },
      include: {
        thanhToan: {
          include: {
            donHang: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Không tìm thấy payment transaction cho callback.');
    }

    this.validateGateway(gatewayName, transaction.phuongThuc, transaction.thanhToan.phuongThuc);

    this.validateAmount(verified, Number(transaction.soTien));

    const target = verified.success ? TrangThaiThanhToan.PAID : TrangThaiThanhToan.FAILED;

    const currentPayment = transaction.thanhToan.trangThai;
    const currentTransaction = transaction.trangThai;

    const daXuLyTruoc = currentPayment === target && currentTransaction === target;

    if (daXuLyTruoc) {
      return this.layPhanHoi(
        gatewayName,
        transaction.thanhToan.id,
        transaction.id,
        verified.success,
        true,
      );
    }

    this.validateCurrentState(currentPayment, target, 'Payment');
    this.validateCurrentState(currentTransaction, target, 'Payment transaction');

    const maReservation = `ORDER:${transaction.thanhToan.donHang.maDonHang}`;

    const reservation = await this.prisma.datChoTonKho.findUnique({
      where: {
        maThamChieu: maReservation,
      },
      select: {
        id: true,
        trangThai: true,
      },
    });

    if (!reservation) {
      throw new BadRequestException('Payment callback không tìm thấy inventory reservation.');
    }

    if (verified.success) {
      const result = await this.datChoTonKhoService.xacNhanDaBan(reservation.id);

      if (result.trangThai !== TrangThaiDatChoTonKho.DA_BAN) {
        throw new ConflictException(
          `Callback success xung đột reservation state ${result.trangThai}.`,
        );
      }
    } else {
      const result = await this.datChoTonKhoService.giaiPhong(reservation.id);

      if (
        result.trangThai !== TrangThaiDatChoTonKho.DA_GIAI_PHONG &&
        result.trangThai !== TrangThaiDatChoTonKho.HET_HAN
      ) {
        throw new ConflictException(
          `Callback failed xung đột reservation state ${result.trangThai}.`,
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.thanhToan.updateMany({
        where: {
          id: transaction.thanhToan.id,
          trangThai: {
            in: [TrangThaiThanhToan.CREATED, TrangThaiThanhToan.PENDING],
          },
        },
        data: {
          trangThai: target,
        },
      }),
      this.prisma.giaoDichThanhToan.updateMany({
        where: {
          id: transaction.id,
          trangThai: {
            in: [TrangThaiThanhToan.CREATED, TrangThaiThanhToan.PENDING],
          },
        },
        data: {
          trangThai: target,
          thoiGian: new Date(),
        },
      }),
    ]);

    return this.layPhanHoi(
      gatewayName,
      transaction.thanhToan.id,
      transaction.id,
      verified.success,
      false,
    );
  }

  private validateGateway(
    gateway: TenPaymentGateway,
    transactionMethod: string,
    paymentMethod: string,
  ): void {
    if (transactionMethod !== gateway || paymentMethod !== gateway) {
      throw new ConflictException('Gateway callback không khớp phương thức Payment.');
    }
  }

  private validateAmount(verified: VerifyPaymentCallbackResult, expected: number): void {
    if (verified.amount === null || Math.abs(verified.amount - expected) >= 0.005) {
      throw new ConflictException('Số tiền callback không khớp Payment transaction.');
    }
  }

  private validateCurrentState(
    current: TrangThaiThanhToan,
    target: TrangThaiThanhToan,
    label: string,
  ): void {
    if (
      current === TrangThaiThanhToan.CREATED ||
      current === TrangThaiThanhToan.PENDING ||
      current === target
    ) {
      return;
    }

    throw new ConflictException(
      `${label} đã ở terminal state ${current}, không thể đổi sang ${target}.`,
    );
  }

  private async layPhanHoi(
    gateway: TenPaymentGateway,
    paymentId: string,
    transactionId: string,
    success: boolean,
    daXuLyTruoc: boolean,
  ): Promise<PhanHoiCallbackThanhToanDto> {
    const transaction = await this.prisma.giaoDichThanhToan.findUniqueOrThrow({
      where: {
        id: transactionId,
      },
      include: {
        thanhToan: {
          include: {
            donHang: true,
          },
        },
      },
    });

    if (transaction.thanhToan.id !== paymentId) {
      throw new ConflictException('Payment transaction không còn thuộc Payment dự kiến.');
    }

    const reservation = await this.prisma.datChoTonKho.findUnique({
      where: {
        maThamChieu: `ORDER:${transaction.thanhToan.donHang.maDonHang}`,
      },
      select: {
        id: true,
        trangThai: true,
      },
    });

    if (!reservation) {
      throw new BadRequestException('Không tìm thấy inventory reservation sau callback.');
    }

    return {
      gateway,
      paymentId,
      transactionId,
      maGiaoDich: transaction.maGiaoDich,
      trangThaiThanhToan: transaction.thanhToan.trangThai,
      trangThaiGiaoDich: transaction.trangThai,
      trangThaiDatCho: reservation.trangThai,
      success,
      daXuLyTruoc,
    };
  }

  private chuanHoaParams(raw: Readonly<Record<string, unknown>>): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === 'string') {
        result[key] = value;
        continue;
      }

      if (Array.isArray(value) && typeof value[0] === 'string') {
        result[key] = value[0];
      }
    }

    return result;
  }
}
