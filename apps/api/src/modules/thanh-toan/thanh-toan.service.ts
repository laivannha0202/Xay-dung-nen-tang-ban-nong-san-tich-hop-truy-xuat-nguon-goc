import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiDatChoTonKho, TrangThaiThanhToan } from '../../generated/prisma/client';
import { DatChoTonKhoService } from '../ton-kho/dat-cho-ton-kho.service';

import type { ThanhToanPhanHoiDto } from './dto/phan-hoi-thanh-toan.dto';
import type { KetQuaMock054, TaoThanhToanDto } from './dto/tao-thanh-toan.dto';

type HanhDongTonKho = 'SOLD' | 'RELEASE';

type TargetThanhToan = {
  trangThai: TrangThaiThanhToan;
  hanhDongTonKho: HanhDongTonKho;
};

type ExistingTransaction = {
  id: string;
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
  ) {}

  async tao(nguoiDungId: string, dto: TaoThanhToanDto): Promise<ThanhToanPhanHoiDto> {
    this.validateMock(dto);

    const maGiaoDich = this.maGiaoDich(dto.maYeuCau);
    const target = this.target(dto);

    const existing = await this.timGiaoDich(maGiaoDich);

    if (existing) {
      this.validateExisting(existing, nguoiDungId, dto, target);

      if (existing.trangThai !== TrangThaiThanhToan.CREATED) {
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
      where: { id: dto.donHangId },
      include: {
        khachHang: {
          select: {
            nguoiDungId: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    if (order.khachHang.nguoiDungId !== nguoiDungId) {
      throw new ForbiddenException('Không được thanh toán đơn hàng của khách khác.');
    }

    const reservation = await this.prisma.datChoTonKho.findUnique({
      where: {
        maThamChieu: this.maReservation(order.maDonHang),
      },
      select: {
        id: true,
        trangThai: true,
      },
    });

    if (!reservation) {
      throw new BadRequestException('Đơn hàng không có inventory reservation.');
    }

    if (reservation.trangThai !== TrangThaiDatChoTonKho.DANG_GIU) {
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
      created = await this.prisma.$transaction(async (tx) => {
        const payment = await tx.thanhToan.create({
          data: {
            donHangId: order.id,
            soTien: order.tongTien,
            phuongThuc: dto.phuongThuc,
            trangThai: TrangThaiThanhToan.CREATED,
          },
          select: {
            id: true,
          },
        });

        const transaction = await tx.giaoDichThanhToan.create({
          data: {
            thanhToanId: payment.id,
            maGiaoDich,
            soTien: order.tongTien,
            phuongThuc: dto.phuongThuc,
            trangThai: TrangThaiThanhToan.CREATED,
          },
          select: {
            id: true,
          },
        });

        return {
          paymentId: payment.id,
          transactionId: transaction.id,
        };
      });
    } catch (error) {
      if (!this.laLoiUnique(error)) {
        throw error;
      }

      const raced = await this.timGiaoDich(maGiaoDich);

      if (!raced) {
        throw error;
      }

      this.validateExisting(raced, nguoiDungId, dto, target);

      if (raced.trangThai === TrangThaiThanhToan.CREATED) {
        await this.hoanTat(raced.thanhToan.id, raced.id, raced.thanhToan.donHang.maDonHang, target);
      }

      return this.layPhanHoi(raced.thanhToan.id);
    }

    await this.hoanTat(created.paymentId, created.transactionId, order.maDonHang, target);

    return this.layPhanHoi(created.paymentId);
  }

  private async hoanTat(
    paymentId: string,
    transactionId: string,
    maDonHang: string,
    target: TargetThanhToan,
  ): Promise<void> {
    const reservation = await this.prisma.datChoTonKho.findUnique({
      where: {
        maThamChieu: this.maReservation(maDonHang),
      },
      select: {
        id: true,
        trangThai: true,
      },
    });

    if (!reservation) {
      await this.danhDauFailed(paymentId, transactionId);
      throw new BadRequestException('Inventory reservation không tồn tại.');
    }

    try {
      if (target.hanhDongTonKho === 'SOLD') {
        if (reservation.trangThai === TrangThaiDatChoTonKho.DANG_GIU) {
          await this.datChoTonKhoService.xacNhanDaBan(reservation.id);
        } else if (reservation.trangThai !== TrangThaiDatChoTonKho.DA_BAN) {
          throw new BadRequestException(
            `Không thể commit inventory từ trạng thái ${reservation.trangThai}.`,
          );
        }
      } else {
        if (reservation.trangThai === TrangThaiDatChoTonKho.DANG_GIU) {
          await this.datChoTonKhoService.giaiPhong(reservation.id);
        } else if (
          reservation.trangThai !== TrangThaiDatChoTonKho.DA_GIAI_PHONG &&
          reservation.trangThai !== TrangThaiDatChoTonKho.HET_HAN
        ) {
          throw new BadRequestException(
            `Không thể release inventory từ trạng thái ${reservation.trangThai}.`,
          );
        }
      }
    } catch (error) {
      await this.danhDauFailed(paymentId, transactionId);
      throw error;
    }

    await this.prisma.$transaction([
      this.prisma.thanhToan.update({
        where: { id: paymentId },
        data: {
          trangThai: target.trangThai,
        },
      }),
      this.prisma.giaoDichThanhToan.update({
        where: { id: transactionId },
        data: {
          trangThai: target.trangThai,
          thoiGian: new Date(),
        },
      }),
    ]);
  }

  private async danhDauFailed(paymentId: string, transactionId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.thanhToan.updateMany({
        where: {
          id: paymentId,
          trangThai: TrangThaiThanhToan.CREATED,
        },
        data: {
          trangThai: TrangThaiThanhToan.FAILED,
        },
      }),
      this.prisma.giaoDichThanhToan.updateMany({
        where: {
          id: transactionId,
          trangThai: TrangThaiThanhToan.CREATED,
        },
        data: {
          trangThai: TrangThaiThanhToan.FAILED,
          thoiGian: new Date(),
        },
      }),
    ]);
  }

  private async timGiaoDich(maGiaoDich: string): Promise<ExistingTransaction | null> {
    return this.prisma.giaoDichThanhToan.findUnique({
      where: { maGiaoDich },
      select: {
        id: true,
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
    if (existing.thanhToan.donHang.khachHang.nguoiDungId !== nguoiDungId) {
      throw new ForbiddenException('Idempotency key thuộc khách hàng khác.');
    }

    if (existing.thanhToan.donHangId !== dto.donHangId) {
      throw new ConflictException('Idempotency key đã dùng cho đơn hàng khác.');
    }

    if (
      existing.phuongThuc !== dto.phuongThuc ||
      existing.thanhToan.phuongThuc !== dto.phuongThuc
    ) {
      throw new ConflictException('Idempotency key đã dùng cho phương thức khác.');
    }

    const allowedStates = new Set([TrangThaiThanhToan.CREATED, target.trangThai]);

    if (!allowedStates.has(existing.trangThai)) {
      throw new ConflictException('Idempotency key đã hoàn tất với kết quả khác.');
    }

    if (!allowedStates.has(existing.thanhToan.trangThai)) {
      throw new ConflictException('Payment đã hoàn tất với kết quả khác.');
    }
  }

  private validateMock(dto: TaoThanhToanDto): void {
    if (dto.phuongThuc === 'MOCK' && !dto.ketQuaMock) {
      throw new BadRequestException('MOCK bắt buộc có ketQuaMock.');
    }

    if (dto.phuongThuc === 'COD' && dto.ketQuaMock !== undefined) {
      throw new BadRequestException('COD không nhận ketQuaMock.');
    }
  }

  private target(dto: TaoThanhToanDto): TargetThanhToan {
    if (dto.phuongThuc === 'COD') {
      return {
        trangThai: TrangThaiThanhToan.PENDING,
        hanhDongTonKho: 'SOLD',
      };
    }

    if (dto.ketQuaMock === ('THANH_CONG' satisfies KetQuaMock054)) {
      return {
        trangThai: TrangThaiThanhToan.PAID,
        hanhDongTonKho: 'SOLD',
      };
    }

    return {
      trangThai: TrangThaiThanhToan.FAILED,
      hanhDongTonKho: 'RELEASE',
    };
  }

  private async layPhanHoi(paymentId: string): Promise<ThanhToanPhanHoiDto> {
    const payment = await this.prisma.thanhToan.findUnique({
      where: { id: paymentId },
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
      throw new NotFoundException('Không tìm thấy payment.');
    }

    const transaction = payment.giaoDich[0];
    if (!transaction) {
      throw new BadRequestException('Payment thiếu payment transaction.');
    }

    const reservation = await this.prisma.datChoTonKho.findUnique({
      where: {
        maThamChieu: this.maReservation(payment.donHang.maDonHang),
      },
    });

    if (!reservation) {
      throw new BadRequestException('Payment thiếu inventory reservation tương ứng.');
    }

    return {
      id: payment.id,
      donHangId: payment.donHangId,
      maDonHang: payment.donHang.maDonHang,
      soTien: Number(payment.soTien),
      phuongThuc: payment.phuongThuc,
      trangThai: payment.trangThai,
      giaoDich: {
        id: transaction.id,
        maGiaoDich: transaction.maGiaoDich,
        soTien: Number(transaction.soTien),
        phuongThuc: transaction.phuongThuc,
        trangThai: transaction.trangThai,
        thoiGian: transaction.thoiGian,
      },
      datCho: {
        id: reservation.id,
        trangThai: reservation.trangThai,
        hetHanLuc: reservation.hetHanLuc,
      },
    };
  }

  private maGiaoDich(maYeuCau: string): string {
    return 'PAY-' + maYeuCau.replaceAll('-', '').toUpperCase();
  }

  private maReservation(maDonHang: string): string {
    return `ORDER:${maDonHang}`;
  }

  private laLoiUnique(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return false;
    }

    return (error as { code?: unknown }).code === 'P2002';
  }
}
