'use client';

import { layChiTietTonKho, layDanhSachTonKho } from '@agrimarket/api-client';

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

export async function layDanhSach(params: Parameters<typeof layDanhSachTonKho>[0]) {
  const response = await layDanhSachTonKho(params, bearerOptions());
  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietTonKho(id, bearerOptions());
  return duLieu(response);
}
