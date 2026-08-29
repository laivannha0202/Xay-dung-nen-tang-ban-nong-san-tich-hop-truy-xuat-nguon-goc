'use client';

import {
  capNhatMuaVu,
  layChiTietMuaVu,
  layDanhSachMuaVu,
  layDanhSachTrangTrai,
  taoMuaVu,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = {
  data: T;
  status: number;
  headers: Headers;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

export async function layDanhSach(params: Parameters<typeof layDanhSachMuaVu>[0]) {
  const response = await layDanhSachMuaVu(params, bearerOptions());

  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietMuaVu(id, bearerOptions());

  return duLieu(response);
}

export async function taoMoi(body: Parameters<typeof taoMuaVu>[0]) {
  const response = await taoMuaVu(body, bearerOptions());

  return duLieu(response);
}

export async function capNhat(id: string, body: Parameters<typeof capNhatMuaVu>[1]) {
  const response = await capNhatMuaVu(id, body, bearerOptions());

  return duLieu(response);
}

export async function layTrangTraiHoatDong() {
  const response = await layDanhSachTrangTrai(
    {
      trang: 1,
      gioiHan: 100,
      trangThai: 'HOAT_DONG',
    },
    bearerOptions(),
  );

  return duLieu(response);
}
