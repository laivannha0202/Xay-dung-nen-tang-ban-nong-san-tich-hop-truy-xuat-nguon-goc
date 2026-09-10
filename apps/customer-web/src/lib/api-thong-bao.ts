'use client';

import { layThongBaoThuHoachMoi } from '@agrimarket/api-client';

import { bearerOptionsKhachHang } from './phien-khach-hang';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type ThongBaoThuHoachWeb = {
  id: string;
  thuHoachId: string;
  trangTraiId: string;
  tenTrangTrai: string;
  cayTrong: string;
  giong: string;
  ngayThuHoach: string;
  soLuong: number;
  donVi: string;
  phanLoai: string;
  createdAt: string;
};

export type DanhSachThongBaoWeb = {
  duLieu: ThongBaoThuHoachWeb[];
  tong: number;
};

export async function layThongBaoKhachHangWeb(): Promise<DanhSachThongBaoWeb> {
  const response = await layThongBaoThuHoachMoi(bearerOptionsKhachHang());
  return duLieu(response) as DanhSachThongBaoWeb;
}
