'use client';

import {
  layBaoCaoDonHangDoanhThu,
  layDashboard,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type DoanhThuNgayDashboard = {
  ngay: string;
  nhan: string;
  doanhThu: number;
};

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
  doanhThu7Ngay: DoanhThuNgayDashboard[];
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

function danhSach7NgayUtc(): string[] {
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const offset = 6 - index;
    return new Date(todayUtc - offset * 86_400_000)
      .toISOString()
      .slice(0, 10);
  });
}

function nhanNgay(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

async function layDoanhThu7Ngay(): Promise<DoanhThuNgayDashboard[]> {
  const dates = danhSach7NgayUtc();

  return Promise.all(
    dates.map(async (iso) => {
      const report = duLieu(
        await voiTimeout(
          layBaoCaoDonHangDoanhThu(
            {
              trang: 1,
              gioiHan: 1,
              tuNgay: iso,
              denNgay: iso,
            },
            bearerOptions(),
          ),
        ),
      ) as { doanhThuGop: number };

      return {
        ngay: iso,
        nhan: nhanNgay(iso),
        doanhThu: Number(report.doanhThuGop ?? 0),
      };
    }),
  );
}

export async function apiLayDashboard(): Promise<DashboardAdmin> {
  const [response, doanhThu7Ngay] = await Promise.all([
    voiTimeout(layDashboard(bearerOptions())).then(duLieu),
    layDoanhThu7Ngay().catch(() => []),
  ]);

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
    doanhThu7Ngay,
  };
}
