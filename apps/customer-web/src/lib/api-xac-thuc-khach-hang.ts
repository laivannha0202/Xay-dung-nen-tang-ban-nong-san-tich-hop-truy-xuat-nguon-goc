'use client';

import { duLieu, doiMatKhau } from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';


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
