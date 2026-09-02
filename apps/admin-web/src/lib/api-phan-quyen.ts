'use client';

import { capNhatQuyenChoVaiTro, layMaTranPhanQuyen } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type QuyenMaTranAdmin = {
  id: string;
  ma: string;
  ten: string;
  moTa: string | null;
};

export type VaiTroMaTranAdmin = {
  id: string;
  ma: string;
  ten: string;
  moTa: string | null;
  maQuyen: string[];
};

export type MaTranPhanQuyenAdmin = {
  vaiTro: VaiTroMaTranAdmin[];
  quyen: QuyenMaTranAdmin[];
};

export async function apiLayMaTranPhanQuyen(): Promise<MaTranPhanQuyenAdmin> {
  return duLieu(await layMaTranPhanQuyen(bearerOptions())) as MaTranPhanQuyenAdmin;
}

export async function apiCapNhatQuyenChoVaiTro(
  vaiTroId: string,
  maQuyen: string[],
): Promise<VaiTroMaTranAdmin> {
  return duLieu(
    await capNhatQuyenChoVaiTro(vaiTroId, { maQuyen }, bearerOptions()),
  ) as VaiTroMaTranAdmin;
}
