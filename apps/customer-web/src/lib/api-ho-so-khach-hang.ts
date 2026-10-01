'use client';

import { duLieu, capNhatHoSoKhachHang, layHoSoKhachHang } from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';


export type HoSoKhachHang = {
  khachHangId: string;
  maKhachHang: string;
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
  const response = await thucThiApiKhachHang((tuyChon) => layHoSoKhachHang(tuyChon));
  return duLieu(response) as HoSoKhachHang;
}

export async function capNhatHoSoKhachHangWeb(
  input: CapNhatHoSoKhachHangInput,
): Promise<HoSoKhachHang> {
  const response = await thucThiApiKhachHang((tuyChon) => capNhatHoSoKhachHang(input, tuyChon));
  return duLieu(response) as HoSoKhachHang;
}
