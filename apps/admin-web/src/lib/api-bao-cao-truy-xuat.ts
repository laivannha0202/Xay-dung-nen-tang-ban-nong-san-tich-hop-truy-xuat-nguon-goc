'use client';

import {
  duLieu,
  layBaoCaoTruyXuatDonHangAnhHuong,
  layBaoCaoTruyXuatLo,
  layBaoCaoTruyXuatThuHoi,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


export async function apiLayBaoCaoTruyXuatLo(params: Parameters<typeof layBaoCaoTruyXuatLo>[0]) {
  return duLieu(await layBaoCaoTruyXuatLo(params, bearerOptions()));
}

export async function apiLayBaoCaoTruyXuatThuHoi(
  params: Parameters<typeof layBaoCaoTruyXuatThuHoi>[0],
) {
  return duLieu(await layBaoCaoTruyXuatThuHoi(params, bearerOptions()));
}

export async function apiLayBaoCaoTruyXuatDonHangAnhHuong(
  params: Parameters<typeof layBaoCaoTruyXuatDonHangAnhHuong>[0],
) {
  return duLieu(await layBaoCaoTruyXuatDonHangAnhHuong(params, bearerOptions()));
}
