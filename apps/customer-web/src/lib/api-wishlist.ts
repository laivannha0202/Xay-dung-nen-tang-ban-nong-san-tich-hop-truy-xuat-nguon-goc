'use client';

import {
  layDanhSachSanPhamYeuThich,
  layTrangThaiSanPhamYeuThich,
  themSanPhamYeuThich,
  xoaSanPhamYeuThich,
} from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

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
  anhBiaUrl: string | null;
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
  const response = await thucThiApiKhachHang((tuyChon) => layDanhSachSanPhamYeuThich(tuyChon));
  return duLieu(response) as DanhSachSanPhamYeuThichWeb;
}

export async function layTrangThaiWishlistWeb(
  sanPhamId: string,
): Promise<TrangThaiSanPhamYeuThichWeb> {
  const response = await thucThiApiKhachHang((tuyChon) =>
    layTrangThaiSanPhamYeuThich(sanPhamId, tuyChon),
  );
  return duLieu(response) as TrangThaiSanPhamYeuThichWeb;
}

export async function themWishlistWeb(sanPhamId: string): Promise<TrangThaiSanPhamYeuThichWeb> {
  const response = await thucThiApiKhachHang((tuyChon) => themSanPhamYeuThich(sanPhamId, tuyChon));
  return duLieu(response) as TrangThaiSanPhamYeuThichWeb;
}

export async function xoaWishlistWeb(sanPhamId: string): Promise<TrangThaiSanPhamYeuThichWeb> {
  const response = await thucThiApiKhachHang((tuyChon) => xoaSanPhamYeuThich(sanPhamId, tuyChon));
  return duLieu(response) as TrangThaiSanPhamYeuThichWeb;
}
