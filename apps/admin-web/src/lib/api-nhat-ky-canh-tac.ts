'use client';

import {
  capNhatNhatKyCanhTac,
  layChiTietNhatKyCanhTac,
  layDanhSachMuaVu,
  layDanhSachNhatKyCanhTac,
  taoNhatKyCanhTac,
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

export async function layDanhSach(params: Parameters<typeof layDanhSachNhatKyCanhTac>[0]) {
  const response = await layDanhSachNhatKyCanhTac(params, bearerOptions());

  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietNhatKyCanhTac(id, bearerOptions());

  return duLieu(response);
}

export async function taoMoi(body: Parameters<typeof taoNhatKyCanhTac>[0]) {
  const response = await taoNhatKyCanhTac(body, bearerOptions());

  return duLieu(response);
}

export async function capNhat(id: string, body: Parameters<typeof capNhatNhatKyCanhTac>[1]) {
  const response = await capNhatNhatKyCanhTac(id, body, bearerOptions());

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
