import {
  boLuuKhuyenMaiRuntime,
  layKhuyenMaiCongKhaiRuntime,
  layKhuyenMaiDaLuuRuntime,
  luuKhuyenMaiRuntime,
  type KhuyenMaiKhachHang,
} from '@agrimarket/api-client';

import { layTuyChonBearer } from './phien-xac-thuc';

export type { KhuyenMaiKhachHang };

export const KHUYEN_MAI_CONG_KHAI_MOBILE_QUERY_KEY = ['khuyen-mai-mobile', 'cong-khai'] as const;
export const KHUYEN_MAI_DA_LUU_MOBILE_QUERY_KEY = ['khuyen-mai-mobile', 'da-luu'] as const;

export function layKhuyenMaiCongKhaiMobile(): Promise<KhuyenMaiKhachHang[]> {
  return layKhuyenMaiCongKhaiRuntime();
}

export async function layKhuyenMaiDaLuuMobile(): Promise<KhuyenMaiKhachHang[]> {
  return layKhuyenMaiDaLuuRuntime(await layTuyChonBearer());
}

export async function luuKhuyenMaiMobile(id: string): Promise<KhuyenMaiKhachHang> {
  return luuKhuyenMaiRuntime(id, await layTuyChonBearer());
}

export async function boLuuKhuyenMaiMobile(id: string): Promise<{ ok: boolean }> {
  return boLuuKhuyenMaiRuntime(id, await layTuyChonBearer());
}

// AGRIMARKET-MOBILE-WEB-PARITY-V1
