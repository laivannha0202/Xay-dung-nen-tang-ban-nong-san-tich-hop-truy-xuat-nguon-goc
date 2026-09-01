'use client';

import {
  capNhatMucGioHang,
  layGioHang,
  themMucGioHang,
  xoaMucGioHang,
} from '@agrimarket/api-client';

import { bearerOptionsKhachHang } from './phien-khach-hang';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

export type GioHangKhach = {
  id: string;
  khachHangId: string;
  muc: Array<{
    id: string;
    soLuong: number;
    bienThe: {
      id: string;
      sku: string;
      khoiLuong: number;
      donVi: string;
      giaHienTai: number;
      soLuongKhaDung: number;
      coTheDatHang: boolean;
      sanPham: {
        id: string;
        ten: string;
        trangTrai: {
          id: string;
          ten: string;
          nhaCungCap: {
            id: string;
            ten: string;
          };
        };
      };
    };
  }>;
};

export async function layGioHangKhach(): Promise<GioHangKhach> {
  const response = await layGioHang(bearerOptionsKhachHang());
  return duLieu(response) as GioHangKhach;
}

export async function themMucGioHangKhach(
  bienTheSanPhamId: string,
  soLuong: number,
): Promise<GioHangKhach> {
  const response = await themMucGioHang(
    {
      bienTheSanPhamId,
      soLuong,
    },
    bearerOptionsKhachHang(),
  );

  return duLieu(response) as GioHangKhach;
}

export async function capNhatMucGioHangKhach(id: string, soLuong: number): Promise<GioHangKhach> {
  const response = await capNhatMucGioHang(id, { soLuong }, bearerOptionsKhachHang());

  return duLieu(response) as GioHangKhach;
}

export async function xoaMucGioHangKhach(id: string): Promise<GioHangKhach> {
  const response = await xoaMucGioHang(id, bearerOptionsKhachHang());

  return duLieu(response) as GioHangKhach;
}
