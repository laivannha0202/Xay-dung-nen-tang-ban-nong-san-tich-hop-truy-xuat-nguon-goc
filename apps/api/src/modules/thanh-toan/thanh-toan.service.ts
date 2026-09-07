import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../database/prisma.service';
import {
  TrangThaiDatChoTonKho,
  TrangThaiThanhToan,
} from '../../generated/prisma/client';
import { DatChoTonKhoService } from '../ton-kho/dat-cho-ton-kho.service';

import type { ThanhToanPhanHoiDto } from './dto/phan-hoi-thanh-toan.dto';
import type {
  KetQuaMock054,
  TaoThanhToanDto,
} from './dto/tao-thanh-toan.dto';
import { PaymentGatewayRegistry } from './gateway/payment-gateway.registry';

type HanhDongTonKho = 'SOLD' | 'RELEASE';

type TargetThanhToan = {
  trangThai: TrangThaiThanhToan;
  hanhDongTonKho: HanhDongTonKho;
};

type ExistingTransaction = {
  id: string;
  maGiaoDich: string;
  trangThai: TrangThaiThanhToan;
  phuongThuc: string;
  thanhToan: {
    id: string;
    donHangId: string;
    phuongThuc: string;
    trangThai: TrangThaiThanhToan;
    donHang: {
      id: string;
      maDonHang: string;
      khachHang: {
        nguoiDungId: string;
      };
    };
  };
};

