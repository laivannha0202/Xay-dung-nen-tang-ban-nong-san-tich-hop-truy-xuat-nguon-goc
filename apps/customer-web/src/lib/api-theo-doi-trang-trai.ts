'use client';

import {
  boTheoDoiTrangTrai,
  layDanhSachTrangTraiTheoDoi,
  layThongBaoThuHoachMoi,
  layTrangThaiTheoDoiTrangTrai,
  theoDoiTrangTrai,
} from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type ChungNhanTrangTraiTheoDoiWeb = {
  loai: string;
};

export type TrangTraiTheoDoiWeb = {
  trangTraiId: string;
  ma: string;
  ten: string;
  diaChi: string;
  anhBiaUrl: string | null;
  chungNhan: ChungNhanTrangTraiTheoDoiWeb[];
  soSanPham: number;
  diemTrungBinh: number | null;
  soLuotDanhGia: number;
  soLuotTheoDoi: number;
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
  const response = await thucThiApiKhachHang((tuyChon) =>
    layDanhSachTrangTraiTheoDoi(tuyChon),
  );
  return duLieu(response) as { duLieu: TrangTraiTheoDoiWeb[]; tong: number };
}

export async function layTrangThaiTheoDoiWeb(
  trangTraiId: string,
): Promise<TrangThaiTheoDoiTrangTraiWeb> {
  const response = await thucThiApiKhachHang((tuyChon) =>
    layTrangThaiTheoDoiTrangTrai(trangTraiId, tuyChon),
  );
  return duLieu(response) as TrangThaiTheoDoiTrangTraiWeb;
}

export async function theoDoiTrangTraiWeb(
  trangTraiId: string,
): Promise<TrangThaiTheoDoiTrangTraiWeb> {
  const response = await thucThiApiKhachHang((tuyChon) => theoDoiTrangTrai(trangTraiId, tuyChon));
  return duLieu(response) as TrangThaiTheoDoiTrangTraiWeb;
}

export async function boTheoDoiTrangTraiWeb(
  trangTraiId: string,
): Promise<TrangThaiTheoDoiTrangTraiWeb> {
  const response = await thucThiApiKhachHang((tuyChon) =>
    boTheoDoiTrangTrai(trangTraiId, tuyChon),
  );
  return duLieu(response) as TrangThaiTheoDoiTrangTraiWeb;
}

export async function layThongBaoThuHoachWeb(): Promise<{
  duLieu: ThongBaoThuHoachWeb[];
  tong: number;
}> {
  const response = await thucThiApiKhachHang((tuyChon) => layThongBaoThuHoachMoi(tuyChon));
  return duLieu(response) as { duLieu: ThongBaoThuHoachWeb[]; tong: number };
}
