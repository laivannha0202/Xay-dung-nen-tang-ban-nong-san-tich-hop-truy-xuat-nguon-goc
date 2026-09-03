'use client';

import {
  layBaoCaoHaoHutTonKho,
  layBaoCaoTonKhoHetHan,
  layBaoCaoTonKhoHienTai,
  layBaoCaoTonKhoSapHetHan,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export async function apiLayBaoCaoTonKho(params: Parameters<typeof layBaoCaoTonKhoHienTai>[0]) {
  return duLieu(await layBaoCaoTonKhoHienTai(params, bearerOptions()));
}

export async function apiLayBaoCaoSapHetHan(
  params: Parameters<typeof layBaoCaoTonKhoSapHetHan>[0],
) {
  return duLieu(await layBaoCaoTonKhoSapHetHan(params, bearerOptions()));
}

export async function apiLayBaoCaoHetHan(params: Parameters<typeof layBaoCaoTonKhoHetHan>[0]) {
  return duLieu(await layBaoCaoTonKhoHetHan(params, bearerOptions()));
}

export async function apiLayBaoCaoHaoHut(params: Parameters<typeof layBaoCaoHaoHutTonKho>[0]) {
  return duLieu(await layBaoCaoHaoHutTonKho(params, bearerOptions()));
}
