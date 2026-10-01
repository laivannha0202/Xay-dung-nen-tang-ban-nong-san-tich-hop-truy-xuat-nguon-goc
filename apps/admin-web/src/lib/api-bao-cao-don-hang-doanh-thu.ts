'use client';

import { duLieu, layBaoCaoDonHangDoanhThu } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


export async function apiLayBaoCaoDonHangDoanhThu(
  params: Parameters<typeof layBaoCaoDonHangDoanhThu>[0],
) {
  return duLieu(await layBaoCaoDonHangDoanhThu(params, bearerOptions()));
}
