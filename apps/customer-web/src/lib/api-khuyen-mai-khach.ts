'use client';

import {
  boLuuKhuyenMaiRuntime,
  layKhuyenMaiCongKhaiRuntime,
  layKhuyenMaiDaLuuRuntime,
  luuKhuyenMaiRuntime,
  type KhuyenMaiKhachHang,
} from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

export type { KhuyenMaiKhachHang };

export const KHUYEN_MAI_CONG_KHAI_QUERY_KEY = ['khuyen-mai', 'cong-khai'] as const;
export const KHUYEN_MAI_DA_LUU_QUERY_KEY = ['khuyen-mai-khach', 'da-luu'] as const;

export function layKhuyenMaiCongKhaiKhach(): Promise<KhuyenMaiKhachHang[]> {
  return layKhuyenMaiCongKhaiRuntime({ cache: 'no-store' });
}

export function layKhuyenMaiDaLuuKhach(): Promise<KhuyenMaiKhachHang[]> {
  return thucThiApiKhachHang((tuyChon) =>
    layKhuyenMaiDaLuuRuntime({ ...tuyChon, cache: 'no-store' }),
  );
}

export function luuKhuyenMaiKhach(id: string): Promise<KhuyenMaiKhachHang> {
  return thucThiApiKhachHang((tuyChon) => luuKhuyenMaiRuntime(id, tuyChon));
}

export function boLuuKhuyenMaiKhach(id: string): Promise<{ ok: boolean }> {
  return thucThiApiKhachHang((tuyChon) => boLuuKhuyenMaiRuntime(id, tuyChon));
}
