'use client';

import {
  duLieu,
  capNhatThuHoach,
  layChiTietThuHoach,
  layDanhSachMuaVu,
  layDanhSachThuHoach,
  taoThuHoach,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


export async function layDanhSach(params: Parameters<typeof layDanhSachThuHoach>[0]) {
  const response = await layDanhSachThuHoach(params, bearerOptions());

  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietThuHoach(id, bearerOptions());

  return duLieu(response);
}

export async function taoMoi(body: Parameters<typeof taoThuHoach>[0]) {
  const response = await taoThuHoach(body, bearerOptions());

  return duLieu(response);
}

export async function capNhat(id: string, body: Parameters<typeof capNhatThuHoach>[1]) {
  const response = await capNhatThuHoach(id, body, bearerOptions());

  return duLieu(response);
}

export async function layMuaVu() {
  const response = await layDanhSachMuaVu(
    {
      trang: 1,
      gioiHan: 100,
    },
    bearerOptions(),
  );

  return duLieu(response);
}
