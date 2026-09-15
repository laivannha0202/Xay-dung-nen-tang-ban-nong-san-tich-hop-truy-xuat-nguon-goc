'use client';

import {
  batDauDongGoi,
  hoanTatDongGoi,
  hoanTienThanhToan,
  layApiBaseUrl,
  layChecklistDongGoi,
  layChiTietDonHangQuanTri,
  layDanhSachDonHangQuanTri,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = {
  data: T;
};

type PricingSnapshotDonHangAdmin = {
  tamTinhHangHoa: number;
  phiVanChuyen: number;
  maKhuyenMai: string | null;
  giamKhuyenMai: number;
  diemDaDung: number;
  giaTriDiemDaDung: number;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export async function layDanhSachDonHangAdmin(
  params: Parameters<typeof layDanhSachDonHangQuanTri>[0],
) {
  return duLieu(await layDanhSachDonHangQuanTri(params, bearerOptions()));
}

export async function layChiTietDonHangAdmin(id: string) {
  const detail = duLieu(await layChiTietDonHangQuanTri(id, bearerOptions()));
  return detail as typeof detail & PricingSnapshotDonHangAdmin;
}

export async function layChecklistDongGoiAdmin(donNhaCungCapId: string) {
  return duLieu(await layChecklistDongGoi(donNhaCungCapId, bearerOptions()));
}

export async function batDauDongGoiAdmin(donNhaCungCapId: string) {
  return duLieu(await batDauDongGoi(donNhaCungCapId, bearerOptions()));
}

export async function hoanTatDongGoiAdmin(
  donNhaCungCapId: string,
  checklist: {
    dungSanPham: boolean;
    dungBatch: boolean;
    dungQty: boolean;
    dongGoi: boolean;
    qr: boolean;
  },
) {
  return duLieu(await hoanTatDongGoi(donNhaCungCapId, checklist, bearerOptions()));
}

export async function hoanTienThanhToanAdmin(
  thanhToanId: string,
  payload: Parameters<typeof hoanTienThanhToan>[1],
) {
  return duLieu(await hoanTienThanhToan(thanhToanId, payload, bearerOptions()));
}

export type TrangThaiVanChuyenAdmin =
  | 'CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED';

export async function capNhatTrangThaiVanChuyenAdmin(
  vanChuyenId: string,
  payload: {
    trangThai: TrangThaiVanChuyenAdmin;
    moTa?: string;
    viTri?: string;
  },
) {
  const baseUrl = layApiBaseUrl().replace(/\/+$/, '');
  const options = bearerOptions();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(
    `${baseUrl}/api/v1/quan-tri/giao-hang/${encodeURIComponent(vanChuyenId)}/trang-thai`,
    {
      ...options,
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    let message = `Cập nhật vận chuyển thất bại (HTTP ${response.status}).`;

    try {
      const errorPayload = (await response.json()) as {
        message?: string | string[];
      };
      if (Array.isArray(errorPayload.message)) {
        message = errorPayload.message.join('; ');
      } else if (typeof errorPayload.message === 'string' && errorPayload.message.trim()) {
        message = errorPayload.message;
      }
    } catch {
      // Giữ message HTTP mặc định.
    }

    throw new Error(message);
  }

  return response.json() as Promise<{
    vanChuyenId: string;
    maVanDon: string;
    trangThai: TrangThaiVanChuyenAdmin;
    donHangId: string;
    donHangTrangThai: string;
    codDaThanhToan: boolean;
  }>;
}

