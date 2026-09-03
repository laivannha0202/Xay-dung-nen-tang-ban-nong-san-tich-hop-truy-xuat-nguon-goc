'use client';

import {
  capNhatTrangThaiChiTraNhaCungCap,
  hoanTienThanhToan,
  layDanhSachChiTraNhaCungCap,
  layDanhSachDoiSoat,
  layDanhSachHoanTienTaiChinh,
  layDanhSachSoDuNhaCungCap,
  layDanhSachThanhToanTaiChinh,
  taoDoiSoat,
  taoYeuCauChiTraNhaCungCap,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export async function apiLayDanhSachThanhToanTaiChinh(
  params: Parameters<typeof layDanhSachThanhToanTaiChinh>[0],
) {
  return duLieu(await layDanhSachThanhToanTaiChinh(params, bearerOptions()));
}

export async function apiLayDanhSachHoanTienTaiChinh(
  params: Parameters<typeof layDanhSachHoanTienTaiChinh>[0],
) {
  return duLieu(await layDanhSachHoanTienTaiChinh(params, bearerOptions()));
}

export async function apiHoanTienThanhToan(
  thanhToanId: string,
  body: Parameters<typeof hoanTienThanhToan>[1],
) {
  return duLieu(await hoanTienThanhToan(thanhToanId, body, bearerOptions()));
}

export async function apiLayDanhSachDoiSoat(params: Parameters<typeof layDanhSachDoiSoat>[0]) {
  return duLieu(await layDanhSachDoiSoat(params, bearerOptions()));
}

export async function apiTaoDoiSoat(body: Parameters<typeof taoDoiSoat>[0]) {
  return duLieu(await taoDoiSoat(body, bearerOptions()));
}

export async function apiLayDanhSachSoDuNhaCungCap(
  params: Parameters<typeof layDanhSachSoDuNhaCungCap>[0],
) {
  return duLieu(await layDanhSachSoDuNhaCungCap(params, bearerOptions()));
}

export async function apiLayDanhSachChiTraNhaCungCap(
  params: Parameters<typeof layDanhSachChiTraNhaCungCap>[0],
) {
  return duLieu(await layDanhSachChiTraNhaCungCap(params, bearerOptions()));
}

export async function apiTaoYeuCauChiTraNhaCungCap(
  body: Parameters<typeof taoYeuCauChiTraNhaCungCap>[0],
) {
  return duLieu(await taoYeuCauChiTraNhaCungCap(body, bearerOptions()));
}

export async function apiCapNhatTrangThaiChiTraNhaCungCap(
  id: string,
  body: Parameters<typeof capNhatTrangThaiChiTraNhaCungCap>[1],
) {
  return duLieu(await capNhatTrangThaiChiTraNhaCungCap(id, body, bearerOptions()));
}
