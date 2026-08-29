'use client';

import {
  capNhatChungNhan,
  layApiBaseUrl,
  layChiTietChungNhan,
  layDanhSachChungNhan,
  layDanhSachTrangTrai,
  taoChungNhan,
  xacMinhChungNhan,
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

export async function layDanhSach(params: Parameters<typeof layDanhSachChungNhan>[0]) {
  const response = await layDanhSachChungNhan(params, bearerOptions());

  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietChungNhan(id, bearerOptions());

  return duLieu(response);
}

export async function taoMoi(body: Parameters<typeof taoChungNhan>[0]) {
  const response = await taoChungNhan(body, bearerOptions());

  return duLieu(response);
}

export async function capNhat(id: string, body: Parameters<typeof capNhatChungNhan>[1]) {
  const response = await capNhatChungNhan(id, body, bearerOptions());

  return duLieu(response);
}

export async function xacMinh(id: string, body: Parameters<typeof xacMinhChungNhan>[1]) {
  const response = await xacMinhChungNhan(id, body, bearerOptions());

  return duLieu(response);
}

export async function layTrangTraiHoatDong() {
  const response = await layDanhSachTrangTrai(
    {
      trang: 1,
      gioiHan: 100,
      trangThai: 'HOAT_DONG',
    },
    bearerOptions(),
  );

  return duLieu(response);
}

export async function taiFileChungNhan(file: File): Promise<{
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
    let thongBao = 'Không tải được file chứng nhận.';

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
