'use client';

import {
  khoaKhachHangQuanTri,
  layChiTietKhachHangQuanTri,
  layDanhSachKhachHangQuanTri,
  layDonHangKhachHangQuanTri,
  layKhieuNaiKhachHangQuanTri,
  moKhoaKhachHangQuanTri,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };
function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type TrangThaiKhachHangAdmin = 'CHUA_KICH_HOAT' | 'HOAT_DONG' | 'TAM_KHOA';
export type KhachHangAdmin = {
  id: string;
  nguoiDungId: string;
  email: string;
  hoTen: string;
  soDienThoai: string | null;
  ngaySinh: string | null;
  trangThai: TrangThaiKhachHangAdmin;
  tongDonHang: number;
  tongKhieuNai: number;
  createdAt: string;
  updatedAt?: string;
};
export type DanhSachKhachHangAdmin = {
  items: KhachHangAdmin[];
  tong: number;
  trang: number;
  gioiHan: number;
};
export type DonHangKhachHangAdmin = {
  id: string;
  maDonHang: string;
  trangThai: string;
  tongTien: number;
  createdAt: string;
  updatedAt: string;
};
export type KhieuNaiKhachHangAdmin = {
  id: string;
  lyDo: string;
  moTa: string;
  maDonHang: string;
  tenSanPham: string;
  createdAt: string;
};

export async function layDanhSachKhachHangAdmin(
  params: Parameters<typeof layDanhSachKhachHangQuanTri>[0],
): Promise<DanhSachKhachHangAdmin> {
  return duLieu(
    await layDanhSachKhachHangQuanTri(params, bearerOptions()),
  ) as DanhSachKhachHangAdmin;
}
export async function layChiTietKhachHangAdmin(id: string): Promise<KhachHangAdmin> {
  return duLieu(await layChiTietKhachHangQuanTri(id, bearerOptions())) as KhachHangAdmin;
}
export async function layDonHangKhachHangAdmin(
  id: string,
): Promise<{ items: DonHangKhachHangAdmin[]; tong: number }> {
  return duLieu(await layDonHangKhachHangQuanTri(id, bearerOptions())) as {
    items: DonHangKhachHangAdmin[];
    tong: number;
  };
}
export async function layKhieuNaiKhachHangAdmin(
  id: string,
): Promise<{ items: KhieuNaiKhachHangAdmin[]; tong: number }> {
  return duLieu(await layKhieuNaiKhachHangQuanTri(id, bearerOptions())) as {
    items: KhieuNaiKhachHangAdmin[];
    tong: number;
  };
}
export async function khoaKhachHangAdmin(id: string): Promise<void> {
  await khoaKhachHangQuanTri(id, bearerOptions());
}
export async function moKhoaKhachHangAdmin(id: string): Promise<void> {
  await moKhoaKhachHangQuanTri(id, bearerOptions());
}
