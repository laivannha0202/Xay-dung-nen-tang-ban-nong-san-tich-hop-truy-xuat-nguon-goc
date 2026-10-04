import {
  layVoucherCongKhaiRuntime,
  layVoucherCuaToiRuntime,
  luuVoucherCuaToiRuntime,
  type DanhSachVoucherHienThi,
  type VoucherHienThi,
} from '@agrimarket/api-client';

import { layTuyChonBearer } from './phien-xac-thuc';

export const VOUCHER_MOBILE_QUERY_KEY = ['mobile', 'voucher', 'cua-toi'] as const;

export function layVoucherCongKhaiMobile(): Promise<DanhSachVoucherHienThi> {
  return layVoucherCongKhaiRuntime();
}

export async function layVoucherCuaToiMobile(): Promise<DanhSachVoucherHienThi> {
  return layVoucherCuaToiRuntime(await layTuyChonBearer());
}

export async function luuVoucherCuaToiMobile(khuyenMaiId: string): Promise<VoucherHienThi> {
  return luuVoucherCuaToiRuntime(khuyenMaiId, await layTuyChonBearer());
}
