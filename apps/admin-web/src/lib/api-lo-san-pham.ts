'use client';

import {
  duLieu,
  capNhatLoSanPham,
  guiKiemDinhLoSanPham,
  layChiTietLoSanPham,
  layDanhSachLoSanPham,
  taoLoTuThuHoach,
  thuHoiLoSanPham,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


export async function layDanhSach(params: Parameters<typeof layDanhSachLoSanPham>[0]) {
  const response = await layDanhSachLoSanPham(params, bearerOptions());

  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietLoSanPham(id, bearerOptions());

  return duLieu(response);
}

export async function taoTuThuHoach(
  thuHoachId: string,
  body: Parameters<typeof taoLoTuThuHoach>[1],
) {
  const response = await taoLoTuThuHoach(thuHoachId, body, bearerOptions());

  return duLieu(response);
}

export async function capNhat(id: string, body: Parameters<typeof capNhatLoSanPham>[1]) {
  const response = await capNhatLoSanPham(id, body, bearerOptions());

  return duLieu(response);
}

export async function guiKiemDinh(id: string) {
  const response = await guiKiemDinhLoSanPham(id, bearerOptions());

  return duLieu(response);
}

export async function thuHoi(id: string, body: Parameters<typeof thuHoiLoSanPham>[1]) {
  const response = await thuHoiLoSanPham(id, body, bearerOptions());

  return duLieu(response);
}
