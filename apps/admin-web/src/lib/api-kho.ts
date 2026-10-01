'use client';

import {
  duLieu,
  capNhatKho,
  doiTrangThaiKho,
  layChiTietKho,
  layDanhSachKho,
  taoKho,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


export async function layDanhSach(params: Parameters<typeof layDanhSachKho>[0]) {
  const response = await layDanhSachKho(params, bearerOptions());
  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietKho(id, bearerOptions());
  return duLieu(response);
}

export async function taoMoi(body: Parameters<typeof taoKho>[0]) {
  const response = await taoKho(body, bearerOptions());
  return duLieu(response);
}

export async function capNhat(id: string, body: Parameters<typeof capNhatKho>[1]) {
  const response = await capNhatKho(id, body, bearerOptions());
  return duLieu(response);
}

export async function doiTrangThai(id: string, body: Parameters<typeof doiTrangThaiKho>[1]) {
  const response = await doiTrangThaiKho(id, body, bearerOptions());
  return duLieu(response);
}
