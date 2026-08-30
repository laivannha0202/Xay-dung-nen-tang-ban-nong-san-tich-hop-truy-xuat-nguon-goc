'use client';

import { layQrCodeLoSanPham, taoQrCodeLoSanPham } from '@agrimarket/api-client';

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

export async function layQr(loSanPhamId: string) {
  const response = await layQrCodeLoSanPham(loSanPhamId, bearerOptions());

  return duLieu(response);
}

export async function taoQr(loSanPhamId: string) {
  const response = await taoQrCodeLoSanPham(loSanPhamId, bearerOptions());

  return duLieu(response);
}
