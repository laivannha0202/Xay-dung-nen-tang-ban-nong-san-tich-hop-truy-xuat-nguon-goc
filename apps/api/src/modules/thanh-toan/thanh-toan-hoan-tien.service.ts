import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiThanhToan } from '../../generated/prisma/client';

import type { HoanTienThanhToanDto } from './dto/hoan-tien-thanh-toan.dto';
import type { HoanTienThanhToanPhanHoiDto } from './dto/phan-hoi-hoan-tien-thanh-toan.dto';
import {
  TEN_PAYMENT_GATEWAY,
  type RefundGatewayResult,
  type TenPaymentGateway,
} from './gateway/payment-gateway.adapter';
import { PaymentGatewayRegistry } from './gateway/payment-gateway.registry';

const REFUND_PREFIX = 'REFUND-';
const REFUND_RESERVED_STATES: TrangThaiThanhToan[] = [
  TrangThaiThanhToan.CREATED,
  TrangThaiThanhToan.PARTIALLY_REFUNDED,
  TrangThaiThanhToan.REFUNDED,
];
const REFUND_SUCCESS_STATES: TrangThaiThanhToan[] = [
  TrangThaiThanhToan.PARTIALLY_REFUNDED,
  TrangThaiThanhToan.REFUNDED,
];

type RefundReservation = {
  gateway: TenPaymentGateway;
  originalReference: string;
  transactionDate: string;
  transactionType: 'FULL' | 'PARTIAL';
  refundTransactionId: string;
  maGiaoDichHoanTien: string;
  daXuLyTruoc: boolean;
};

