import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi, TrangThaiLoSanPham } from '../../generated/prisma/client';

export type PhanBoFefoItem = {
  tonKhoLoId: string;
  khoId: string;
  maKho: string;
  loSanPhamId: string;
  maLo: string;
  ngayHetHan: string;
  soLuong: number;
};

export type KetQuaPhanBoFefo = {
  bienTheSanPhamId: string;
  khoId: string | null;
  soLuongYeuCau: number;
  tongSoLuongPhanBo: number;
  phanBo: PhanBoFefoItem[];
};

@Injectable()
export class FefoService {
  constructor(private readonly prisma: PrismaService) {}

  async phanBo(
    bienTheSanPhamId: string,
    soLuong: number,
    khoId?: string,
  ): Promise<KetQuaPhanBoFefo> {
    const soLuongYeuCau = this.chuanHoaSoLuong(soLuong);

    const bienThe = await this.prisma.bienTheSanPham.findUnique({
      where: { id: bienTheSanPhamId },
      select: { id: true },
    });
    if (!bienThe) {
      throw new NotFoundException('Không tìm thấy biến thể sản phẩm để phân bổ FEFO.');
    }

    const homNay = this.homNay();
    const rows = await this.prisma.tonKhoLo.findMany({
      where: {
        bienTheSanPhamId,
        ...(khoId ? { khoId } : {}),
        onHand: { gt: 0 },
        kho: {
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
        loSanPham: {
          trangThai: TrangThaiLoSanPham.CO_THE_BAN,
          ngayHetHan: { gte: homNay },
        },
      },
      include: {
        kho: true,
        loSanPham: true,
      },
      orderBy: [
        { loSanPham: { ngayHetHan: 'asc' } },
        { loSanPham: { maLo: 'asc' } },
        { kho: { maKho: 'asc' } },
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
    });

    let conLai = soLuongYeuCau;
    const phanBo: PhanBoFefoItem[] = [];

    for (const row of rows) {
      if (conLai <= 0) break;

      const available = Number(
        (Number(row.onHand) - Number(row.reserved) - Number(row.blocked)).toFixed(3),
      );
      if (available <= 0) continue;

      const lay = Number(Math.min(conLai, available).toFixed(3));
      if (lay <= 0) continue;

      phanBo.push({
        tonKhoLoId: row.id,
        khoId: row.khoId,
        maKho: row.kho.maKho,
        loSanPhamId: row.loSanPhamId,
        maLo: row.loSanPham.maLo,
        ngayHetHan: row.loSanPham.ngayHetHan.toISOString().slice(0, 10),
        soLuong: lay,
      });
      conLai = Number((conLai - lay).toFixed(3));
    }

    if (conLai > 0) {
      throw new BadRequestException(`Không đủ tồn kho hợp lệ theo FEFO. Thiếu ${conLai}.`);
    }

    return {
      bienTheSanPhamId,
      khoId: khoId ?? null,
      soLuongYeuCau,
      tongSoLuongPhanBo: Number(phanBo.reduce((tong, item) => tong + item.soLuong, 0).toFixed(3)),
      phanBo,
    };
  }

  private chuanHoaSoLuong(value: number): number {
    if (!Number.isFinite(value) || value <= 0 || value > 99999999999.999) {
      throw new BadRequestException('Số lượng FEFO phải > 0 và <= 99999999999.999.');
    }
    const normalized = Number(value.toFixed(3));
    if (Math.abs(value - normalized) > 1e-9) {
      throw new BadRequestException('Số lượng FEFO tối đa 3 chữ số thập phân.');
    }
    return normalized;
  }

  private homNay(): Date {
    const bayGio = new Date();
    return new Date(Date.UTC(bayGio.getFullYear(), bayGio.getMonth(), bayGio.getDate()));
  }
}
