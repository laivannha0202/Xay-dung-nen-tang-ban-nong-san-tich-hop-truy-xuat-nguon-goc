'use client';

import {
  capNhatTrangTrai,
  doiTrangThaiTrangTrai,
  layApiBaseUrl,
  layChiTietTrangTrai,
  layDanhSachNhaCungCap,
  layDanhSachTrangTrai,
  taoTrangTrai,
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

export async function layDanhSach(params: Parameters<typeof layDanhSachTrangTrai>[0]) {
  const response = await layDanhSachTrangTrai(params, bearerOptions());

  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietTrangTrai(id, bearerOptions());

  return duLieu(response);
}

export async function taoMoi(body: Parameters<typeof taoTrangTrai>[0]) {
  const response = await taoTrangTrai(body, bearerOptions());

  return duLieu(response);
}

export async function capNhat(id: string, body: Parameters<typeof capNhatTrangTrai>[1]) {
  const response = await capNhatTrangTrai(id, body, bearerOptions());

  return duLieu(response);
}

export async function doiTrangThai(id: string, body: Parameters<typeof doiTrangThaiTrangTrai>[1]) {
  const response = await doiTrangThaiTrangTrai(id, body, bearerOptions());

  return duLieu(response);
}

export async function layNhaCungCapHoatDong() {
  const response = await layDanhSachNhaCungCap(
    {
      trang: 1,
      gioiHan: 100,
      trangThai: 'HOAT_DONG',
    },
    bearerOptions(),
  );

  return duLieu(response);
}

export async function taiAnhTrangTrai(file: File): Promise<{
  id: string;
  tenGoc: string;
  mimeType: string;
}> {
  const form = new FormData();
  form.append('tep', file);

  const auth = bearerOptions();
  const headers = new Headers(auth.headers);

  const response = await fetch(`${layApiBaseUrl()}/api/v1/tep-tin/tai-len`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: form,
  });

  if (!response.ok) {
    let thongBao = 'Không tải được ảnh.';

    try {
      const body = (await response.json()) as {
        message?: string | string[];
      };

      if (Array.isArray(body.message)) {
        thongBao = body.message.join(', ');
      } else if (body.message) {
        thongBao = body.message;
      }
    } catch {
      // Giữ thông báo mặc định.
    }

    throw new Error(thongBao);
  }

  return response.json() as Promise<{
    id: string;
    tenGoc: string;
    mimeType: string;
  }>;
}
