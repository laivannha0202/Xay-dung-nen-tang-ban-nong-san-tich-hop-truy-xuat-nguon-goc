import {
  capNhatMucGioHang,
  layGioHang,
  themMucGioHang,
  xoaMucGioHang,
} from '@agrimarket/api-client';

import { layTuyChonBearer } from './phien-xac-thuc';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

async function bearerMobile(): Promise<RequestInit> {
  return layTuyChonBearer();
}

export const GIO_HANG_MOBILE_QUERY_KEY = ['gio-hang-mobile'] as const;

export type GioHangMobile = {
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

export async function layGioHangMobile(): Promise<GioHangMobile> {
  const response = await layGioHang(await bearerMobile());
  return duLieu(response) as GioHangMobile;
}

export async function themMucGioHangMobile(
  bienTheSanPhamId: string,
  soLuong: number,
): Promise<GioHangMobile> {
  const response = await themMucGioHang(
    {
      bienTheSanPhamId,
      soLuong,
    },
    await bearerMobile(),
  );

  return duLieu(response) as GioHangMobile;
}

export async function capNhatMucGioHangMobile(id: string, soLuong: number): Promise<GioHangMobile> {
  const response = await capNhatMucGioHang(id, { soLuong }, await bearerMobile());

  return duLieu(response) as GioHangMobile;
}

export async function xoaMucGioHangMobile(id: string): Promise<GioHangMobile> {
  const response = await xoaMucGioHang(id, await bearerMobile());
  return duLieu(response) as GioHangMobile;
}
