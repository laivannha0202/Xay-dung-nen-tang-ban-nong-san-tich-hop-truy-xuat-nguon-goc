import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiBanGhi, TrangThaiXacMinhChungNhan } from '../../generated/prisma/client';
import { TepTinService } from '../tep-tin/tep-tin.service';

import type {
  DanhSachThongBaoThuHoachDto,
  DanhSachTrangTraiTheoDoiDto,
  TrangThaiTheoDoiTrangTraiDto,
} from './dto/phan-hoi-theo-doi-trang-trai.dto';

@Injectable()
export class TheoDoiTrangTraiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tepTinService: TepTinService,
  ) {}

  async layDanhSach(nguoiDungId: string): Promise<DanhSachTrangTraiTheoDoiDto> {
    const khachHangId = await this.khachHangBatBuoc(nguoiDungId);
    const bayGio = new Date();
    const homNay = new Date(Date.UTC(bayGio.getFullYear(), bayGio.getMonth(), bayGio.getDate()));
    const rows = await this.prisma.theoDoiTrangTrai.findMany({
      where: {
        khachHangId,
        trangTrai: this.whereTrangTraiCongKhai(),
      },
      include: {
        trangTrai: {
          include: {
            anh: {
              where: {
                tepTin: {
                  trangThai: TrangThaiBanGhi.HOAT_DONG,
                  mimeType: { startsWith: 'image/' },
                },
              },
              orderBy: [{ thuTu: 'asc' }, { createdAt: 'asc' }],
              select: { tepTinId: true },
            },
            chungNhan: {
              where: {
                trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
                ngayHetHan: { gte: homNay },
              },
              select: { loai: true },
            },
            _count: {
              select: {
                sanPham: { where: { trangThai: TrangThaiBanGhi.HOAT_DONG } },
                khachHangTheoDoi: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    // Điểm đánh giá thật: trung bình điểm các lượt đánh giá mục đơn
    // thuộc từng trang trại (qua MucDonHang.trangTraiId).
    const trangTraiIds = rows.map((row) => row.trangTraiId);
    const tongDiemTheoTrangTrai = new Map<string, { tong: number; dem: number }>();
    if (trangTraiIds.length > 0) {
      const danhGia = await this.prisma.danhGia.findMany({
        where: { mucDonHang: { trangTraiId: { in: trangTraiIds } } },
        select: { diem: true, mucDonHang: { select: { trangTraiId: true } } },
      });
      for (const item of danhGia) {
        const hienTai = tongDiemTheoTrangTrai.get(item.mucDonHang.trangTraiId) ?? { tong: 0, dem: 0 };
        hienTai.tong += item.diem;
        hienTai.dem += 1;
        tongDiemTheoTrangTrai.set(item.mucDonHang.trangTraiId, hienTai);
      }
    }

    return {
      duLieu: await Promise.all(
        rows.map(async (row) => {
          const anhDaiDien = row.trangTrai.anh[0] ?? null;
          const danhGia = tongDiemTheoTrangTrai.get(row.trangTraiId);
          return {
            trangTraiId: row.trangTraiId,
            ma: row.trangTrai.ma,
            ten: row.trangTrai.ten,
            diaChi: row.trangTrai.diaChi,
            anhBiaUrl: anhDaiDien
              ? await this.tepTinService.taoSignedUrlAnhNoiBo(anhDaiDien.tepTinId)
              : null,
            chungNhan: row.trangTrai.chungNhan.map((item) => ({ loai: item.loai })),
            soSanPham: row.trangTrai._count.sanPham,
            diemTrungBinh:
              danhGia && danhGia.dem > 0
                ? Math.round((danhGia.tong / danhGia.dem) * 10) / 10
                : null,
            soLuotDanhGia: danhGia?.dem ?? 0,
            soLuotTheoDoi: row.trangTrai._count.khachHangTheoDoi,
            createdAt: row.createdAt,
          };
        }),
      ),
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
