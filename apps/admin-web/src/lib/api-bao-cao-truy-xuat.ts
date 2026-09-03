'use client';

import {
  layBaoCaoTruyXuatDonHangAnhHuong,
  layBaoCaoTruyXuatLo,
  layBaoCaoTruyXuatThuHoi,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

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
