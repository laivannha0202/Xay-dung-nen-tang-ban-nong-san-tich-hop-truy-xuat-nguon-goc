'use client';

import {
  doiTrangThaiNoiDungTrangChu,
  layDanhSachNoiDungTrangChu,
  taoNoiDungTrangChu,
  xoaNoiDungTrangChu,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

export type NoiDungTrangChuAdmin = {
  id: string;
  loai: 'BANNER' | 'KIEN_THUC' | 'CAU_CHUYEN_TRANG_TRAI';
  tieuDe: string;
  nhan: string | null;
  moTa: string | null;
  anhUrl: string | null;
  duongDan: string | null;
  viTri: string | null;
  thuTu: number;
  hienThi: boolean;
  batDauLuc: string | null;
  ketThucLuc: string | null;
};

const opts = (): RequestInit => ({
  ...bearerOptions(),
  credentials: 'include',
  cache: 'no-store',
});

export async function danhSachNoiDung(
  params: {
    trang?: number;
    gioiHan?: number;
    loai?: NoiDungTrangChuAdmin['loai'];
    hienThi?: boolean;
    timKiem?: string;
  } = {},
) {
  const r = await layDanhSachNoiDungTrangChu(
    params as Parameters<typeof layDanhSachNoiDungTrangChu>[0],
    opts(),
  );
  return r.data as unknown as { duLieu: NoiDungTrangChuAdmin[]; tong: number };
}

export async function taoNoiDung(body: {
  loai: NoiDungTrangChuAdmin['loai'];
  tieuDe: string;
  nhan?: string | null;
  moTa?: string | null;
  anhUrl?: string | null;
  duongDan?: string | null;
  viTri?: string | null;
  thuTu?: number;
  hienThi?: boolean;
  batDauLuc?: string | null;
  ketThucLuc?: string | null;
}) {
  const r = await taoNoiDungTrangChu(body as Parameters<typeof taoNoiDungTrangChu>[0], opts());
  return r.data as unknown as NoiDungTrangChuAdmin;
}

export async function doiHienThiNoiDung(id: string, hienThi: boolean) {
  const r = await doiTrangThaiNoiDungTrangChu(id, { hienThi }, opts());
  return r.data as unknown as NoiDungTrangChuAdmin;
}

export async function xoaNoiDung(id: string): Promise<void> {
  await xoaNoiDungTrangChu(id, opts());
}
