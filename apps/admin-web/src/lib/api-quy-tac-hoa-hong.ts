'use client';

import {
  capNhatQuyTacHoaHong,
  layDanhSachQuyTacHoaHong,
  taoQuyTacHoaHong,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export async function apiLayDanhSachQuyTacHoaHong(
  params: Parameters<typeof layDanhSachQuyTacHoaHong>[0],
) {
  return duLieu(await layDanhSachQuyTacHoaHong(params, bearerOptions()));
}

export async function apiTaoQuyTacHoaHong(body: Parameters<typeof taoQuyTacHoaHong>[0]) {
  return duLieu(await taoQuyTacHoaHong(body, bearerOptions()));
}

export async function apiCapNhatQuyTacHoaHong(
  id: string,
  body: Parameters<typeof capNhatQuyTacHoaHong>[1],
) {
  return duLieu(await capNhatQuyTacHoaHong(id, body, bearerOptions()));
}
