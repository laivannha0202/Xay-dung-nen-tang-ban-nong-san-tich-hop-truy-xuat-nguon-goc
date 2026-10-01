'use client';

import { duLieu, layChiTietGiaoDichTonKho, layDanhSachGiaoDichTonKho } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


export async function layDanhSach(params: Parameters<typeof layDanhSachGiaoDichTonKho>[0]) {
  return duLieu(await layDanhSachGiaoDichTonKho(params, bearerOptions()));
}

export async function layChiTiet(id: string) {
  return duLieu(await layChiTietGiaoDichTonKho(id, bearerOptions()));
}
