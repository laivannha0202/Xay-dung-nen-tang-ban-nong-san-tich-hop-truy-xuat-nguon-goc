'use client';

import {
  capNhatDanhMucSanPham,
  doiTrangThaiDanhMucSanPham,
  layApiBaseUrl,
  layChiTietDanhMucSanPham,
  layDanhSachDanhMucSanPham,
  taoDanhMucSanPham,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

export async function layDanhSach(params: Parameters<typeof layDanhSachDanhMucSanPham>[0]) {
  const response = await layDanhSachDanhMucSanPham(params, bearerOptions());

  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietDanhMucSanPham(id, bearerOptions());

  return duLieu(response);
}

export async function taoMoi(body: Parameters<typeof taoDanhMucSanPham>[0]) {
  const response = await taoDanhMucSanPham(body, bearerOptions());

  return duLieu(response);
}

export async function capNhat(id: string, body: Parameters<typeof capNhatDanhMucSanPham>[1]) {
  const response = await capNhatDanhMucSanPham(id, body, bearerOptions());

  return duLieu(response);
}

export async function doiTrangThai(id: string, trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG') {
  const response = await doiTrangThaiDanhMucSanPham(
    id,
    {
      trangThai,
    },
    bearerOptions(),
  );

  return duLieu(response);
}

export async function layDanhMucHoatDong() {
  const response = await layDanhSachDanhMucSanPham(
    {
      trang: 1,
      gioiHan: 100,
      trangThai: 'HOAT_DONG',
    },
    bearerOptions(),
  );

  return duLieu(response);
}

export async function taiAnhDanhMuc(file: File): Promise<{
  id: string;
  tenGoc: string;
  mimeType: string;
}> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.');
  }

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
    let thongBao = 'Không tải được ảnh danh mục.';

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

  const result = (await response.json()) as {
    id: string;
    tenGoc: string;
    mimeType: string;
  };

  if (!result.mimeType.startsWith('image/')) {
    throw new Error('File tải lên không phải ảnh.');
  }

  return result;
}
