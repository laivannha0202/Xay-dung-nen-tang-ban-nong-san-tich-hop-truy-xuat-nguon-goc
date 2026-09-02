'use client';

import { layNhatKyKiemToan } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

function chuoiHoacNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function banGhiHoacNull(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export type NhatKyKiemToanAdmin = {
  id: string;
  tacNhanId: string | null;
  tacNhan: string;
  hanhDong: string;
  thucThe: string;
  thucTheId: string | null;
  truoc: Record<string, unknown> | null;
  sau: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type DanhSachNhatKyKiemToanAdmin = {
  duLieu: NhatKyKiemToanAdmin[];
  tong: number;
  trang: number;
  gioiHan: number;
};

export async function apiLayNhatKyKiemToan(
  params: Parameters<typeof layNhatKyKiemToan>[0],
): Promise<DanhSachNhatKyKiemToanAdmin> {
  const response = duLieu(await layNhatKyKiemToan(params, bearerOptions()));

  return {
    duLieu: response.duLieu.map((item): NhatKyKiemToanAdmin => ({
      id: item.id,
      tacNhanId: chuoiHoacNull(item.tacNhanId),
      tacNhan: item.tacNhan,
      hanhDong: item.hanhDong,
      thucThe: item.thucThe,
      thucTheId: chuoiHoacNull(item.thucTheId),
      truoc: banGhiHoacNull(item.truoc),
      sau: banGhiHoacNull(item.sau),
      metadata: banGhiHoacNull(item.metadata),
      createdAt: item.createdAt,
    })),
    tong: response.tong,
    trang: response.trang,
    gioiHan: response.gioiHan,
  };
}
