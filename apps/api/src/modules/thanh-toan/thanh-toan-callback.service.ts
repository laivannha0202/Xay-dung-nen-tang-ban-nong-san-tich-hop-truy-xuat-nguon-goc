import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  TrangThaiDatChoTonKho,
  TrangThaiDonHang,
  TrangThaiThanhToan,
} from '../../generated/prisma/client';
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

    const verified = await gateway.verifyCallback({ params });

    if (!verified.validSignature) {
      throw new BadRequestException('Chữ ký xác thực thanh toán không hợp lệ. Vui lòng thử lại hoặc liên hệ tổng đài AgriMarket để được hỗ trợ.');
    }

    const externalReference = verified.externalReference?.trim();
    if (!externalReference) {
      throw new BadRequestException('Thiếu mã tham chiếu giao dịch thanh toán. Vui lòng thử lại hoặc liên hệ tổng đài AgriMarket để được hỗ trợ.');
    }

    const transaction = await this.prisma.giaoDichThanhToan.findUnique({
      where: { maGiaoDich: externalReference },
      include: {
        thanhToan: {
          include: { donHang: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Không tìm thấy giao dịch thanh toán tương ứng. Vui lòng thử lại hoặc liên hệ tổng đài AgriMarket để được hỗ trợ.');
    }

    this.validateGateway(gatewayName, transaction.phuongThuc, transaction.thanhToan.phuongThuc);
    this.validateAmount(verified, Number(transaction.soTien));

    const target = verified.success ? TrangThaiThanhToan.PAID : TrangThaiThanhToan.FAILED;
    const currentPayment = transaction.thanhToan.trangThai;
    const currentTransaction = transaction.trangThai;
    const daXuLyTruoc = currentPayment === target && currentTransaction === target;

    if (daXuLyTruoc) {
      if (verified.success) {
        await this.dongBoDonHangDaThanhToan(transaction.thanhToan.donHang.id);
      }

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
      where: { maThamChieu: maReservation },
      select: { id: true, trangThai: true },
    });

    if (!reservation) {
      throw new BadRequestException('Hệ thống chưa ghi nhận được trạng thái giữ hàng của đơn. Vui lòng tải lại và thử lại, nếu cần hãy liên hệ tổng đài AgriMarket để được hỗ trợ.');
    }

    if (verified.success) {
      const result = await this.datChoTonKhoService.xacNhanThanhToan(reservation.id);
      if (result.trangThai !== TrangThaiDatChoTonKho.DA_XAC_NHAN) {
        throw new ConflictException(
          'Trạng thái xử lý đơn hàng đang không nhất quán. Vui lòng liên hệ tổng đài AgriMarket để được hỗ trợ.',
        );
      }
    } else if (gatewayName === 'VNPAY_SANDBOX') {
      // VNPay thất bại không đồng nghĩa khách bỏ đơn. Giữ reservation tới TTL để
      // Customer Web/Mobile có thể retry một Payment mới cho cùng Order. Nếu khách
      // hủy đơn hoặc reservation hết hạn, luồng tương ứng sẽ release inventory.
      if (reservation.trangThai !== TrangThaiDatChoTonKho.DANG_GIU) {
        throw new ConflictException(
          'Giao dịch VNPay chưa thành công và trạng thái giữ hàng đã thay đổi nên chưa thể thử lại tự động. Vui lòng liên hệ tổng đài AgriMarket để được hỗ trợ.',
        );
      }
    } else {
      // MOCK failure giữ semantics cũ của test/payment simulator: giải phóng ngay.
      const result = await this.datChoTonKhoService.giaiPhong(reservation.id);
      if (
        result.trangThai !== TrangThaiDatChoTonKho.DA_GIAI_PHONG &&
        result.trangThai !== TrangThaiDatChoTonKho.HET_HAN
      ) {
        throw new ConflictException(
          'Trạng thái xử lý đơn hàng đang không nhất quán. Vui lòng liên hệ tổng đài AgriMarket để được hỗ trợ.',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.thanhToan.updateMany({
        where: {
          id: transaction.thanhToan.id,
          trangThai: {
            in: [TrangThaiThanhToan.CREATED, TrangThaiThanhToan.PENDING],
          },
        },
        data: {
          trangThai: target,
        },
      });

      await tx.giaoDichThanhToan.updateMany({
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
      });

      if (verified.success) {
        await tx.donHang.updateMany({
          where: {
            id: transaction.thanhToan.donHang.id,
            trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
          },
          data: {
            trangThai: TrangThaiDonHang.DA_XAC_NHAN,
          },
        });

        await tx.donHangNhaCungCap.updateMany({
          where: {
            donHangId: transaction.thanhToan.donHang.id,
            trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
          },
          data: {
            trangThai: TrangThaiDonHang.DA_XAC_NHAN,
          },
        });
      }
    });

    return this.layPhanHoi(
      gatewayName,
      transaction.thanhToan.id,
      transaction.id,
      verified.success,
      false,
    );
  }

  private async dongBoDonHangDaThanhToan(donHangId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.donHang.updateMany({
        where: {
          id: donHangId,
          trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
        },
        data: {
          trangThai: TrangThaiDonHang.DA_XAC_NHAN,
        },
      }),
      this.prisma.donHangNhaCungCap.updateMany({
        where: {
          donHangId,
          trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
        },
        data: {
          trangThai: TrangThaiDonHang.DA_XAC_NHAN,
        },
      }),
    ]);
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
      throw new ConflictException('Số tiền đối soát không khớp giao dịch thanh toán.');
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
      where: { id: transactionId },
      include: {
        thanhToan: {
          include: { donHang: true },
        },
      },
    });

    if (transaction.thanhToan.id !== paymentId) {
      throw new ConflictException('Giao dịch thanh toán không còn thuộc thanh toán dự kiến.');
    }

    const reservation = await this.prisma.datChoTonKho.findUnique({
      where: { maThamChieu: `ORDER:${transaction.thanhToan.donHang.maDonHang}` },
      select: { id: true, trangThai: true },
    });

    if (!reservation) {
      throw new BadRequestException('Hệ thống chưa ghi nhận được trạng thái giữ hàng của đơn sau đối soát. Vui lòng liên hệ tổng đài AgriMarket để được hỗ trợ.');
    }

    return {
      gateway,
      paymentId,
      transactionId,
      donHangId: transaction.thanhToan.donHang.id,
      maDonHang: transaction.thanhToan.donHang.maDonHang,
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
