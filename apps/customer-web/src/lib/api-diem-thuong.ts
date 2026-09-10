'use client';

import {
  layGiaoDichDiemThuongRuntime,
  layTongQuanDiemThuongRuntime,
  type DanhSachGiaoDichDiemThuong,
  type TongQuanDiemThuong,
} from '@agrimarket/api-client';

import { bearerOptionsKhachHang } from './phien-khach-hang';

export const DIEM_THUONG_TONG_QUAN_QUERY_KEY = ['diem-thuong-khach', 'tong-quan'] as const;

export function diemThuongGiaoDichQueryKey(trang: number, gioiHan: number) {
  return ['diem-thuong-khach', 'giao-dich', trang, gioiHan] as const;
}

export function layTongQuanDiemThuongKhach(): Promise<TongQuanDiemThuong> {
  return layTongQuanDiemThuongRuntime(bearerOptionsKhachHang());
}

export function layGiaoDichDiemThuongKhach(
  trang = 1,
  gioiHan = 20,
): Promise<DanhSachGiaoDichDiemThuong> {
  return layGiaoDichDiemThuongRuntime({ trang, gioiHan }, bearerOptionsKhachHang());
}
