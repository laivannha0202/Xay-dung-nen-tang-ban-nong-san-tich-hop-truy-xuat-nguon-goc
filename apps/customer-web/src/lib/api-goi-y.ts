'use client';

import {
  layGoiYSanPhamRuntime,
  type DanhSachGoiYSanPham,
} from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

export const GOI_Y_KHACH_HANG_QUERY_KEY = ['khach-hang', 'goi-y'] as const;

export function layGoiYSanPhamKhachHang(gioiHan = 8): Promise<DanhSachGoiYSanPham> {
  return thucThiApiKhachHang((tuyChon) => layGoiYSanPhamRuntime(gioiHan, tuyChon));
}