@Injectable()
export class ThanhToanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly datChoTonKhoService: DatChoTonKhoService,
    private readonly gatewayRegistry: PaymentGatewayRegistry,
    private readonly configService: ConfigService,
  ) {}

  async tao(
    nguoiDungId: string,
    dto: TaoThanhToanDto,
    ipAddress = '127.0.0.1',
  ): Promise<ThanhToanPhanHoiDto> {
    this.validateMock(dto);

    if (dto.phuongThuc === 'VNPAY_SANDBOX') {
      return this.taoVnPaySandbox(
        nguoiDungId,
        dto,
        ipAddress,
      );
    }

    const maGiaoDich = this.maGiaoDich(dto.maYeuCau);
    const target = this.target(dto);

    const existing = await this.timGiaoDich(maGiaoDich);

    if (existing) {
      this.validateExisting(
        existing,
        nguoiDungId,
        dto,
        target,
      );

      if (
        existing.trangThai !== TrangThaiThanhToan.CREATED
      ) {
        return this.layPhanHoi(existing.thanhToan.id);
      }

      await this.hoanTat(
        existing.thanhToan.id,
        existing.id,
        existing.thanhToan.donHang.maDonHang,
        target,
      );

      return this.layPhanHoi(existing.thanhToan.id);
    }

    const order = await this.prisma.donHang.findUnique({
      where: {
        id: dto.donHangId,
      },
      include: {
        khachHang: {
          select: {
            nguoiDungId: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng.',
      );
    }

    if (
      order.khachHang.nguoiDungId !== nguoiDungId
    ) {
      throw new ForbiddenException(
        'Không được thanh toán đơn hàng của khách khác.',
      );
    }

    const reservation =
      await this.prisma.datChoTonKho.findUnique({
        where: {
          maThamChieu: this.maReservation(
            order.maDonHang,
          ),
        },
        select: {
          id: true,
          trangThai: true,
        },
      });

    if (!reservation) {
      throw new BadRequestException(
        'Đơn hàng không có inventory reservation.',
      );
    }

    if (
      reservation.trangThai !==
      TrangThaiDatChoTonKho.DANG_GIU
    ) {
      throw new BadRequestException(
        `Inventory reservation không còn DANG_GIU: ${reservation.trangThai}.`,
      );
    }

    let created:
      | {
          paymentId: string;
          transactionId: string;
        }
      | undefined;

    try {
      created =
        await this.prisma.$transaction(
          async (tx) => {
            const payment =
              await tx.thanhToan.create({
                data: {
                  donHangId: order.id,
                  soTien: order.tongTien,
                  phuongThuc: dto.phuongThuc,
                  trangThai:
                    TrangThaiThanhToan.CREATED,
                },
                select: {
                  id: true,
                },
              });

            const transaction =
              await tx.giaoDichThanhToan.create({
                data: {
                  thanhToanId: payment.id,
                  maGiaoDich,
                  soTien: order.tongTien,
                  phuongThuc: dto.phuongThuc,
                  trangThai:
                    TrangThaiThanhToan.CREATED,
                },
                select: {
                  id: true,
                },
              });

            return {
              paymentId: payment.id,
              transactionId: transaction.id,
            };
          },
        );
    } catch (error) {
      if (!this.laLoiUnique(error)) {
        throw error;
      }

      const raced =
        await this.timGiaoDich(maGiaoDich);

      if (!raced) {
        throw error;
      }

      this.validateExisting(
        raced,
        nguoiDungId,
        dto,
        target,
      );

      if (
        raced.trangThai ===
        TrangThaiThanhToan.CREATED
      ) {
        await this.hoanTat(
          raced.thanhToan.id,
          raced.id,
          raced.thanhToan.donHang.maDonHang,
          target,
        );
      }

      return this.layPhanHoi(
        raced.thanhToan.id,
      );
    }

    await this.hoanTat(
      created.paymentId,
      created.transactionId,
      order.maDonHang,
      target,
    );

    return this.layPhanHoi(
      created.paymentId,
    );
  }

  private async taoVnPaySandbox(
    nguoiDungId: string,
    dto: TaoThanhToanDto,
    ipAddress: string,
  ): Promise<ThanhToanPhanHoiDto> {
    const maGiaoDich =
      this.maGiaoDichVnPay(dto.maYeuCau);

    const existing =
      await this.timGiaoDich(maGiaoDich);

    if (existing) {
      return this.taoVnPayTuExisting(
        existing,
        nguoiDungId,
        dto,
        ipAddress,
      );
    }

    const order = await this.prisma.donHang.findUnique({
      where: {
        id: dto.donHangId,
      },
      include: {
        khachHang: {
          select: {
            nguoiDungId: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng.',
      );
    }

    if (
      order.khachHang.nguoiDungId !== nguoiDungId
    ) {
      throw new ForbiddenException(
        'Không được thanh toán đơn hàng của khách khác.',
      );
    }

    const reservation =
      await this.prisma.datChoTonKho.findUnique({
        where: {
          maThamChieu: this.maReservation(
            order.maDonHang,
          ),
        },
        select: {
          id: true,
          trangThai: true,
        },
      });

    if (!reservation) {
      throw new BadRequestException(
        'Đơn hàng không có inventory reservation.',
      );
    }

    if (
      reservation.trangThai !==
      TrangThaiDatChoTonKho.DANG_GIU
    ) {
      throw new BadRequestException(
        `Inventory reservation không còn DANG_GIU: ${reservation.trangThai}.`,
      );
    }

    try {
      await this.prisma.$transaction(
        async (tx) => {
          const payment =
            await tx.thanhToan.create({
              data: {
                donHangId: order.id,
                soTien: order.tongTien,
                phuongThuc: 'VNPAY_SANDBOX',
                trangThai:
                  TrangThaiThanhToan.PENDING,
              },
              select: {
                id: true,
              },
            });

          await tx.giaoDichThanhToan.create({
            data: {
              thanhToanId: payment.id,
              maGiaoDich,
              soTien: order.tongTien,
              phuongThuc: 'VNPAY_SANDBOX',
              trangThai:
                TrangThaiThanhToan.PENDING,
            },
          });
        },
      );
    } catch (error) {
      if (!this.laLoiUnique(error)) {
        throw error;
      }

      const raced =
        await this.timGiaoDich(maGiaoDich);

      if (!raced) {
        throw error;
      }

      return this.taoVnPayTuExisting(
        raced,
        nguoiDungId,
        dto,
        ipAddress,
      );
    }

    const created =
      await this.timGiaoDich(maGiaoDich);

    if (!created) {
      throw new BadRequestException(
        'Không đọc lại được Payment VNPay vừa tạo.',
      );
    }

    return this.taoVnPayTuExisting(
      created,
      nguoiDungId,
      dto,
      ipAddress,
    );
  }

  private async taoVnPayTuExisting(
    existing: ExistingTransaction,
    nguoiDungId: string,
    dto: TaoThanhToanDto,
    ipAddress: string,
  ): Promise<ThanhToanPhanHoiDto> {
    if (
      existing.thanhToan.donHang.khachHang
        .nguoiDungId !== nguoiDungId
    ) {
      throw new ForbiddenException(
        'Idempotency key thuộc khách hàng khác.',
      );
    }

    if (
      existing.thanhToan.donHangId !==
      dto.donHangId
    ) {
      throw new ConflictException(
        'Idempotency key đã dùng cho đơn hàng khác.',
      );
    }

    if (
      existing.phuongThuc !==
        'VNPAY_SANDBOX' ||
      existing.thanhToan.phuongThuc !==
        'VNPAY_SANDBOX'
    ) {
      throw new ConflictException(
        'Idempotency key đã dùng cho phương thức khác.',
      );
    }

    if (
      existing.trangThai ===
        TrangThaiThanhToan.PAID &&
      existing.thanhToan.trangThai ===
        TrangThaiThanhToan.PAID
    ) {
      return this.layPhanHoi(
        existing.thanhToan.id,
      );
    }

    const allowedStates =
      new Set<TrangThaiThanhToan>([
        TrangThaiThanhToan.CREATED,
        TrangThaiThanhToan.PENDING,
      ]);

    if (
      !allowedStates.has(
        existing.trangThai,
      ) ||
      !allowedStates.has(
        existing.thanhToan.trangThai,
      )
    ) {
      throw new ConflictException(
        'Payment online đã ở trạng thái cuối cùng và không thể mở lại.',
      );
    }

    const payment = await this.layPhanHoi(
      existing.thanhToan.id,
    );

    if (
      payment.datCho.trangThai !==
      TrangThaiDatChoTonKho.DANG_GIU
    ) {
      throw new ConflictException(
        `Inventory reservation không còn DANG_GIU: ${payment.datCho.trangThai}.`,
      );
    }

    const gateway =
      this.gatewayRegistry.get(
        'VNPAY_SANDBOX',
      );

    const gatewayResult =
      await gateway.createPayment({
        maGiaoDich: existing.maGiaoDich,
        soTien: payment.soTien,
        noiDung:
          `Thanh toan don hang ${payment.maDonHang}`,
        returnUrl:
          `${this.paymentPublicBaseUrl()}` +
          '/api/v1/thanh-toan/callback/' +
          'VNPAY_SANDBOX/mobile',
        ipAddress:
          this.chuanHoaIp(ipAddress),
        locale: 'vn',
        expiresInMinutes: 15,
      });

    return {
      ...payment,
      paymentUrl:
        gatewayResult.paymentUrl,
      expiresAt:
        gatewayResult.expiresAt,
    };
  }

  async layTheoDonHangCuaToi(
    nguoiDungId: string,
    donHangId: string,
  ): Promise<ThanhToanPhanHoiDto> {
    const payment =
      await this.prisma.thanhToan.findFirst({
        where: {
          donHangId,
        },
        orderBy: [
          {
            createdAt: 'desc',
          },
          {
            id: 'desc',
          },
        ],
        select: {
          id: true,
          donHang: {
            select: {
              khachHang: {
                select: {
                  nguoiDungId: true,
                },
              },
            },
          },
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Đơn hàng chưa có thanh toán.',
      );
    }

    if (
      payment.donHang.khachHang
        .nguoiDungId !== nguoiDungId
    ) {
      throw new ForbiddenException(
        'Không được xem thanh toán của khách hàng khác.',
      );
    }

    return this.layPhanHoi(payment.id);
  }

  private async hoanTat(
    paymentId: string,
    transactionId: string,
    maDonHang: string,
    target: TargetThanhToan,
  ): Promise<void> {
    const reservation =
      await this.prisma.datChoTonKho.findUnique({
        where: {
          maThamChieu:
            this.maReservation(maDonHang),
        },
        select: {
          id: true,
          trangThai: true,
        },
      });

    if (!reservation) {
      await this.danhDauFailed(
        paymentId,
        transactionId,
      );

      throw new BadRequestException(
        'Inventory reservation không tồn tại.',
      );
    }

    try {
      if (
        target.hanhDongTonKho ===
        'SOLD'
      ) {
        if (
          reservation.trangThai ===
          TrangThaiDatChoTonKho.DANG_GIU
        ) {
          await this.datChoTonKhoService.xacNhanDaBan(
            reservation.id,
          );
        } else if (
          reservation.trangThai !==
          TrangThaiDatChoTonKho.DA_BAN
        ) {
          throw new BadRequestException(
            `Không thể commit inventory từ trạng thái ${reservation.trangThai}.`,
          );
        }
      } else if (
        reservation.trangThai ===
        TrangThaiDatChoTonKho.DANG_GIU
      ) {
        await this.datChoTonKhoService.giaiPhong(
          reservation.id,
        );
      } else if (
        reservation.trangThai !==
          TrangThaiDatChoTonKho.DA_GIAI_PHONG &&
        reservation.trangThai !==
          TrangThaiDatChoTonKho.HET_HAN
      ) {
        throw new BadRequestException(
          `Không thể release inventory từ trạng thái ${reservation.trangThai}.`,
        );
      }
    } catch (error) {
      await this.danhDauFailed(
        paymentId,
        transactionId,
      );
      throw error;
    }

    await this.prisma.$transaction([
      this.prisma.thanhToan.update({
        where: {
          id: paymentId,
        },
        data: {
          trangThai:
            target.trangThai,
        },
      }),
      this.prisma.giaoDichThanhToan.update({
        where: {
          id: transactionId,
        },
        data: {
          trangThai:
            target.trangThai,
          thoiGian: new Date(),
        },
      }),
    ]);
  }

  private async danhDauFailed(
    paymentId: string,
    transactionId: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.thanhToan.updateMany({
        where: {
          id: paymentId,
          trangThai:
            TrangThaiThanhToan.CREATED,
        },
        data: {
          trangThai:
            TrangThaiThanhToan.FAILED,
        },
      }),
      this.prisma.giaoDichThanhToan.updateMany({
        where: {
          id: transactionId,
          trangThai:
            TrangThaiThanhToan.CREATED,
        },
        data: {
          trangThai:
            TrangThaiThanhToan.FAILED,
          thoiGian: new Date(),
        },
      }),
    ]);
  }

  private async timGiaoDich(
    maGiaoDich: string,
  ): Promise<ExistingTransaction | null> {
    return this.prisma.giaoDichThanhToan.findUnique({
      where: {
        maGiaoDich,
      },
      select: {
        id: true,
        maGiaoDich: true,
        trangThai: true,
        phuongThuc: true,
        thanhToan: {
          select: {
            id: true,
            donHangId: true,
            phuongThuc: true,
            trangThai: true,
            donHang: {
              select: {
                id: true,
                maDonHang: true,
                khachHang: {
                  select: {
                    nguoiDungId: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private validateExisting(
    existing: ExistingTransaction,
    nguoiDungId: string,
    dto: TaoThanhToanDto,
    target: TargetThanhToan,
  ): void {
    if (
      existing.thanhToan.donHang.khachHang
        .nguoiDungId !== nguoiDungId
    ) {
      throw new ForbiddenException(
        'Idempotency key thuộc khách hàng khác.',
      );
    }

    if (
      existing.thanhToan.donHangId !==
      dto.donHangId
    ) {
      throw new ConflictException(
        'Idempotency key đã dùng cho đơn hàng khác.',
      );
    }

    if (
      existing.phuongThuc !==
        dto.phuongThuc ||
      existing.thanhToan.phuongThuc !==
        dto.phuongThuc
    ) {
      throw new ConflictException(
        'Idempotency key đã dùng cho phương thức khác.',
      );
    }

    const allowedStates = new Set([
      TrangThaiThanhToan.CREATED,
      target.trangThai,
    ]);

    if (
      !allowedStates.has(existing.trangThai)
    ) {
      throw new ConflictException(
        'Idempotency key đã hoàn tất với kết quả khác.',
      );
    }

    if (
      !allowedStates.has(
        existing.thanhToan.trangThai,
      )
    ) {
      throw new ConflictException(
        'Payment đã hoàn tất với kết quả khác.',
      );
    }
  }

  private validateMock(
    dto: TaoThanhToanDto,
  ): void {
    if (
      dto.phuongThuc === 'MOCK' &&
      !dto.ketQuaMock
    ) {
      throw new BadRequestException(
        'MOCK bắt buộc có ketQuaMock.',
      );
    }

    if (
      dto.phuongThuc !== 'MOCK' &&
      dto.ketQuaMock !== undefined
    ) {
      throw new BadRequestException(
        `${dto.phuongThuc} không nhận ketQuaMock.`,
      );
    }
  }

  private target(
    dto: TaoThanhToanDto,
  ): TargetThanhToan {
    if (
      dto.phuongThuc === 'COD'
    ) {
      return {
        trangThai:
          TrangThaiThanhToan.PENDING,
        hanhDongTonKho: 'SOLD',
      };
    }

    if (
      dto.ketQuaMock ===
      ('THANH_CONG' satisfies KetQuaMock054)
    ) {
      return {
        trangThai:
          TrangThaiThanhToan.PAID,
        hanhDongTonKho: 'SOLD',
      };
    }

    return {
      trangThai:
        TrangThaiThanhToan.FAILED,
      hanhDongTonKho: 'RELEASE',
    };
  }

  private async layPhanHoi(
    paymentId: string,
  ): Promise<ThanhToanPhanHoiDto> {
    const payment =
      await this.prisma.thanhToan.findUnique({
        where: {
          id: paymentId,
        },
        include: {
          donHang: true,
          giaoDich: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Không tìm thấy payment.',
      );
    }

    const transaction =
      payment.giaoDich[0];

    if (!transaction) {
      throw new BadRequestException(
        'Payment thiếu payment transaction.',
      );
    }

    const reservation =
      await this.prisma.datChoTonKho.findUnique({
        where: {
          maThamChieu:
            this.maReservation(
              payment.donHang.maDonHang,
            ),
        },
      });

    if (!reservation) {
      throw new BadRequestException(
        'Payment thiếu inventory reservation tương ứng.',
      );
    }

    return {
      id: payment.id,
      donHangId: payment.donHangId,
      maDonHang:
        payment.donHang.maDonHang,
      soTien: Number(payment.soTien),
      phuongThuc:
        payment.phuongThuc,
      trangThai:
        payment.trangThai,
      giaoDich: {
        id: transaction.id,
        maGiaoDich:
          transaction.maGiaoDich,
        soTien:
          Number(transaction.soTien),
        phuongThuc:
          transaction.phuongThuc,
        trangThai:
          transaction.trangThai,
        thoiGian:
          transaction.thoiGian,
      },
      datCho: {
        id: reservation.id,
        trangThai:
          reservation.trangThai,
        hetHanLuc:
          reservation.hetHanLuc,
      },
    };
  }

  private paymentPublicBaseUrl(): string {
    const raw = this.configService
      .get<string>(
        'PAYMENT_PUBLIC_BASE_URL',
      )
      ?.trim()
      .replace(/\/+$/, '');

    if (!raw) {
      throw new BadRequestException(
        'Thiếu PAYMENT_PUBLIC_BASE_URL để tạo VNPay return URL.',
      );
    }

    let parsed: URL;

    try {
      parsed = new URL(raw);
    } catch {
      throw new BadRequestException(
        'PAYMENT_PUBLIC_BASE_URL không phải URL hợp lệ.',
      );
    }

    if (
      parsed.protocol !== 'http:' &&
      parsed.protocol !== 'https:'
    ) {
      throw new BadRequestException(
        'PAYMENT_PUBLIC_BASE_URL phải dùng http hoặc https.',
      );
    }

    return raw;
  }

  private chuanHoaIp(
    value: string,
  ): string {
    const raw = value.trim();

    if (
      !raw ||
      raw === '::1'
    ) {
      return '127.0.0.1';
    }

    if (
      raw.startsWith('::ffff:')
    ) {
      return raw.slice(
        '::ffff:'.length,
      );
    }

    return raw;
  }

  private maGiaoDich(
    maYeuCau: string,
  ): string {
    return (
      'PAY-' +
      maYeuCau
        .replaceAll('-', '')
        .toUpperCase()
    );
  }

  /**
   * VNPay TxnRef được gateway giới hạn alpha-numeric.
   * Lưu DB ngay từ đầu cùng format để callback lookup khớp 1:1.
   */
  private maGiaoDichVnPay(
    maYeuCau: string,
  ): string {
    return (
      'PAY' +
      maYeuCau
        .replaceAll('-', '')
        .toUpperCase()
    );
  }

  private maReservation(
    maDonHang: string,
  ): string {
    return `ORDER:${maDonHang}`;
  }

  private laLoiUnique(
    error: unknown,
  ): boolean {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('code' in error)
    ) {
      return false;
    }

    return (
      error as {
        code?: unknown;
      }
    ).code === 'P2002';
  }
}
