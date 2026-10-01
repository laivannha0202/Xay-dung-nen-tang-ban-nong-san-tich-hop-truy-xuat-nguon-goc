'use client';

import {
  duLieu,
  layBaoCaoHaoHutTonKho,
  layBaoCaoTonKhoHetHan,
  layBaoCaoTonKhoHienTai,
  layBaoCaoTonKhoSapHetHan,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


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
