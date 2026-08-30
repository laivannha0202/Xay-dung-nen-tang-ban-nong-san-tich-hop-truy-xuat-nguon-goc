'use client';

import {
  layChiTietSuKienTruyXuat,
  layDanhSachLoSanPham,
  layDanhSachSuKienTruyXuat,
  taoSuKienTruyXuat,
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

export async function layDanhSach(params: Parameters<typeof layDanhSachSuKienTruyXuat>[0]) {
  const response = await layDanhSachSuKienTruyXuat(params, bearerOptions());

  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietSuKienTruyXuat(id, bearerOptions());

  return duLieu(response);
}

export async function taoMoi(loSanPhamId: string, body: Parameters<typeof taoSuKienTruyXuat>[1]) {
  const response = await taoSuKienTruyXuat(loSanPhamId, body, bearerOptions());

  return duLieu(response);
}

export async function layDanhSachLo() {
  const response = await layDanhSachLoSanPham(
    {
      trang: 1,
      gioiHan: 100,
    },
    bearerOptions(),
  );

  return duLieu(response);
}
