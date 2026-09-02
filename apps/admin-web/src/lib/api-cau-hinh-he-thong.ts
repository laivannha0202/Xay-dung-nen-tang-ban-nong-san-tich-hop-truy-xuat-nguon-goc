'use client';

import { capNhatCauHinhHeThong, layCauHinhHeThong } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type CauHinhHeThongAdmin = {
  reservationTtlPhut: number;
  thoiHanKhieuNaiNgay: number;
  nguongSapHetHanNgay: number;
};

export async function apiLayCauHinhHeThong(): Promise<CauHinhHeThongAdmin> {
  const response = duLieu(await layCauHinhHeThong(bearerOptions()));
  return {
    reservationTtlPhut: response.reservationTtlPhut,
    thoiHanKhieuNaiNgay: response.thoiHanKhieuNaiNgay,
    nguongSapHetHanNgay: response.nguongSapHetHanNgay,
  };
}

export async function apiCapNhatCauHinhHeThong(
  input: CauHinhHeThongAdmin,
): Promise<CauHinhHeThongAdmin> {
  const response = duLieu(await capNhatCauHinhHeThong(input, bearerOptions()));
  return {
    reservationTtlPhut: response.reservationTtlPhut,
    thoiHanKhieuNaiNgay: response.thoiHanKhieuNaiNgay,
    nguongSapHetHanNgay: response.nguongSapHetHanNgay,
  };
}
