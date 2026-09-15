'use client';

import { layApiBaseUrl } from '@agrimarket/api-client';

export type XaPhuongHungYen = {
  ma: string;
  ten: string;
  tenDayDu: string;
  loai: string;
  tenChuanHoa?: string;
};

export type ThonToDanPho = {
  ma: string;
  ten: string;
  tenDayDu: string;
  loai: string;
};

export const TINH_HUNG_YEN = 'Hưng Yên';

async function docJson<T>(duongDan: string): Promise<T> {
  const response = await fetch(`${layApiBaseUrl()}${duongDan}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function layDanhSachXaPhuongHungYen(tuKhoa?: string): Promise<XaPhuongHungYen[]> {
  const query = tuKhoa?.trim() ? `?tuKhoa=${encodeURIComponent(tuKhoa.trim())}` : '';
  return docJson<XaPhuongHungYen[]>(`/api/v1/dia-ban-hung-yen/xa-phuong${query}`);
}

export async function layDanhSachThonToDanPho(xaPhuongMa: string): Promise<ThonToDanPho[]> {
  return docJson<ThonToDanPho[]>(
    `/api/v1/dia-ban-hung-yen/xa-phuong/${encodeURIComponent(xaPhuongMa)}/thon-to-dan-pho`,
  );
}

export function nhanLoaiXaPhuong(loai: string): string {
  return loai === 'PHUONG' ? 'Phường' : 'Xã';
}
