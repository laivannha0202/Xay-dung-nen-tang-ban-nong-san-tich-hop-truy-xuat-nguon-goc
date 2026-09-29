"use client";

import {
  capNhatXuLyKhieuNaiQuanTri,
  hoanTienTheoKhieuNaiQuanTri,
  layChiTietKhieuNaiQuanTri,
  layDanhSachKhieuNaiQuanTri,
  layThongKeKhieuNaiQuanTri,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };
function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export const LY_DO_KHIEU_NAI_ADMIN = [
  { value: 'HONG', label: 'Hỏng' },
  { value: 'DAP', label: 'Dập' },
  { value: 'SAI', label: 'Sai sản phẩm' },
  { value: 'THIEU', label: 'Thiếu' },
  { value: 'HET_HAN', label: 'Hết hạn' },
  { value: 'CHAT_LUONG', label: 'Chất lượng' },
  { value: 'CHUNG_NHAN', label: 'Chứng nhận' },
] as const;
export type LyDoKhieuNaiAdmin = (typeof LY_DO_KHIEU_NAI_ADMIN)[number]['value'];

export const TRANG_THAI_KHIEU_NAI_ADMIN = [
  { value: 'MOI', label: 'Mới tiếp nhận', color: 'orange' },
  { value: 'DANG_XU_LY', label: 'Đang xử lý', color: 'blue' },
  { value: 'CHAP_NHAN', label: 'Đã chấp nhận', color: 'green' },
  { value: 'TU_CHOI', label: 'Từ chối', color: 'red' },
  { value: 'DA_HOAN_TIEN', label: 'Đã hoàn tiền', color: 'cyan' },
  { value: 'DONG', label: 'Đã đóng', color: 'default' },
] as const;
export type TrangThaiKhieuNaiAdmin = (typeof TRANG_THAI_KHIEU_NAI_ADMIN)[number]['value'];

export function metaTrangThaiKhieuNaiAdmin(value: string) {
  return TRANG_THAI_KHIEU_NAI_ADMIN.find((item) => item.value === value) ?? {
    value,
    label: value,
    color: 'default',
  };
}
export function nhanLyDoKhieuNaiAdmin(value: string): string {
  return LY_DO_KHIEU_NAI_ADMIN.find((item) => item.value === value)?.label ?? value;
}

export type TomTatKhieuNaiAdmin = {
  id: string;
  maKhieuNai: string;
  lyDo: LyDoKhieuNaiAdmin;
  trangThai: TrangThaiKhieuNaiAdmin;
  maDonHang: string;
  tenSanPham: string;
  soBangChung: number;
  createdAt: string;
};
export type DanhSachKhieuNaiAdmin = {
  items: TomTatKhieuNaiAdmin[];
  tong: number;
  trang: number;
  gioiHan: number;
};
export type ThongKeKhieuNaiAdmin = {
  tong: number;
  coBangChung: number;
  chuaCoBangChung: number;
  chatLuongHoacHetHan: number;
  theoLyDo: Array<{ lyDo: LyDoKhieuNaiAdmin; tong: number }>;
  theoTrangThai: Array<{ trangThai: TrangThaiKhieuNaiAdmin; tong: number }>;
};
export type KhieuNaiChiTietAdmin = {
  id: string;
  maKhieuNai: string;
  lyDo: LyDoKhieuNaiAdmin;
  moTa: string;
  trangThai: TrangThaiKhieuNaiAdmin;
  phanHoiKhachHang: string | null;
  xuLyLuc: string | null;
  donHang: { id: string; maDonHang: string };
  donNhaCungCap: { id: string; maDon: string; tenNhaCungCap: string };
  mucDonHang: {
    id: string; sanPhamId: string; bienTheSanPhamId: string; tenSanPham: string;
    sku: string; soLuong: number; donGia: number; thanhTien: number;
    maTrangTrai: string; tenTrangTrai: string;
  };
  phanBo: Array<{ tonKhoLoId: string; maKho: string; maLo: string; maTruyXuat: string | null; soLuong: number }>;
  vanChuyen: Array<{ id: string; maVanDon: string; trangThai: string; createdAt: string; updatedAt: string }>;
  bangChung: Array<{ id: string; tepTinId: string; tenGoc: string; mimeType: string; urlXem: string | null; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
};

export async function layDanhSachKhieuNaiAdmin(params: {
  trang: number;
  gioiHan: number;
  lyDo?: LyDoKhieuNaiAdmin;
  trangThai?: TrangThaiKhieuNaiAdmin;
  tuKhoa?: string;
  sapXep?: 'MOI_NHAT' | 'CU_NHAT';
}): Promise<DanhSachKhieuNaiAdmin> {
  return duLieu(await layDanhSachKhieuNaiQuanTri(params, bearerOptions())) as DanhSachKhieuNaiAdmin;
}
export async function layThongKeKhieuNaiAdmin(): Promise<ThongKeKhieuNaiAdmin> {
  return duLieu(await layThongKeKhieuNaiQuanTri(bearerOptions())) as ThongKeKhieuNaiAdmin;
}
export async function layChiTietKhieuNaiAdmin(id: string): Promise<KhieuNaiChiTietAdmin> {
  return duLieu(await layChiTietKhieuNaiQuanTri(id, bearerOptions())) as KhieuNaiChiTietAdmin;
}
export async function capNhatXuLyKhieuNaiAdmin(
  id: string,
  body: { trangThai: TrangThaiKhieuNaiAdmin; phanHoiKhachHang?: string | null },
): Promise<KhieuNaiChiTietAdmin> {
  return duLieu(await capNhatXuLyKhieuNaiQuanTri(id, body, bearerOptions())) as KhieuNaiChiTietAdmin;
}
export async function hoanTienTheoKhieuNaiAdmin(
  id: string,
  body: { maYeuCau: string; soTien: number; lyDo: string; phanHoiKhachHang?: string | null },
): Promise<KhieuNaiChiTietAdmin> {
  return duLieu(await hoanTienTheoKhieuNaiQuanTri(id, body, bearerOptions())) as KhieuNaiChiTietAdmin;
}
