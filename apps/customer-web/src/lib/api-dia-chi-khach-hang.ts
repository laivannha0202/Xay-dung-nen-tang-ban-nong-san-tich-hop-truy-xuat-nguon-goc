'use client';

import {
  capNhatDiaChiKhachHang,
  datDiaChiMacDinhKhachHang,
  layDanhSachDiaChiKhachHang,
  taoDiaChiKhachHang,
  xoaDiaChiKhachHang,
} from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type DiaChiKhachHang = {
  id: string;
  tenNguoiNhan: string;
  soDienThoai: string;
  dongDiaChi: string;
  phuongXa: string | null;
  quanHuyen: string | null;
  tinhThanh: string;
  maBuuChinh: string | null;
  xaPhuongMa: string | null;
  thonToDanPhoMa: string | null;
  tenXaPhuong: string | null;
  tenThonToDanPho: string | null;
  macDinh: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DuLieuDiaChiKhachHang = {
  tenNguoiNhan: string;
  soDienThoai: string;
  dongDiaChi: string;
  phuongXa?: string | null;
  quanHuyen?: string | null;
  tinhThanh: string;
  maBuuChinh?: string | null;
  xaPhuongMa?: string | null;
  thonToDanPhoMa?: string | null;
};

export async function laySoDiaChiWeb(): Promise<DiaChiKhachHang[]> {
  const response = await thucThiApiKhachHang((tuyChon) => layDanhSachDiaChiKhachHang(tuyChon));
  return duLieu(response) as DiaChiKhachHang[];
}

export async function taoDiaChiWeb(
  input: DuLieuDiaChiKhachHang & { macDinh?: boolean },
): Promise<DiaChiKhachHang> {
  const response = await thucThiApiKhachHang((tuyChon) =>
    taoDiaChiKhachHang(input, tuyChon),
  );
  return duLieu(response) as DiaChiKhachHang;
}

export async function capNhatDiaChiWeb(
  id: string,
  input: Partial<DuLieuDiaChiKhachHang>,
): Promise<DiaChiKhachHang> {
  const response = await thucThiApiKhachHang((tuyChon) =>
    capNhatDiaChiKhachHang(id, input, tuyChon),
  );
  return duLieu(response) as DiaChiKhachHang;
}

export async function datDiaChiMacDinhWeb(id: string): Promise<DiaChiKhachHang> {
  const response = await thucThiApiKhachHang((tuyChon) => datDiaChiMacDinhKhachHang(id, tuyChon));
  return duLieu(response) as DiaChiKhachHang;
}

export async function xoaDiaChiWeb(id: string): Promise<void> {
  await thucThiApiKhachHang((tuyChon) => xoaDiaChiKhachHang(id, tuyChon));
}
