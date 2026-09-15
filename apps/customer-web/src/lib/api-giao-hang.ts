'use client';

import { layGiaoHangDonHangCuaToi } from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type SuKienGiaoHangKhach = {
  id: string;
  trangThai: string;
  moTa: string | null;
  viTri: string | null;
  thoiGian: string;
};

export type VanChuyenKhach = {
  id: string;
  donHangNhaCungCapId: string;
  maDonNhaCungCap: string;
  tenNhaCungCap: string;
  maVanDon: string;
  trangThai: string;
  createdAt: string;
  updatedAt: string;
  suKien: SuKienGiaoHangKhach[];
};

export type GiaoHangDonHangKhach = {
  donHangId: string;
  maDonHang: string;
  vanChuyen: VanChuyenKhach[];
};

export const GIAO_HANG_KHACH_QUERY_KEY = ['giao-hang-khach'] as const;

export function giaoHangDonHangKhachQueryKey(donHangId: string) {
  return [...GIAO_HANG_KHACH_QUERY_KEY, 'don-hang', donHangId] as const;
}

export async function layGiaoHangDonHangKhach(donHangId: string): Promise<GiaoHangDonHangKhach> {
  const response = await thucThiApiKhachHang((tuyChon) =>
    layGiaoHangDonHangCuaToi(donHangId, tuyChon),
  );
  return duLieu(response) as GiaoHangDonHangKhach;
}
