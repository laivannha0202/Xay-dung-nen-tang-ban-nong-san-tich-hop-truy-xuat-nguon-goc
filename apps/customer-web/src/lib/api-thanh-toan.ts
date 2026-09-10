'use client';

import { layThanhToanDonHangCuaToi } from '@agrimarket/api-client';

import { bearerOptionsKhachHang } from './phien-khach-hang';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

export type ThanhToanKhach = {
  id: string;
  donHangId: string;
  maDonHang: string;
  soTien: number;
  phuongThuc: string;
  trangThai: string;
  giaoDich: {
    id: string;
    maGiaoDich: string;
    soTien: number;
    phuongThuc: string;
    trangThai: string;
    thoiGian: string;
  };
  datCho: {
    id: string;
    trangThai: string;
    hetHanLuc: string;
  };
  paymentUrl?: string;
  expiresAt?: string;
};

export const THANH_TOAN_KHACH_QUERY_KEY = ['thanh-toan-khach'] as const;

export function thanhToanDonHangKhachQueryKey(donHangId: string) {
  return [...THANH_TOAN_KHACH_QUERY_KEY, 'don-hang', donHangId] as const;
}

export async function layThanhToanDonHangKhach(donHangId: string): Promise<ThanhToanKhach> {
  const response = await layThanhToanDonHangCuaToi(donHangId, bearerOptionsKhachHang());
  return duLieu(response) as ThanhToanKhach;
}
