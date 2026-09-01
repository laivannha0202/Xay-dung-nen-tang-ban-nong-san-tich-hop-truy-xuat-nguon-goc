'use client';

import {
  huyDonHangCuaToi,
  layChiTietDonHangCuaToi,
  layDanhSachDonHangCuaToi,
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

export const TRANG_THAI_DON_HANG_LOC = [
  'CHO_THANH_TOAN',
  'DA_XAC_NHAN',
  'DANG_CHUAN_BI',
  'DA_DONG_GOI',
  'DANG_GIAO',
  'DA_GIAO',
  'HOAN_THANH',
  'DA_HUY',
] as const;

export type TrangThaiDonHangLoc = (typeof TRANG_THAI_DON_HANG_LOC)[number];

export const LUA_CHON_TRANG_THAI_DON_HANG = [
  { value: 'CHO_THANH_TOAN', label: 'Chờ thanh toán' },
  { value: 'DA_XAC_NHAN', label: 'Đã xác nhận' },
  { value: 'DANG_CHUAN_BI', label: 'Đang chuẩn bị' },
  { value: 'DA_DONG_GOI', label: 'Đã đóng gói' },
  { value: 'DANG_GIAO', label: 'Đang giao' },
  { value: 'DA_GIAO', label: 'Đã giao' },
  { value: 'HOAN_THANH', label: 'Hoàn thành' },
  { value: 'DA_HUY', label: 'Đã hủy' },
] as const;

export function nhanTrangThaiDonHang(trangThai: string): string {
  return LUA_CHON_TRANG_THAI_DON_HANG.find((item) => item.value === trangThai)?.label ?? trangThai;
}

export type DonHangTomTatKhach = {
  id: string;
  maDonHang: string;
  trangThai: string;
  tongTien: number;
  soNhaCungCap: number;
  soMuc: number;
  coTheHuy: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DanhSachDonHangKhach = {
  duLieu: DonHangTomTatKhach[];
  tong: number;
  trang: number;
  gioiHan: number;
};

export type ChiTietDonHangKhach = {
  id: string;
  maDonHang: string;
  trangThai: string;
  tongTien: number;
  coTheHuy: boolean;
  lyDoKhongTheHuy: string | null;
  createdAt: string;
  updatedAt: string;
  donNhaCungCap: Array<{
    id: string;
    maDon: string;
    nhaCungCapId: string;
    tenNhaCungCap: string;
    trangThai: string;
    tamTinh: number;
    muc: Array<{
      id: string;
      sanPhamId: string;
      bienTheSanPhamId: string;
      tenSanPham: string;
      sku: string;
      soLuong: number;
      donGia: number;
      thanhTien: number;
      khoiLuong: number;
      donVi: string;
      maTrangTrai: string;
      tenTrangTrai: string;
    }>;
  }>;
  tienTrinh: Array<{
    trangThai: string;
    daDat: boolean;
    hienTai: boolean;
  }>;
};

export async function layDanhSachDonHangKhach(params: {
  trang: number;
  gioiHan: number;
  trangThai?: TrangThaiDonHangLoc;
}): Promise<DanhSachDonHangKhach> {
  const response = await layDanhSachDonHangCuaToi(params, bearerOptionsKhachHang());
  return duLieu(response) as DanhSachDonHangKhach;
}

export async function layChiTietDonHangKhach(id: string): Promise<ChiTietDonHangKhach> {
  const response = await layChiTietDonHangCuaToi(id, bearerOptionsKhachHang());
  return duLieu(response) as ChiTietDonHangKhach;
}

export async function huyDonHangKhach(id: string): Promise<ChiTietDonHangKhach> {
  const response = await huyDonHangCuaToi(id, bearerOptionsKhachHang());
  return duLieu(response) as ChiTietDonHangKhach;
}
