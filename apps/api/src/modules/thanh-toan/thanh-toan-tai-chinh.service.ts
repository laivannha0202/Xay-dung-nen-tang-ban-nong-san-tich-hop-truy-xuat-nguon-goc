import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiThanhToan } from '../../generated/prisma/client';

import type {
  DanhSachHoanTienTaiChinhDto,
  DanhSachThanhToanTaiChinhDto,
} from './dto/phan-hoi-tai-chinh.dto';
import type {
  TruyVanHoanTienTaiChinhDto,
  TruyVanThanhToanTaiChinhDto,
} from './dto/truy-van-tai-chinh.dto';

const REFUND_PREFIX = 'REFUND-';
const REFUND_SUCCESS_STATES: readonly TrangThaiThanhToan[] = [
  TrangThaiThanhToan.PARTIALLY_REFUNDED,
  TrangThaiThanhToan.REFUNDED,
];

@Injectable()
export class ThanhToanTaiChinhService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSachThanhToan(
    query: TruyVanThanhToanTaiChinhDto,
  ): Promise<DanhSachThanhToanTaiChinhDto> {
    const maDonHang = query.maDonHang?.trim();
    const phuongThuc = query.phuongThuc?.trim();
    const where: Prisma.ThanhToanWhereInput = {
      ...(query.trangThai ? { trangThai: query.trangThai } : {}),
      ...(phuongThuc ? { phuongThuc } : {}),
      ...(maDonHang ? { donHang: { maDonHang: { contains: maDonHang } } } : {}),
    };
    const skip = (query.trang - 1) * query.gioiHan;
    const [tong, rows] = await this.prisma.$transaction([
      this.prisma.thanhToan.count({ where }),
      this.prisma.thanhToan.findMany({
        where,
        include: {
          donHang: {
            select: { id: true, maDonHang: true },
          },
          giaoDich: {
            select: { maGiaoDich: true, soTien: true, trangThai: true },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
    ]);

    return {
      duLieu: rows.map((row) => ({
        id: row.id,
        donHangId: row.donHangId,
        maDonHang: row.donHang.maDonHang,
        soTien: Number(row.soTien),
        phuongThuc: row.phuongThuc,
        trangThai: row.trangThai,
        tongDaHoan: row.giaoDich
          .filter(
            (item) =>
              item.maGiaoDich.startsWith(REFUND_PREFIX) &&
              REFUND_SUCCESS_STATES.includes(item.trangThai),
          )
          .reduce((sum, item) => sum + Number(item.soTien), 0),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async layDanhSachHoanTien(
    query: TruyVanHoanTienTaiChinhDto,
  ): Promise<DanhSachHoanTienTaiChinhDto> {
    const where: Prisma.GiaoDichThanhToanWhereInput = {
      maGiaoDich: { startsWith: REFUND_PREFIX },
      ...(query.trangThai ? { trangThai: query.trangThai } : {}),
    };
    const skip = (query.trang - 1) * query.gioiHan;
    const [tong, rows] = await this.prisma.$transaction([
      this.prisma.giaoDichThanhToan.count({ where }),
      this.prisma.giaoDichThanhToan.findMany({
        where,
        include: {
          thanhToan: {
            include: {
              donHang: {
                select: { id: true, maDonHang: true },
              },
            },
          },
        },
        orderBy: [{ thoiGian: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
    ]);

    return {
      duLieu: rows.map((row) => ({
        id: row.id,
        thanhToanId: row.thanhToanId,
        donHangId: row.thanhToan.donHangId,
        maDonHang: row.thanhToan.donHang.maDonHang,
        maGiaoDich: row.maGiaoDich,
        soTien: Number(row.soTien),
        phuongThuc: row.phuongThuc,
        trangThai: row.trangThai,
        thoiGian: row.thoiGian.toISOString(),
      })),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }
}
