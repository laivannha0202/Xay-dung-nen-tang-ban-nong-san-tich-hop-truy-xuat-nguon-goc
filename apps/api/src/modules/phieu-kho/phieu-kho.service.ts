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
    const where: Prisma.PhieuKhoWhereInput = {
      ...(dto.loai ? { loai: dto.loai } : {}),
      ...(timKiem
        ? {
            OR: [
              { maPhieu: { contains: timKiem } },
              { maThamChieu: { contains: timKiem } },
              { lyDo: { contains: timKiem } },
              { nguoiLap: { contains: timKiem } },
            ],
          }
        : {}),
    };

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
