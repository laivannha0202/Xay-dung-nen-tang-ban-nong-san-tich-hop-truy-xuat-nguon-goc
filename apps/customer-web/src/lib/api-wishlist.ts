'use client';

import {
  layDanhSachSanPhamYeuThich,
  layTrangThaiSanPhamYeuThich,
  themSanPhamYeuThich,
  xoaSanPhamYeuThich,
} from '@agrimarket/api-client';

import { bearerOptionsKhachHang } from './phien-khach-hang';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type SanPhamYeuThichWeb = {
  sanPhamId: string;
  ten: string;
  moTa: string | null;
  trangTraiId: string;
  tenTrangTrai: string;
  createdAt: string;
};

export type DanhSachSanPhamYeuThichWeb = {
  duLieu: SanPhamYeuThichWeb[];
  tong: number;
};

export type TrangThaiSanPhamYeuThichWeb = {
  sanPhamId: string;
  daYeuThich: boolean;
};

export async function layWishlistWeb(): Promise<DanhSachSanPhamYeuThichWeb> {
  const response = await layDanhSachSanPhamYeuThich(bearerOptionsKhachHang());
  return duLieu(response) as DanhSachSanPhamYeuThichWeb;
}

export async function layTrangThaiWishlistWeb(
  sanPhamId: string,
): Promise<TrangThaiSanPhamYeuThichWeb> {
  const response = await layTrangThaiSanPhamYeuThich(sanPhamId, bearerOptionsKhachHang());
  return duLieu(response) as TrangThaiSanPhamYeuThichWeb;
}

export async function themWishlistWeb(sanPhamId: string): Promise<TrangThaiSanPhamYeuThichWeb> {
  const response = await themSanPhamYeuThich(sanPhamId, bearerOptionsKhachHang());
  return duLieu(response) as TrangThaiSanPhamYeuThichWeb;
}

export async function xoaWishlistWeb(sanPhamId: string): Promise<TrangThaiSanPhamYeuThichWeb> {
  const response = await xoaSanPhamYeuThich(sanPhamId, bearerOptionsKhachHang());
  return duLieu(response) as TrangThaiSanPhamYeuThichWeb;
}
