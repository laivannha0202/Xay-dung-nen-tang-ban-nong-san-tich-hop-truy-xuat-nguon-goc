'use client';

import {
  layVoucherCongKhaiRuntime,
  layVoucherCuaToiRuntime,
  luuVoucherCuaToiRuntime,
  type DanhSachVoucherHienThi,
  type VoucherHienThi,
} from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

export const VOUCHER_CONG_KHAI_QUERY_KEY = ['voucher', 'cong-khai'] as const;
export const VOUCHER_CUA_TOI_QUERY_KEY = ['voucher', 'cua-toi'] as const;

export function layVoucherCongKhai(): Promise<DanhSachVoucherHienThi> {
  return layVoucherCongKhaiRuntime();
}

export function layVoucherCuaToi(): Promise<DanhSachVoucherHienThi> {
  return thucThiApiKhachHang((tuyChon) => layVoucherCuaToiRuntime(tuyChon));
}

export function luuVoucherCuaToi(khuyenMaiId: string): Promise<VoucherHienThi> {
  return thucThiApiKhachHang((tuyChon) => luuVoucherCuaToiRuntime(khuyenMaiId, tuyChon));
}
