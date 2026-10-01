'use client';

import {
  duLieu,
  chuyenKho as chuyenKhoApi,
  dieuChinhTonKho as dieuChinhTonKhoApi,
  kiemTraChatLuongLo as kiemTraChatLuongLoApi,
  layChiTietTonKho,
  layDanhSachTonKho,
  nhapKho as nhapKhoApi,
  xuatKho as xuatKhoApi,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


export async function layDanhSach(params: Parameters<typeof layDanhSachTonKho>[0]) {
  return duLieu(await layDanhSachTonKho(params, bearerOptions()));
}

export async function layChiTiet(id: string) {
  return duLieu(await layChiTietTonKho(id, bearerOptions()));
}

export async function nhapKho(body: Parameters<typeof nhapKhoApi>[0]) {
  return duLieu(await nhapKhoApi(body, bearerOptions()));
}

export async function xuatKho(body: Parameters<typeof xuatKhoApi>[0]) {
  return duLieu(await xuatKhoApi(body, bearerOptions()));
}

export async function chuyenKho(body: Parameters<typeof chuyenKhoApi>[0]) {
  return duLieu(await chuyenKhoApi(body, bearerOptions()));
}

export async function dieuChinhTonKho(id: string, body: Parameters<typeof dieuChinhTonKhoApi>[1]) {
  return duLieu(await dieuChinhTonKhoApi(id, body, bearerOptions()));
}

export async function kiemTraChatLuong(id: string, body: Parameters<typeof kiemTraChatLuongLoApi>[1]) {
  return duLieu(await kiemTraChatLuongLoApi(id, body, bearerOptions()));
}
