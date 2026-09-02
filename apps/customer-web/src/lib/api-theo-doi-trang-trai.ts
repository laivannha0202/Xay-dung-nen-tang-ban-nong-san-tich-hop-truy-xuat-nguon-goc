'use client';

import {
  boTheoDoiTrangTrai,
  layDanhSachTrangTraiTheoDoi,
  layThongBaoThuHoachMoi,
  layTrangThaiTheoDoiTrangTrai,
  theoDoiTrangTrai,
} from '@agrimarket/api-client';

import { bearerOptionsKhachHang } from './phien-khach-hang';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type TrangTraiTheoDoiWeb = {
  trangTraiId: string;
  ma: string;
  ten: string;
  diaChi: string;
  createdAt: string;
};

export type TrangThaiTheoDoiTrangTraiWeb = {
  trangTraiId: string;
  dangTheoDoi: boolean;
};

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

export async function layTrangTraiTheoDoiWeb(): Promise<{
  duLieu: TrangTraiTheoDoiWeb[];
  tong: number;
}> {
  const response = await layDanhSachTrangTraiTheoDoi(bearerOptionsKhachHang());
  return duLieu(response) as { duLieu: TrangTraiTheoDoiWeb[]; tong: number };
}

export async function layTrangThaiTheoDoiWeb(
  trangTraiId: string,
): Promise<TrangThaiTheoDoiTrangTraiWeb> {
  const response = await layTrangThaiTheoDoiTrangTrai(trangTraiId, bearerOptionsKhachHang());
  return duLieu(response) as TrangThaiTheoDoiTrangTraiWeb;
}

export async function theoDoiTrangTraiWeb(
  trangTraiId: string,
): Promise<TrangThaiTheoDoiTrangTraiWeb> {
  const response = await theoDoiTrangTrai(trangTraiId, bearerOptionsKhachHang());
  return duLieu(response) as TrangThaiTheoDoiTrangTraiWeb;
}

export async function boTheoDoiTrangTraiWeb(
  trangTraiId: string,
): Promise<TrangThaiTheoDoiTrangTraiWeb> {
  const response = await boTheoDoiTrangTrai(trangTraiId, bearerOptionsKhachHang());
  return duLieu(response) as TrangThaiTheoDoiTrangTraiWeb;
}

export async function layThongBaoThuHoachWeb(): Promise<{
  duLieu: ThongBaoThuHoachWeb[];
  tong: number;
}> {
  const response = await layThongBaoThuHoachMoi(bearerOptionsKhachHang());
  return duLieu(response) as { duLieu: ThongBaoThuHoachWeb[]; tong: number };
}
