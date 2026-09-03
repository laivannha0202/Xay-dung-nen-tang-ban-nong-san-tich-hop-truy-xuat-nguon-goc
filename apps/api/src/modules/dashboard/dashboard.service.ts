import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi, TrangThaiThanhToan } from '../../generated/prisma/client';
import { CanhBaoHetHanTonKhoService } from '../hang-doi/canh-bao-het-han-ton-kho.service';

import type { DashboardKpiDto } from './dto/phan-hoi-dashboard.dto';

const PAYMENT_REVENUE_STATES: readonly TrangThaiThanhToan[] = [
  TrangThaiThanhToan.PAID,
  TrangThaiThanhToan.PARTIALLY_REFUNDED,
  TrangThaiThanhToan.REFUNDED,
];

const REFUND_SUCCESS_STATES: readonly TrangThaiThanhToan[] = [
  TrangThaiThanhToan.PARTIALLY_REFUNDED,
  TrangThaiThanhToan.REFUNDED,
];

const REFUND_PREFIX = 'REFUND-';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly canhBaoHetHanTonKho: CanhBaoHetHanTonKhoService,
  ) {}

  async layDashboard(): Promise<DashboardKpiDto> {
    const [grossRevenue, refunds, donHang, khachHang, sanPham, khieuNai, canhBaoTonKho] =
      await Promise.all([
        this.prisma.thanhToan.aggregate({
          where: { trangThai: { in: [...PAYMENT_REVENUE_STATES] } },
          _sum: { soTien: true },
        }),
        this.prisma.giaoDichThanhToan.aggregate({
          where: {
            maGiaoDich: { startsWith: REFUND_PREFIX },
            trangThai: { in: [...REFUND_SUCCESS_STATES] },
          },
          _sum: { soTien: true },
        }),
        this.prisma.donHang.count(),
        this.prisma.khachHang.count({
          where: { trangThai: TrangThaiBanGhi.HOAT_DONG },
        }),
        this.prisma.sanPham.count({
          where: { trangThai: TrangThaiBanGhi.HOAT_DONG },
        }),
        this.prisma.khieuNai.count(),
        this.canhBaoHetHanTonKho.layCanhBao({ gioiHan: 1 }),
      ]);

    const doanhThuGop = Number(grossRevenue._sum.soTien ?? 0);
    const tongHoanTien = Number(refunds._sum.soTien ?? 0);

    return {
      doanhThu: this.tien(doanhThuGop - tongHoanTien),
      donHang,
      khachHang,
      sanPham,
      canhBaoTonKho: {
        tong: canhBaoTonKho.tongSapHetHan + canhBaoTonKho.tongHetHan,
        sapHetHan: canhBaoTonKho.tongSapHetHan,
        hetHan: canhBaoTonKho.tongHetHan,
      },
      khieuNai,
      capNhatLuc: new Date().toISOString(),
    };
  }

  private tien(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
