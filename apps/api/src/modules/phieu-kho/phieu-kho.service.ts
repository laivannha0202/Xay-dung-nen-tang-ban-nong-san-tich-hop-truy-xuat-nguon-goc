import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import type { TruyVanPhieuKhoDto } from './dto/truy-van-phieu-kho.dto';

@Injectable()
export class PhieuKhoService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(dto: TruyVanPhieuKhoDto) {
    const trang = dto.trang ?? 1;
    const gioiHan = dto.gioiHan ?? 20;
    const timKiem = dto.timKiem?.trim();
    const maKho = dto.maKho?.trim();
    const maLo = dto.maLo?.trim();
    const sku = dto.sku?.trim();
    const nguoiLap = dto.nguoiLap?.trim();
    const and: Prisma.PhieuKhoWhereInput[] = [];

    if (dto.loai) and.push({ loai: dto.loai });
    if (dto.trangThai) and.push({ trangThai: dto.trangThai });
    if (nguoiLap) and.push({ nguoiLap: { contains: nguoiLap } });

    const dong: Prisma.PhieuKhoDongWhereInput = {};
    if (maKho) {
      dong.OR = [
        { maKhoSnapshot: { contains: maKho } },
        { maKhoDichSnapshot: { contains: maKho } },
      ];
    }
    if (maLo) dong.maLoSnapshot = { contains: maLo };
    if (sku) dong.skuSnapshot = { contains: sku };
    if (dto.soLuongTu !== undefined || dto.soLuongDen !== undefined) {
      dong.soLuong = {
        ...(dto.soLuongTu !== undefined ? { gte: dto.soLuongTu } : {}),
        ...(dto.soLuongDen !== undefined ? { lte: dto.soLuongDen } : {}),
      };
    }
    if (Object.keys(dong).length > 0) and.push({ dong: { some: dong } });

    if (dto.tuNgay || dto.denNgay) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (dto.tuNgay) createdAt.gte = new Date(`${dto.tuNgay}T00:00:00.000Z`);
      if (dto.denNgay) {
        const endExclusive = new Date(`${dto.denNgay}T00:00:00.000Z`);
        endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
        createdAt.lt = endExclusive;
      }
      and.push({ createdAt });
    }

    if (timKiem) {
      and.push({
        OR: [
          { maPhieu: { contains: timKiem } },
          { maThamChieu: { contains: timKiem } },
          { lyDo: { contains: timKiem } },
          { nguoiLap: { contains: timKiem } },
          { dong: { some: { maLoSnapshot: { contains: timKiem } } } },
          { dong: { some: { skuSnapshot: { contains: timKiem } } } },
          { dong: { some: { maKhoSnapshot: { contains: timKiem } } } },
          { dong: { some: { maKhoDichSnapshot: { contains: timKiem } } } },
        ],
      });
    }

    const where: Prisma.PhieuKhoWhereInput = and.length ? { AND: and } : {};

    const [duLieu, tong] = await Promise.all([
      this.prisma.phieuKho.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (trang - 1) * gioiHan,
        take: gioiHan,
        include: { _count: { select: { dong: true } } },
      }),
      this.prisma.phieuKho.count({ where }),
    ]);

    return {
      duLieu: duLieu.map((item) => ({
        id: item.id,
        maPhieu: item.maPhieu,
        loai: item.loai,
        trangThai: item.trangThai,
        donHangId: item.donHangId,
        khoNguonId: item.khoNguonId,
        khoDichId: item.khoDichId,
        maThamChieu: item.maThamChieu,
        lyDo: item.lyDo,
        ghiChu: item.ghiChu,
        nguoiLapId: item.nguoiLapId,
        nguoiLap: item.nguoiLap,
        soDong: item._count.dong,
        createdAt: item.createdAt,
      })),
      tong,
      trang,
      gioiHan,
    };
  }

  async layChiTiet(id: string) {
    const item = await this.prisma.phieuKho.findUnique({
      where: { id },
      include: {
        donHang: { select: { id: true, maDonHang: true, trangThai: true } },
        dong: {
          orderBy: { thuTu: 'asc' },
          include: {
            lienKetGiaoDich: {
              orderBy: { createdAt: 'asc' },
              include: {
                giaoDichTonKho: {
                  select: { id: true, loai: true, soLuong: true, createdAt: true },
                },
              },
            },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Không tìm thấy phiếu kho.');

    return {
      id: item.id,
      maPhieu: item.maPhieu,
      loai: item.loai,
      trangThai: item.trangThai,
      donHangId: item.donHangId,
      donHang: item.donHang,
      khoNguonId: item.khoNguonId,
      khoDichId: item.khoDichId,
      maThamChieu: item.maThamChieu,
      lyDo: item.lyDo,
      ghiChu: item.ghiChu,
      nguoiLapId: item.nguoiLapId,
      nguoiLap: item.nguoiLap,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      dong: item.dong.map((dong) => ({
        id: dong.id,
        thuTu: dong.thuTu,
        tonKhoLoId: dong.tonKhoLoId,
        tonKhoLoDichId: dong.tonKhoLoDichId,
        loSanPhamId: dong.loSanPhamId,
        maLo: dong.maLoSnapshot,
        bienTheSanPhamId: dong.bienTheSanPhamId,
        sku: dong.skuSnapshot,
        tenSanPham: dong.tenSanPhamSnapshot,
        soLuong: Number(dong.soLuong),
        donVi: dong.donViSnapshot,
        khoId: dong.khoIdSnapshot,
        maKho: dong.maKhoSnapshot,
        khoDichId: dong.khoDichIdSnapshot,
        maKhoDich: dong.maKhoDichSnapshot,
        giaoDich: dong.lienKetGiaoDich.map((link) => ({
          id: link.giaoDichTonKho.id,
          loai: link.giaoDichTonKho.loai,
          soLuong: Number(link.giaoDichTonKho.soLuong),
          vaiTro: link.vaiTro,
          createdAt: link.giaoDichTonKho.createdAt,
        })),
      })),
    };
  }
}
