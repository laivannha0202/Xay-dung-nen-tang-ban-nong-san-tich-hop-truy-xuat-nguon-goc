'use client';

import { layChiTietGiaoDichTonKho, layDanhSachGiaoDichTonKho } from '@agrimarket/api-client';

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

export async function layDanhSach(params: Parameters<typeof layDanhSachGiaoDichTonKho>[0]) {
  return duLieu(await layDanhSachGiaoDichTonKho(params, bearerOptions()));
}

export async function layChiTiet(id: string) {
  return duLieu(await layChiTietGiaoDichTonKho(id, bearerOptions()));
}
