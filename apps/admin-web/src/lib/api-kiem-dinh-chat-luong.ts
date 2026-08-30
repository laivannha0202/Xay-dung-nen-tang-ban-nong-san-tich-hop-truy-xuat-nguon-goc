'use client';

import {
  layApiBaseUrl,
  layChiTietKiemDinhChatLuong,
  layDanhSachKiemDinhChatLuong,
  layDanhSachLoSanPham,
  taoKiemDinhChatLuong,
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

export async function layDanhSach(params: Parameters<typeof layDanhSachKiemDinhChatLuong>[0]) {
  const response = await layDanhSachKiemDinhChatLuong(params, bearerOptions());

  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietKiemDinhChatLuong(id, bearerOptions());

  return duLieu(response);
}

export async function taoMoi(
  loSanPhamId: string,
  body: Parameters<typeof taoKiemDinhChatLuong>[1],
) {
  const response = await taoKiemDinhChatLuong(loSanPhamId, body, bearerOptions());

  return duLieu(response);
}

export async function layLoCoTheKiemDinh() {
  const statuses = ['CHO_KIEM_DINH', 'TAM_GIU', 'CO_THE_BAN'] as const;

  const responses = await Promise.all(
    statuses.map(async (trangThai) => {
      const response = await layDanhSachLoSanPham(
        {
          trang: 1,
          gioiHan: 100,
          trangThai,
        },
        bearerOptions(),
      );

      return duLieu(response);
    }),
  );

  const byId = new Map<string, (typeof responses)[number]['duLieu'][number]>();

  for (const response of responses) {
    for (const item of response.duLieu) {
      byId.set(item.id, item);
    }
  }

  return Array.from(byId.values());
}

export async function taiAnhKiemDinh(file: File): Promise<{
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
    let thongBao = 'Không tải được ảnh kiểm định.';

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
