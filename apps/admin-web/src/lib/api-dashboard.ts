'use client';

import { layDashboard } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type DashboardAdmin = {
  doanhThu: number;
  donHang: number;
  khachHang: number;
  sanPham: number;
  canhBaoTonKho: {
    tong: number;
    sapHetHan: number;
    hetHan: number;
  };
  khieuNai: number;
  capNhatLuc: string;
};

export async function apiLayDashboard(): Promise<DashboardAdmin> {
  const response = duLieu(await layDashboard(bearerOptions()));
  return {
    doanhThu: response.doanhThu,
    donHang: response.donHang,
    khachHang: response.khachHang,
    sanPham: response.sanPham,
    canhBaoTonKho: {
      tong: response.canhBaoTonKho.tong,
      sapHetHan: response.canhBaoTonKho.sapHetHan,
      hetHan: response.canhBaoTonKho.hetHan,
    },
    khieuNai: response.khieuNai,
    capNhatLuc: response.capNhatLuc,
  };
}
