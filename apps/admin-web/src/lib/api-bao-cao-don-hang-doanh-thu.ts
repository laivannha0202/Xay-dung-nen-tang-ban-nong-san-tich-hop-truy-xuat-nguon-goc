'use client';

import { layBaoCaoDonHangDoanhThu } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export async function apiLayBaoCaoDonHangDoanhThu(
  params: Parameters<typeof layBaoCaoDonHangDoanhThu>[0],
) {
  return duLieu(await layBaoCaoDonHangDoanhThu(params, bearerOptions()));
}