@Injectable()
export class ThanhToanHoanTienService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: PaymentGatewayRegistry,
  ) {}

  async hoanTien(
    nguoiDungId: string,
    thanhToanId: string,
    dto: HoanTienThanhToanDto,
    ipAddress: string,
  ): Promise<HoanTienThanhToanPhanHoiDto> {
    this.validateInput(dto);

    const reserved = await this.reserve(thanhToanId, dto);

    if (reserved.daXuLyTruoc) {
      return this.layPhanHoi(thanhToanId, reserved.maGiaoDichHoanTien, dto.maYeuCau, true);
    }

    const gateway = this.registry.get(reserved.gateway);
    let result: RefundGatewayResult;

    try {
      result = await gateway.refund({
        requestId: this.requestId(dto.maYeuCau),
        externalReference: reserved.originalReference,
        amount: dto.soTien,
        transactionDate: reserved.transactionDate,
        transactionType: reserved.transactionType,
        reason: dto.lyDo.trim(),
        requestedBy: nguoiDungId,
        ipAddress,
      });
    } catch (error) {
      // Không đánh FAILED khi chưa biết gateway có xử lý hay chưa.
      // Giữ CREATED để caller retry đúng cùng maYeuCau/requestId.
      const message = error instanceof Error ? error.message : 'Payment gateway refund lỗi.';
      throw new BadGatewayException(
        `Không xác minh được kết quả refund; hãy retry cùng maYeuCau. ${message}`,
      );
    }

    if (result.gateway !== reserved.gateway || !result.validSignature) {
      // Response không đáng tin: giữ CREATED để retry cùng request id.
      throw new BadGatewayException(
        'Refund gateway response không xác minh được; hãy retry cùng maYeuCau.',
      );
    }

    if (!result.accepted) {
      await this.danhDauFailed(reserved.refundTransactionId);
      throw new BadGatewayException(
        `Payment gateway từ chối refund${result.responseCode ? ` (${result.responseCode})` : ''}.`,
      );
    }

    await this.finalize(thanhToanId, reserved.refundTransactionId);
    return this.layPhanHoi(thanhToanId, reserved.maGiaoDichHoanTien, dto.maYeuCau, false);
  }

  private async reserve(
    thanhToanId: string,
    dto: HoanTienThanhToanDto,
  ): Promise<RefundReservation> {
    const maGiaoDich = this.maGiaoDich(dto.maYeuCau);

    return this.prisma.$transaction(async (tx) => {
      await this.lockPayment(tx, thanhToanId);

      const payment = await tx.thanhToan.findUnique({
        where: { id: thanhToanId },
        include: {
          donHang: true,
          giaoDich: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Không tìm thấy Payment để hoàn tiền.');
      }

      const existing = await tx.giaoDichThanhToan.findUnique({
        where: { maGiaoDich },
      });

      if (existing) {
        if (existing.thanhToanId !== thanhToanId) {
          throw new ConflictException('maYeuCau refund đã dùng cho Payment khác.');
        }
        if (Math.abs(Number(existing.soTien) - dto.soTien) >= 0.005) {
          throw new ConflictException('maYeuCau refund đã dùng với số tiền khác.');
        }
        if (!existing.maGiaoDich.startsWith(REFUND_PREFIX)) {
          throw new ConflictException('maYeuCau xung đột payment transaction hiện có.');
        }
        if (REFUND_SUCCESS_STATES.includes(existing.trangThai)) {
          const gateway = this.gatewayName(existing.phuongThuc);
          const original = this.originalPaidTransaction(payment.giaoDich, payment.phuongThuc);
          this.validateOriginalAmount(original.soTien, Number(payment.soTien));
          return {
            gateway,
            originalReference: original.maGiaoDich,
            transactionDate: this.formatGatewayDate(original.thoiGian),
            transactionType: 'PARTIAL',
            refundTransactionId: existing.id,
            maGiaoDichHoanTien: existing.maGiaoDich,
            daXuLyTruoc: true,
          };
        }
        if (existing.trangThai === TrangThaiThanhToan.FAILED) {
          throw new ConflictException(
            'maYeuCau refund trước đã bị gateway từ chối; dùng maYeuCau mới nếu muốn thử lại.',
          );
        }
        if (existing.trangThai !== TrangThaiThanhToan.CREATED) {
          throw new ConflictException(`Refund request đang ở trạng thái ${existing.trangThai}.`);
        }

        this.validateRefundablePayment(payment.trangThai);
        const gateway = this.gatewayName(payment.phuongThuc);
        if (existing.phuongThuc !== gateway) {
          throw new ConflictException('maYeuCau refund đã dùng với gateway khác.');
        }
        const original = this.originalPaidTransaction(payment.giaoDich, payment.phuongThuc);
        this.validateOriginalAmount(original.soTien, Number(payment.soTien));
        return {
          gateway,
          originalReference: original.maGiaoDich,
          transactionDate: this.formatGatewayDate(original.thoiGian),
          transactionType: this.transactionType(
            payment.giaoDich,
            Number(payment.soTien),
            dto.soTien,
          ),
          refundTransactionId: existing.id,
          maGiaoDichHoanTien: existing.maGiaoDich,
          daXuLyTruoc: false,
        };
      }

      this.validateRefundablePayment(payment.trangThai);
      const gateway = this.gatewayName(payment.phuongThuc);
      const original = this.originalPaidTransaction(payment.giaoDich, payment.phuongThuc);
      const paidAmount = Number(payment.soTien);
      this.validateOriginalAmount(original.soTien, paidAmount);
      const reservedAmount = this.sumRefund(payment.giaoDich, REFUND_RESERVED_STATES);

      if (this.toCents(reservedAmount + dto.soTien) > this.toCents(paidAmount)) {
        throw new BadRequestException(
          `Tổng refund vượt paid amount. Đã giữ/hoàn ${reservedAmount}, paid amount ${paidAmount}.`,
        );
      }

      const created = await tx.giaoDichThanhToan.create({
        data: {
          thanhToanId,
          maGiaoDich,
          soTien: dto.soTien,
          phuongThuc: gateway,
          trangThai: TrangThaiThanhToan.CREATED,
          thoiGian: new Date(),
        },
      });

      return {
        gateway,
        originalReference: original.maGiaoDich,
        transactionDate: this.formatGatewayDate(original.thoiGian),
        transactionType: this.transactionType(payment.giaoDich, paidAmount, dto.soTien),
        refundTransactionId: created.id,
        maGiaoDichHoanTien: created.maGiaoDich,
        daXuLyTruoc: false,
      };
    });
  }

  private async finalize(thanhToanId: string, refundTransactionId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.lockPayment(tx, thanhToanId);
      const payment = await tx.thanhToan.findUnique({
        where: { id: thanhToanId },
        include: {
          giaoDich: true,
        },
      });
      if (!payment) {
        throw new NotFoundException('Payment biến mất khi finalize refund.');
      }
      const current = payment.giaoDich.find((item) => item.id === refundTransactionId);
      if (!current) {
        throw new ConflictException('Refund transaction không còn thuộc Payment.');
      }
      if (REFUND_SUCCESS_STATES.includes(current.trangThai)) {
        return;
      }
      if (current.trangThai !== TrangThaiThanhToan.CREATED) {
        throw new ConflictException(
          `Refund transaction không thể finalize từ ${current.trangThai}.`,
        );
      }

      const paidAmount = Number(payment.soTien);
      const successfulBefore = this.sumRefund(
        payment.giaoDich.filter((item) => item.id !== current.id),
        REFUND_SUCCESS_STATES,
      );
      const successfulAfter = successfulBefore + Number(current.soTien);
      if (this.toCents(successfulAfter) > this.toCents(paidAmount)) {
        throw new ConflictException('Invariant refund <= paid amount bị vi phạm khi finalize.');
      }

      const target =
        this.toCents(successfulAfter) === this.toCents(paidAmount)
          ? TrangThaiThanhToan.REFUNDED
          : TrangThaiThanhToan.PARTIALLY_REFUNDED;

      await tx.giaoDichThanhToan.update({
        where: { id: current.id },
        data: { trangThai: target, thoiGian: new Date() },
      });
      await tx.thanhToan.update({
        where: { id: thanhToanId },
        data: { trangThai: target },
      });
    });
  }

  private async danhDauFailed(refundTransactionId: string): Promise<void> {
    await this.prisma.giaoDichThanhToan.updateMany({
      where: {
        id: refundTransactionId,
        trangThai: TrangThaiThanhToan.CREATED,
      },
      data: {
        trangThai: TrangThaiThanhToan.FAILED,
        thoiGian: new Date(),
      },
    });
  }

  private async layPhanHoi(
    thanhToanId: string,
    maGiaoDichHoanTien: string,
    maYeuCau: string,
    daXuLyTruoc: boolean,
  ): Promise<HoanTienThanhToanPhanHoiDto> {
    const payment = await this.prisma.thanhToan.findUnique({
      where: { id: thanhToanId },
      include: { donHang: true, giaoDich: true },
    });
    if (!payment) {
      throw new NotFoundException('Không tìm thấy Payment sau refund.');
    }
    const refund = payment.giaoDich.find((item) => item.maGiaoDich === maGiaoDichHoanTien);
    if (!refund || !REFUND_SUCCESS_STATES.includes(refund.trangThai)) {
      throw new ConflictException('Refund chưa ở trạng thái thành công.');
    }
    const paidAmount = Number(payment.soTien);
    const totalRefunded = this.sumRefund(payment.giaoDich, REFUND_SUCCESS_STATES);
    const gateway = this.gatewayName(refund.phuongThuc);

    return {
      paymentId: payment.id,
      donHangId: payment.donHangId,
      maDonHang: payment.donHang.maDonHang,
      gateway,
      maYeuCau,
      refundTransactionId: refund.id,
      maGiaoDichHoanTien: refund.maGiaoDich,
      soTienDaThanhToan: paidAmount,
      soTienHoan: Number(refund.soTien),
      tongDaHoan: totalRefunded,
      conLai: Math.max(0, paidAmount - totalRefunded),
      trangThaiThanhToan: payment.trangThai,
      trangThaiGiaoDichHoanTien: refund.trangThai,
      daXuLyTruoc,
    };
  }

  private async lockPayment(tx: Prisma.TransactionClient, thanhToanId: string): Promise<void> {
    const rows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
      'SELECT `id` FROM `payment` WHERE `id` = ? FOR UPDATE',
      thanhToanId,
    );
    if (rows.length === 0) {
      throw new NotFoundException('Không tìm thấy Payment để hoàn tiền.');
    }
  }

  private validateInput(dto: HoanTienThanhToanDto): void {
    if (!Number.isFinite(dto.soTien) || dto.soTien <= 0 || this.toCents(dto.soTien) <= 0) {
      throw new BadRequestException('Số tiền refund phải > 0.');
    }
    if (Math.abs(dto.soTien * 100 - Math.round(dto.soTien * 100)) > 1e-6) {
      throw new BadRequestException('Số tiền refund chỉ hỗ trợ tối đa 2 chữ số thập phân.');
    }
    if (dto.lyDo.trim().length < 3) {
      throw new BadRequestException('Lý do refund quá ngắn.');
    }
  }

  private validateRefundablePayment(status: TrangThaiThanhToan): void {
    if (status !== TrangThaiThanhToan.PAID && status !== TrangThaiThanhToan.PARTIALLY_REFUNDED) {
      throw new ConflictException(
        `Chỉ Payment PAID/PARTIALLY_REFUNDED mới được refund: ${status}.`,
      );
    }
  }

  private gatewayName(method: string): TenPaymentGateway {
    if ((TEN_PAYMENT_GATEWAY as readonly string[]).includes(method)) {
      return method as TenPaymentGateway;
    }
    throw new BadRequestException(`Payment method không hỗ trợ adapter refund: ${method}.`);
  }

  private originalPaidTransaction(
    transactions: Array<{
      maGiaoDich: string;
      phuongThuc: string;
      trangThai: TrangThaiThanhToan;
      thoiGian: Date;
      soTien: { toString(): string } | number;
    }>,
    paymentMethod: string,
  ) {
    const candidates = transactions.filter(
      (item) =>
        !item.maGiaoDich.startsWith(REFUND_PREFIX) && item.trangThai === TrangThaiThanhToan.PAID,
    );
    const original = candidates.at(-1);
    if (!original) {
      throw new ConflictException('Payment không có PAID transaction gốc để gọi refund adapter.');
    }
    if (original.phuongThuc !== paymentMethod) {
      throw new ConflictException('Payment method không khớp PAID transaction gốc.');
    }
    return original;
  }

  private validateOriginalAmount(
    originalAmount: { toString(): string } | number,
    paidAmount: number,
  ): void {
    if (this.toCents(Number(originalAmount)) !== this.toCents(paidAmount)) {
      throw new ConflictException('PAID transaction gốc không khớp paid amount của Payment.');
    }
  }

  private sumRefund(
    transactions: Array<{
      maGiaoDich: string;
      trangThai: TrangThaiThanhToan;
      soTien: { toString(): string } | number;
    }>,
    states: readonly TrangThaiThanhToan[],
  ): number {
    return transactions
      .filter(
        (item) => item.maGiaoDich.startsWith(REFUND_PREFIX) && states.includes(item.trangThai),
      )
      .reduce((sum, item) => sum + Number(item.soTien), 0);
  }

  private transactionType(
    transactions: Array<{
      maGiaoDich: string;
      trangThai: TrangThaiThanhToan;
      soTien: { toString(): string } | number;
    }>,
    paidAmount: number,
    requested: number,
  ): 'FULL' | 'PARTIAL' {
    const successful = this.sumRefund(transactions, REFUND_SUCCESS_STATES);
    return this.toCents(successful) === 0 && this.toCents(requested) === this.toCents(paidAmount)
      ? 'FULL'
      : 'PARTIAL';
  }

  private maGiaoDich(maYeuCau: string): string {
    return REFUND_PREFIX + this.requestId(maYeuCau);
  }

  private requestId(maYeuCau: string): string {
    return maYeuCau.replaceAll('-', '').toUpperCase();
  }

  private toCents(value: number): number {
    return Math.round(value * 100);
  }

  private formatGatewayDate(value: Date): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = new Map(formatter.formatToParts(value).map((part) => [part.type, part.value]));
    return (
      (parts.get('year') ?? '') +
      (parts.get('month') ?? '') +
      (parts.get('day') ?? '') +
      (parts.get('hour') ?? '') +
      (parts.get('minute') ?? '') +
      (parts.get('second') ?? '')
    );
  }
}
