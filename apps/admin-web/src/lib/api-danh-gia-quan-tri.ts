'use client';

import { capNhatHienThiDanhGiaQuanTri, layDanhSachDanhGiaQuanTri } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

export type DanhGiaQuanTri = {
  id: string;
  tenSanPham: string;
  sku: string;
  maDonHang: string;
  hoTenKhach: string;
  diem: number;
  binhLuan: string | null;
  hienThi: boolean;
  lyDoAn: string | null;
  createdAt: string;
};

const opts = (): RequestInit => ({
  ...bearerOptions(),
  credentials: 'include',
  cache: 'no-store',
});

export async function danhSachDanhGia(
  params: {
    trang?: number;
    gioiHan?: number;
    diem?: number;
    hienThi?: boolean;
    timKiem?: string;
  } = {},
) {
  const r = await layDanhSachDanhGiaQuanTri(
    params as Parameters<typeof layDanhSachDanhGiaQuanTri>[0],
    opts(),
  );
  return r.data as unknown as { duLieu: DanhGiaQuanTri[]; tong: number };
}

export async function capNhatHienThiDanhGia(
  id: string,
  body: { hienThi: boolean; lyDo?: string },
): Promise<DanhGiaQuanTri> {
  const r = await capNhatHienThiDanhGiaQuanTri(
    id,
    body as Parameters<typeof capNhatHienThiDanhGiaQuanTri>[1],
    opts(),
  );
  return r.data as unknown as DanhGiaQuanTri;
}
