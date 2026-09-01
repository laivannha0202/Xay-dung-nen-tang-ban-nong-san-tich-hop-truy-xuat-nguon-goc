'use client';

import {
  layDanhSachDanhGiaSanPham,
  layTrangThaiDanhGiaMucDonHang,
  taoDanhGia,
} from '@agrimarket/api-client';

import { bearerOptionsKhachHang } from './phien-khach-hang';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type DanhGiaKhach = {
  id: string;
  mucDonHangId: string;
  sanPhamId: string;
  diem: number;
  binhLuan: string | null;
  nguoiDanhGia: string;
  createdAt: string;
  updatedAt: string;
};

export type TrangThaiDanhGiaMucDonHangKhach = {
  mucDonHangId: string;
  sanPhamId: string;
  tenSanPham: string;
  sku: string;
  daGiao: boolean;
  coTheDanhGia: boolean;
  lyDo: string | null;
  danhGia: DanhGiaKhach | null;
};

export type DanhSachDanhGiaSanPhamKhach = {
  sanPhamId: string;
  tong: number;
  diemTrungBinh: number | null;
  trang: number;
  gioiHan: number;
  items: DanhGiaKhach[];
};

export async function layTrangThaiDanhGiaMucDonHangKhach(
  mucDonHangId: string,
): Promise<TrangThaiDanhGiaMucDonHangKhach> {
  const response = await layTrangThaiDanhGiaMucDonHang(mucDonHangId, bearerOptionsKhachHang());
  return duLieu(response) as TrangThaiDanhGiaMucDonHangKhach;
}

export async function taoDanhGiaKhach(input: {
  mucDonHangId: string;
  diem: number;
  binhLuan?: string;
}): Promise<DanhGiaKhach> {
  const response = await taoDanhGia(input, bearerOptionsKhachHang());
  return duLieu(response) as DanhGiaKhach;
}

export async function layDanhSachDanhGiaSanPhamKhach(
  sanPhamId: string,
  params: { trang: number; gioiHan: number },
): Promise<DanhSachDanhGiaSanPhamKhach> {
  const response = await layDanhSachDanhGiaSanPham(sanPhamId, params);
  return duLieu(response) as DanhSachDanhGiaSanPhamKhach;
}
