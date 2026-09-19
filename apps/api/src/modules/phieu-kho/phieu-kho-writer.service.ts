import { Injectable, NotFoundException } from '@nestjs/common';

import { LoaiPhieuKho, type Prisma } from '../../generated/prisma/client';
import { taoMaPhieuKho } from '../common/ma-nghiep-vu.util';

export type TaoDongPhieuKhoInput = {
  tonKhoLoId: string;
  tonKhoLoDichId?: string | null;
  soLuong: number;
  giaoDich: Array<{ id: string; vaiTro?: string | null }>;
};

export type TaoPhieuKhoInput = {
  loai: LoaiPhieuKho;
  nguoiLapId?: string | null;
  donHangId?: string | null;
  khoNguonId?: string | null;
  khoDichId?: string | null;
  maThamChieu?: string | null;
  lyDo?: string | null;
  ghiChu?: string | null;
  dong: TaoDongPhieuKhoInput[];
};

@Injectable()
export class PhieuKhoWriterService {
  async taoTrongTransaction(
    tx: Prisma.TransactionClient,
    input: TaoPhieuKhoInput,
  ): Promise<{ id: string; maPhieu: string }> {
    if (input.dong.length === 0) throw new Error('Phiếu kho phải có ít nhất một dòng.');

    const actor = input.nguoiLapId
      ? await tx.nguoiDung.findUnique({
          where: { id: input.nguoiLapId },
          select: { id: true, email: true },
        })
      : null;

    if (input.nguoiLapId && !actor) {
      throw new NotFoundException('Không tìm thấy người lập phiếu kho.');
    }

    const phieu = await tx.phieuKho.create({
      data: {
        maPhieu: taoMaPhieuKho(input.loai),
        loai: input.loai,
        donHangId: input.donHangId ?? null,
        khoNguonId: input.khoNguonId ?? null,
        khoDichId: input.khoDichId ?? null,
        maThamChieu: input.maThamChieu ?? null,
        lyDo: input.lyDo ?? null,
        ghiChu: input.ghiChu ?? null,
        nguoiLapId: actor?.id ?? null,
        nguoiLap: actor?.email ?? 'SYSTEM',
      },
    });

    for (const [index, item] of input.dong.entries()) {
      const [tonKho, tonKhoDich] = await Promise.all([
        tx.tonKhoLo.findUnique({
          where: { id: item.tonKhoLoId },
          include: {
            kho: true,
            loSanPham: true,
            bienTheSanPham: { include: { sanPham: true } },
          },
        }),
        item.tonKhoLoDichId
          ? tx.tonKhoLo.findUnique({
              where: { id: item.tonKhoLoDichId },
              include: { kho: true },
            })
          : Promise.resolve(null),
      ]);

      if (!tonKho) throw new NotFoundException('Không tìm thấy inventory lot khi lập phiếu kho.');
      if (item.tonKhoLoDichId && !tonKhoDich) {
        throw new NotFoundException('Không tìm thấy inventory lot đích khi lập phiếu chuyển.');
      }

      const dong = await tx.phieuKhoDong.create({
        data: {
          phieuKhoId: phieu.id,
          thuTu: index + 1,
          tonKhoLoId: tonKho.id,
          tonKhoLoDichId: tonKhoDich?.id ?? null,
          loSanPhamId: tonKho.loSanPhamId,
          maLoSnapshot: tonKho.loSanPham.maLo,
          bienTheSanPhamId: tonKho.bienTheSanPhamId,
          skuSnapshot: tonKho.bienTheSanPham.sku,
          tenSanPhamSnapshot: tonKho.bienTheSanPham.sanPham.ten,
          soLuong: item.soLuong,
          donViSnapshot: tonKho.bienTheSanPham.donVi,
          khoIdSnapshot: tonKho.khoId,
          maKhoSnapshot: tonKho.kho.maKho,
          khoDichIdSnapshot: tonKhoDich?.khoId ?? null,
          maKhoDichSnapshot: tonKhoDich?.kho.maKho ?? null,
        },
      });

      if (item.giaoDich.length > 0) {
        await tx.lienKetPhieuKhoGiaoDich.createMany({
          data: item.giaoDich.map((ledger) => ({
            phieuKhoDongId: dong.id,
            giaoDichTonKhoId: ledger.id,
            vaiTro: ledger.vaiTro ?? null,
          })),
        });
      }
    }

    return { id: phieu.id, maPhieu: phieu.maPhieu };
  }
}
