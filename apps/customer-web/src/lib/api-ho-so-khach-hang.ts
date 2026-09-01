'use client';

import { capNhatHoSoKhachHang, layHoSoKhachHang } from '@agrimarket/api-client';

import { bearerOptionsKhachHang } from './phien-khach-hang';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type HoSoKhachHang = {
  khachHangId: string;
  nguoiDungId: string;
  email: string;
  soDienThoai: string | null;
  hoTen: string;
  ngaySinh: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CapNhatHoSoKhachHangInput = {
  hoTen?: string;
  soDienThoai?: string | null;
  ngaySinh?: string | null;
};

export async function layHoSoKhachHangWeb(): Promise<HoSoKhachHang> {
  const response = await layHoSoKhachHang(bearerOptionsKhachHang());
  return duLieu(response) as HoSoKhachHang;
}

export async function capNhatHoSoKhachHangWeb(
  input: CapNhatHoSoKhachHangInput,
): Promise<HoSoKhachHang> {
  const response = await capNhatHoSoKhachHang(input, bearerOptionsKhachHang());
  return duLieu(response) as HoSoKhachHang;
}
