'use client';

import {
  doiTrangThaiFlashSale,
  layChiTietFlashSale,
  layDanhSachFlashSale,
  taoFlashSale,
  themMucFlashSale,
  xoaMucFlashSale,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

export type FlashSale = {
  id: string;
  ten: string;
  moTa: string | null;
  batDauLuc: string;
  ketThucLuc: string;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
};

export type MucFlashSale = {
  id: string;
  bienTheSanPhamId: string;
  giaFlash: number;
  gioiHanTong: number | null;
  gioiHanMoiKhach: number | null;
  soLuongDaBan: number;
};

export type FlashSaleChiTiet = FlashSale & { muc: MucFlashSale[] };

const opts = (): RequestInit => ({
  ...bearerOptions(),
  credentials: 'include',
  cache: 'no-store',
});

export async function danhSachFlashSale(
  params: {
    trang?: number;
    gioiHan?: number;
    trangThai?: FlashSale['trangThai'];
  } = {},
) {
  const r = await layDanhSachFlashSale(
    params as Parameters<typeof layDanhSachFlashSale>[0],
    opts(),
  );
  return r.data as unknown as { duLieu: FlashSale[]; tong: number };
}

export async function chiTietFlashSale(id: string): Promise<FlashSaleChiTiet> {
  const r = await layChiTietFlashSale(id, opts());
  return r.data as unknown as FlashSaleChiTiet;
}

export async function taoChienDich(body: {
  ten: string;
  moTa?: string | null;
  batDauLuc: string;
  ketThucLuc: string;
}): Promise<FlashSaleChiTiet> {
  const r = await taoFlashSale(body as Parameters<typeof taoFlashSale>[0], opts());
  return r.data as unknown as FlashSaleChiTiet;
}

export async function doiTrangThaiChienDich(
  id: string,
  trangThai: FlashSale['trangThai'],
): Promise<FlashSaleChiTiet> {
  const r = await doiTrangThaiFlashSale(
    id,
    { trangThai } as Parameters<typeof doiTrangThaiFlashSale>[1],
    opts(),
  );
  return r.data as unknown as FlashSaleChiTiet;
}

export async function themMucChienDich(
  id: string,
  body: {
    bienTheSanPhamId: string;
    giaFlash: number;
    gioiHanTong?: number | null;
    gioiHanMoiKhach?: number | null;
  },
): Promise<FlashSaleChiTiet> {
  const r = await themMucFlashSale(id, body as Parameters<typeof themMucFlashSale>[1], opts());
  return r.data as unknown as FlashSaleChiTiet;
}

export async function xoaMucChienDich(id: string, mucId: string): Promise<FlashSaleChiTiet> {
  const r = await xoaMucFlashSale(id, mucId, opts());
  return r.data as unknown as FlashSaleChiTiet;
}
