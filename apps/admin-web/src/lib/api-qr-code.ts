'use client';

import { duLieu, layQrCodeLoSanPham, taoQrCodeLoSanPham } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


export async function layQr(loSanPhamId: string) {
  const response = await layQrCodeLoSanPham(loSanPhamId, bearerOptions());

  return duLieu(response);
}

export async function taoQr(loSanPhamId: string) {
  const response = await taoQrCodeLoSanPham(loSanPhamId, bearerOptions());

  return duLieu(response);
}
