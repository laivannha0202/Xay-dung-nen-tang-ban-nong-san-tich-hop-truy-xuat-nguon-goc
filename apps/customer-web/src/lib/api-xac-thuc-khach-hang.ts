'use client';

import { doiMatKhau } from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export async function doiMatKhauKhachHangWeb(input: {
  matKhauHienTai: string;
  matKhauMoi: string;
}): Promise<{ thongBao?: string }> {
  const response = await thucThiApiKhachHang((options) =>
    doiMatKhau(input, options),
  );
  return duLieu(response) as { thongBao?: string };
}

// AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
