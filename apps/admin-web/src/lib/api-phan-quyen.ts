'use client';

import { duLieu, capNhatQuyenChoVaiTro, layMaTranPhanQuyen } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


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
