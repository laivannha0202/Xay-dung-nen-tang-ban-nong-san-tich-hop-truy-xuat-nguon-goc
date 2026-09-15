import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi, TrangThaiLoSanPham } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

export const LOAI_GIA_HIEU_LUC = ['NORMAL', 'FLASH_SALE'] as const;

export type LoaiGiaHieuLuc = (typeof LOAI_GIA_HIEU_LUC)[number];

export type GiaHieuLuc = {
  bienTheSanPhamId: string;
  giaGoc: number;
  giaHieuLuc: number;
  loaiGia: LoaiGiaHieuLuc;
  chienDichId: string | null;
  mucFlashSaleId: string | null;
  soLuongKhaDung: number;
};

/**
 * Nguồn đọc tối thiểu mà resolver cần. Dùng Pick để cùng một implementation
 * chạy được cả ngoài transaction (PrismaService) lẫn trong transaction tạo
 * đơn (Prisma.TransactionClient).
 */
type GiaHieuLucDb = Pick<
  Prisma.TransactionClient,
  'bienTheSanPham' | 'mucFlashSale' | 'tonKhoLo'
>;

/**
 * Server-side effective price resolver — nguồn sự thật duy nhất cho giá hiệu
 * lực của một biến thể tại một thời điểm.
 *
 * Quy tắc FLASH_SALE (áp dụng giống hệt ở public flash sale, cart,
 * checkout-preview và create order):
 * - biến thể đang được bán (sản phẩm/danh mục/trang trại/nhà cung cấp HOAT_DONG)
 * - tồn tại mục flash HOAT_DONG thuộc chiến dịch HOAT_DONG còn hiệu lực
 *   (batDauLuc <= now <= ketThucLuc)
 * - 0 < giaFlash < giaGoc hiện tại của biến thể
 * - tồn khả dụng (onHand - reserved - blocked trên lô CO_THE_BAN chưa hết hạn
 *   ở kho hoạt động) > 0
 * - nếu nhiều chiến dịch trùng thời gian (lẽ ra bị guard chống trùng lịch
 *   chặn), chọn giaFlash thấp nhất để thống nhất hành vi.
 *
 * Không có flash hợp lệ => NORMAL với giaHieuLuc = giaGoc.
 * Biến thể không tồn tại/không còn được bán => null (caller tự fallback hiển
 * thị giá gốc và chặn đặt hàng bằng availability như hiện tại).
 *
 * QUOTA:
 * - gioiHanTong/soLuongDaBan được đọc ngay trong resolver; hết global quota
 *   thì giá hiệu lực quay về NORMAL.
 * - gioiHanMoiKhach được enforce transactionally khi tạo order vì cần biết
 *   danh tính khách hàng.
 * - create order lock muc_flash_sale FOR UPDATE và increment soLuongDaBan;
 *   cancel hợp lệ trả lại quota trong cùng transaction.
 */
@Injectable()
export class GiaHieuLucService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    bienTheSanPhamId: string,
    now: Date = new Date(),
    db?: GiaHieuLucDb,
  ): Promise<GiaHieuLuc | null> {
    const map = await this.resolveNhieu([bienTheSanPhamId], now, db);
    return map.get(bienTheSanPhamId) ?? null;
  }

  async resolveNhieu(
    bienTheSanPhamIds: string[],
    now: Date = new Date(),
    db?: GiaHieuLucDb,
  ): Promise<Map<string, GiaHieuLuc>> {
    const result = new Map<string, GiaHieuLuc>();
    const ids = Array.from(new Set(bienTheSanPhamIds)).filter(Boolean);
    if (ids.length === 0) return result;

    const client: GiaHieuLucDb = db ?? this.prisma;
    const homNay = this.homNay();

    const [variants, lots, muc] = await Promise.all([
      client.bienTheSanPham.findMany({
        where: {
          id: { in: ids },
          sanPham: {
            trangThai: TrangThaiBanGhi.HOAT_DONG,
            danhMucSanPham: { trangThai: TrangThaiBanGhi.HOAT_DONG },
            trangTrai: {
              trangThai: TrangThaiBanGhi.HOAT_DONG,
              nhaCungCap: { trangThai: TrangThaiBanGhi.HOAT_DONG },
            },
          },
        },
        select: { id: true, gia: true },
      }),
      client.tonKhoLo.findMany({
        where: {
          bienTheSanPhamId: { in: ids },
          kho: { trangThai: TrangThaiBanGhi.HOAT_DONG },
          loSanPham: {
            trangThai: TrangThaiLoSanPham.CO_THE_BAN,
            ngayHetHan: { gte: homNay },
          },
        },
        select: {
          bienTheSanPhamId: true,
          onHand: true,
          reserved: true,
          blocked: true,
        },
      }),
      client.mucFlashSale.findMany({
        where: {
          bienTheSanPhamId: { in: ids },
          trangThai: TrangThaiBanGhi.HOAT_DONG,
          chienDich: {
            trangThai: TrangThaiBanGhi.HOAT_DONG,
            batDauLuc: { lte: now },
            ketThucLuc: { gte: now },
          },
        },
        select: {
          id: true,
          chienDichId: true,
          bienTheSanPhamId: true,
          giaFlash: true,
          gioiHanTong: true,
          soLuongDaBan: true,
        },
        orderBy: [{ giaFlash: 'asc' }, { id: 'asc' }],
      }),
    ]);

    const tonTheoBienThe = new Map<string, number>();
    for (const lot of lots) {
      const value =
        Number(lot.onHand) - Number(lot.reserved) - Number(lot.blocked);
      tonTheoBienThe.set(
        lot.bienTheSanPhamId,
        Math.max(0, Number(((tonTheoBienThe.get(lot.bienTheSanPhamId) ?? 0) + value).toFixed(3))),
      );
    }

    const mucTheoBienThe = new Map<string, typeof muc>();
    for (const item of muc) {
      const list = mucTheoBienThe.get(item.bienTheSanPhamId) ?? [];
      list.push(item);
      mucTheoBienThe.set(item.bienTheSanPhamId, list);
    }

    for (const variant of variants) {
      const giaGoc = Number(variant.gia);
      const soLuongKhaDung = tonTheoBienThe.get(variant.id) ?? 0;
      const hopLe = (mucTheoBienThe.get(variant.id) ?? []).find((item) => {
        const giaFlash = Number(item.giaFlash);
        const quotaConLai =
          item.gioiHanTong == null
            ? Number.POSITIVE_INFINITY
            : Math.max(0, item.gioiHanTong - item.soLuongDaBan);

        // Global Flash quota là một phần của giá hiệu lực:
        // hết quota => quay về NORMAL ở product/cart/checkout.
        return (
          giaFlash > 0 &&
          giaFlash < giaGoc &&
          soLuongKhaDung > 0 &&
          quotaConLai > 0
        );
      });

      if (hopLe) {
        result.set(variant.id, {
          bienTheSanPhamId: variant.id,
          giaGoc,
          giaHieuLuc: Number(hopLe.giaFlash),
          loaiGia: 'FLASH_SALE',
          chienDichId: hopLe.chienDichId,
          mucFlashSaleId: hopLe.id,
          soLuongKhaDung,
        });
      } else {
        result.set(variant.id, {
          bienTheSanPhamId: variant.id,
          giaGoc,
          giaHieuLuc: giaGoc,
          loaiGia: 'NORMAL',
          chienDichId: null,
          mucFlashSaleId: null,
          soLuongKhaDung,
        });
      }
    }

    return result;
  }

  private homNay(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
}
