'use client';

import {
  capNhatBienTheSanPham,
  capNhatSanPham,
  doiTrangThaiSanPham,
  layChiTietSanPham,
  layDanhSachBienTheSanPham,
  layDanhSachDanhMucSanPham,
  layDanhSachSanPham,
  layDanhSachTrangTrai,
  taoBienTheSanPham,
  taoSanPham,
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

export async function layDanhSach(params: Parameters<typeof layDanhSachSanPham>[0]) {
  const response = await layDanhSachSanPham(params, bearerOptions());

  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietSanPham(id, bearerOptions());

  return duLieu(response);
}

export async function taoMoi(body: Parameters<typeof taoSanPham>[0]) {
  const response = await taoSanPham(body, bearerOptions());

  return duLieu(response);
}

export async function capNhat(id: string, body: Parameters<typeof capNhatSanPham>[1]) {
  const response = await capNhatSanPham(id, body, bearerOptions());

  return duLieu(response);
}

export async function doiTrangThai(id: string, trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG') {
  const response = await doiTrangThaiSanPham(
    id,
    {
      trangThai,
    },
    bearerOptions(),
  );

  return duLieu(response);
}

export async function layTrangTraiHoatDong() {
  const response = await layDanhSachTrangTrai(
    {
      trang: 1,
      gioiHan: 100,
      trangThai: 'HOAT_DONG',
    },
    bearerOptions(),
  );

  return duLieu(response);
}

export async function layDanhMucHoatDong() {
  const response = await layDanhSachDanhMucSanPham(
    {
      trang: 1,
      gioiHan: 100,
      trangThai: 'HOAT_DONG',
    },
    bearerOptions(),
  );

  return duLieu(response);
}

export async function layBienThe(sanPhamId: string) {
  const response = await layDanhSachBienTheSanPham(sanPhamId, bearerOptions());

  return duLieu(response);
}

export async function taoBienThe(sanPhamId: string, body: Parameters<typeof taoBienTheSanPham>[1]) {
  const response = await taoBienTheSanPham(sanPhamId, body, bearerOptions());

  return duLieu(response);
}

export async function capNhatBienThe(
  sanPhamId: string,
  id: string,
  body: Parameters<typeof capNhatBienTheSanPham>[2],
) {
  const response = await capNhatBienTheSanPham(sanPhamId, id, body, bearerOptions());

  return duLieu(response);
}
