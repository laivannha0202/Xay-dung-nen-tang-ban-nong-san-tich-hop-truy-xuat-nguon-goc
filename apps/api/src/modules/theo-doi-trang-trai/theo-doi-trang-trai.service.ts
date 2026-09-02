import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiBanGhi } from '../../generated/prisma/client';

import type {
  DanhSachThongBaoThuHoachDto,
  DanhSachTrangTraiTheoDoiDto,
  TrangThaiTheoDoiTrangTraiDto,
} from './dto/phan-hoi-theo-doi-trang-trai.dto';

@Injectable()
export class TheoDoiTrangTraiService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(nguoiDungId: string): Promise<DanhSachTrangTraiTheoDoiDto> {
    const khachHangId = await this.khachHangBatBuoc(nguoiDungId);
    const rows = await this.prisma.theoDoiTrangTrai.findMany({
      where: {
        khachHangId,
        trangTrai: this.whereTrangTraiCongKhai(),
      },
      include: { trangTrai: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return {
      duLieu: rows.map((row) => ({
        trangTraiId: row.trangTraiId,
        ma: row.trangTrai.ma,
        ten: row.trangTrai.ten,
        diaChi: row.trangTrai.diaChi,
        createdAt: row.createdAt,
      })),
      tong: rows.length,
    };
  }

  async layTrangThai(
    nguoiDungId: string,
    trangTraiId: string,
  ): Promise<TrangThaiTheoDoiTrangTraiDto> {
    const khachHangId = await this.khachHangBatBuoc(nguoiDungId);
    const count = await this.prisma.theoDoiTrangTrai.count({
      where: { khachHangId, trangTraiId },
    });
    return { trangTraiId, dangTheoDoi: count > 0 };
  }

  async theoDoi(nguoiDungId: string, trangTraiId: string): Promise<TrangThaiTheoDoiTrangTraiDto> {
    const [khachHangId] = await Promise.all([
      this.khachHangBatBuoc(nguoiDungId),
      this.trangTraiCongKhaiBatBuoc(trangTraiId),
    ]);

    await this.prisma.theoDoiTrangTrai.upsert({
      where: {
        khachHangId_trangTraiId: {
          khachHangId,
          trangTraiId,
        },
      },
      create: { khachHangId, trangTraiId },
      update: {},
    });

    return { trangTraiId, dangTheoDoi: true };
  }

  async boTheoDoi(nguoiDungId: string, trangTraiId: string): Promise<TrangThaiTheoDoiTrangTraiDto> {
    const khachHangId = await this.khachHangBatBuoc(nguoiDungId);
    await this.prisma.theoDoiTrangTrai.deleteMany({
      where: { khachHangId, trangTraiId },
    });
    return { trangTraiId, dangTheoDoi: false };
  }

  async layThongBaoThuHoach(nguoiDungId: string): Promise<DanhSachThongBaoThuHoachDto> {
    const khachHangId = await this.khachHangBatBuoc(nguoiDungId);
    const rows = await this.prisma.thongBaoThuHoach.findMany({
      where: { khachHangId },
      include: {
        thuHoach: {
          include: {
            muaVu: {
              include: { trangTrai: true },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return {
      duLieu: rows.map((row) => ({
        id: row.id,
        thuHoachId: row.thuHoachId,
        trangTraiId: row.thuHoach.muaVu.trangTraiId,
        tenTrangTrai: row.thuHoach.muaVu.trangTrai.ten,
        cayTrong: row.thuHoach.muaVu.cayTrong,
        giong: row.thuHoach.muaVu.giong,
        ngayThuHoach: row.thuHoach.ngayThuHoach.toISOString().slice(0, 10),
        soLuong: Number(row.thuHoach.soLuong),
        donVi: row.thuHoach.donVi,
        phanLoai: row.thuHoach.phanLoai,
        createdAt: row.createdAt,
      })),
      tong: rows.length,
    };
  }

  async taoThongBaoChoThuHoach(
    tx: Prisma.TransactionClient,
    trangTraiId: string,
    thuHoachId: string,
  ): Promise<number> {
    const followers = await tx.theoDoiTrangTrai.findMany({
      where: { trangTraiId },
      select: { khachHangId: true },
    });

    if (followers.length === 0) return 0;

    const result = await tx.thongBaoThuHoach.createMany({
      data: followers.map((item) => ({
        khachHangId: item.khachHangId,
        thuHoachId,
      })),
      skipDuplicates: true,
    });

    return result.count;
  }

  private async khachHangBatBuoc(nguoiDungId: string): Promise<string> {
    const item = await this.prisma.khachHang.findUnique({
      where: { nguoiDungId },
      select: { id: true, trangThai: true },
    });
    if (!item || item.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
      throw new NotFoundException('Không tìm thấy hồ sơ khách hàng đang hoạt động.');
    }
    return item.id;
  }

  private async trangTraiCongKhaiBatBuoc(trangTraiId: string): Promise<void> {
    const item = await this.prisma.trangTrai.findFirst({
      where: {
        AND: [this.whereTrangTraiCongKhai(), { id: trangTraiId }],
      },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException('Không tìm thấy trang trại công khai để theo dõi.');
    }
  }

  private whereTrangTraiCongKhai(): Prisma.TrangTraiWhereInput {
    return {
      trangThai: TrangThaiBanGhi.HOAT_DONG,
      nhaCungCap: { trangThai: TrangThaiBanGhi.HOAT_DONG },
    };
  }
}
