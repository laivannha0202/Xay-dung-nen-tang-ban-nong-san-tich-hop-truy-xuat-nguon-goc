'use client';

import {
  batDauDongGoi,
  hoanTatDongGoi,
  layChecklistDongGoi,
  layChiTietDonHangQuanTri,
  layDanhSachDonHangQuanTri,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export async function layDanhSachDonHangAdmin(
  params: Parameters<typeof layDanhSachDonHangQuanTri>[0],
) {
  return duLieu(await layDanhSachDonHangQuanTri(params, bearerOptions()));
}

export async function layChiTietDonHangAdmin(id: string) {
  return duLieu(await layChiTietDonHangQuanTri(id, bearerOptions()));
}

export async function layChecklistDongGoiAdmin(donNhaCungCapId: string) {
  return duLieu(await layChecklistDongGoi(donNhaCungCapId, bearerOptions()));
}

export async function batDauDongGoiAdmin(donNhaCungCapId: string) {
  return duLieu(await batDauDongGoi(donNhaCungCapId, bearerOptions()));
}

export async function hoanTatDongGoiAdmin(
  donNhaCungCapId: string,
  checklist: {
    dungSanPham: boolean;
    dungBatch: boolean;
    dungQty: boolean;
    dongGoi: boolean;
    qr: boolean;
  },
) {
  return duLieu(await hoanTatDongGoi(donNhaCungCapId, checklist, bearerOptions()));
}
