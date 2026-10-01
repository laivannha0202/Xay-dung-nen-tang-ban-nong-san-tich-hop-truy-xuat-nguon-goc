'use client';

import {
  duLieu,
  capNhatQuyTacHoaHong,
  layDanhSachQuyTacHoaHong,
  taoQuyTacHoaHong,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


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
