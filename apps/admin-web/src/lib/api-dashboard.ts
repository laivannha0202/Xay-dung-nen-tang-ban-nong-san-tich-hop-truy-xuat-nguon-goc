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

const DASHBOARD_TIMEOUT_MS = 10_000;

async function voiTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Dashboard API quá thời gian phản hồi (10 giây).')),
          DASHBOARD_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function apiLayDashboard(): Promise<DashboardAdmin> {
  const response = duLieu(await voiTimeout(layDashboard(bearerOptions())));

  return {
    doanhThu: Number(response.doanhThu),
    donHang: Number(response.donHang),
    khachHang: Number(response.khachHang),
    sanPham: Number(response.sanPham),
    canhBaoTonKho: {
      tong: Number(response.canhBaoTonKho.tong),
      sapHetHan: Number(response.canhBaoTonKho.sapHetHan),
      hetHan: Number(response.canhBaoTonKho.hetHan),
    },
    khieuNai: Number(response.khieuNai),
    capNhatLuc: response.capNhatLuc,
  };
}
