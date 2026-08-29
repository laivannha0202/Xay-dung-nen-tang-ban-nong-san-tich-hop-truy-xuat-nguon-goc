'use client';

import {
  capNhatNhaCungCap,
  doiTrangThaiNhaCungCap,
  layChiTietNhaCungCap,
  layDanhSachNhaCungCap,
  taoNhaCungCap,
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

export async function layDanhSach(params: Parameters<typeof layDanhSachNhaCungCap>[0]) {
  const response = await layDanhSachNhaCungCap(params, bearerOptions());

  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietNhaCungCap(id, bearerOptions());

  return duLieu(response);
}

export async function taoMoi(body: Parameters<typeof taoNhaCungCap>[0]) {
  const response = await taoNhaCungCap(body, bearerOptions());

  return duLieu(response);
}

export async function capNhat(id: string, body: Parameters<typeof capNhatNhaCungCap>[1]) {
  const response = await capNhatNhaCungCap(id, body, bearerOptions());

  return duLieu(response);
}

export async function doiTrangThai(id: string, body: Parameters<typeof doiTrangThaiNhaCungCap>[1]) {
  const response = await doiTrangThaiNhaCungCap(id, body, bearerOptions());

  return duLieu(response);
}
