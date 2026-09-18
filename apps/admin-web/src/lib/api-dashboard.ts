'use client';

import {
  layDashboard,
  layDoanhThuTheoNgay,
} from '@agrimarket/api-client';

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

export type DoanhThuNgayDashboard = {
  ngay: string;
  nhan: string;
  doanhThu: number;
};

const DASHBOARD_TIMEOUT_MS = 10_000;
const SO_NGAY_TOI_DA_BIEU_DO = 31;

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

function laNgayHopLe(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}



export async function apiLayDashboard(): Promise<DashboardAdmin> {
  const response = await voiTimeout(layDashboard(bearerOptions())).then(duLieu);

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

/**
 * Doanh thu gộp từng ngày trong khoảng [tuNgay, denNgay] (ngày UTC, inclusive).
 * Mỗi ngày là một aggregate server-side (gioiHan 1, đọc doanhThuGop toàn filter),
 * KHÔNG cộng dồn các dòng phân trang ở trình duyệt.
 */
export async function apiLayDoanhThuTheoNgay(
  tuNgay: string,
  denNgay: string,
): Promise<DoanhThuNgayDashboard[]> {
  if (!laNgayHopLe(tuNgay) || !laNgayHopLe(denNgay)) {
    throw new Error('Khoảng ngày không hợp lệ; dùng YYYY-MM-DD.');
  }

  if (tuNgay > denNgay) {
    throw new Error('Từ ngày không được sau đến ngày.');
  }

  const batDau = new Date(`${tuNgay}T00:00:00.000Z`).getTime();
  const ketThuc = new Date(`${denNgay}T00:00:00.000Z`).getTime();
  const soNgay = Math.floor((ketThuc - batDau) / 86_400_000) + 1;

  if (soNgay > SO_NGAY_TOI_DA_BIEU_DO) {
    throw new Error(`Biểu đồ hỗ trợ tối đa ${SO_NGAY_TOI_DA_BIEU_DO} ngày.`);
  }

  const response = await voiTimeout(
    layDoanhThuTheoNgay(
      {
        tuNgay,
        denNgay,
      },
      bearerOptions(),
    ),
  ).then(duLieu);

  return response.map((item) => {
    const [, month, day] = item.ngay.split('-');
    return {
      ngay: item.ngay,
      nhan: `${day}/${month}`,
      doanhThu: Number(item.doanhThuGop ?? 0),
    };
  });
}
