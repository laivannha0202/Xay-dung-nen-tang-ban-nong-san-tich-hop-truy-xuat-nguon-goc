'use client';

import {
  layChiTietKhieuNaiCuaToi,
  layDanhSachKhieuNaiCuaToi,
  layThongKeKhieuNaiCuaToi,
  layDieuKienKhieuNaiMucDonHang,
  taiTepTin,
  taoKhieuNai,
} from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

type HttpResponse<T> = { data: T };

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export const LY_DO_KHIEU_NAI = [
  { value: 'HONG', label: 'Hỏng' },
  { value: 'DAP', label: 'Dập' },
  { value: 'SAI', label: 'Sai sản phẩm' },
  { value: 'THIEU', label: 'Thiếu' },
  { value: 'HET_HAN', label: 'Hết hạn' },
  { value: 'CHAT_LUONG', label: 'Chất lượng' },
  { value: 'CHUNG_NHAN', label: 'Chứng nhận' },
] as const;

export type LyDoKhieuNaiKhach = (typeof LY_DO_KHIEU_NAI)[number]['value'];

export const TRANG_THAI_KHIEU_NAI = [
  { value: 'MOI', label: 'Mới tiếp nhận', color: 'orange' },
  { value: 'DANG_XU_LY', label: 'Đang xử lý', color: 'blue' },
  { value: 'CHAP_NHAN', label: 'Đã chấp nhận', color: 'teal' },
  { value: 'TU_CHOI', label: 'Từ chối', color: 'red' },
  { value: 'DA_HOAN_TIEN', label: 'Đã hoàn tiền', color: 'green' },
  { value: 'DONG', label: 'Đã đóng', color: 'gray' },
] as const;

export type TrangThaiKhieuNaiKhach = (typeof TRANG_THAI_KHIEU_NAI)[number]['value'];

export function metaTrangThaiKhieuNai(value: string) {
  return TRANG_THAI_KHIEU_NAI.find((item) => item.value === value) ?? {
    value,
    label: value,
    color: 'gray',
  };
}

export function nhanLyDoKhieuNaiKhach(value: string): string {
  return LY_DO_KHIEU_NAI.find((item) => item.value === value)?.label ?? value;
}

export type DieuKienKhieuNaiKhach = {
  mucDonHangId: string;
  sanPhamId: string;
  tenSanPham: string;
  sku: string;
  daGiao: boolean;
  coTheKhieuNai: boolean;
  lyDo: string | null;
};

export type TepTinBangChungKhach = {
  id: string;
  tenGoc: string;
  mimeType: string;
  kichThuoc: number;
  sha256: string;
  createdAt: string;
};

export type TomTatKhieuNaiKhach = {
  id: string;
  maKhieuNai: string;
  lyDo: string;
  trangThai: string;
  maDonHang: string;
  tenSanPham: string;
  soBangChung: number;
  createdAt: string;
};

export type DanhSachKhieuNaiKhach = {
  items: TomTatKhieuNaiKhach[];
  tong: number;
  trang: number;
  gioiHan: number;
};

export type ThongKeKhieuNaiKhach = {
  tong: number;
  coBangChung: number;
  chuaCoBangChung: number;
  chatLuongHoacHetHan: number;
  theoLyDo: Array<{ lyDo: LyDoKhieuNaiKhach; tong: number }>;
  theoTrangThai: Array<{ trangThai: TrangThaiKhieuNaiKhach; tong: number }>;
};

export type KhieuNaiKhach = {
  id: string;
  maKhieuNai: string;
  lyDo: string;
  moTa: string;
  trangThai: string;
  phanHoiKhachHang: string | null;
  xuLyLuc: string | null;
  donHang: { id: string; maDonHang: string };
  donNhaCungCap: { id: string; maDon: string; tenNhaCungCap: string };
  mucDonHang: {
    id: string;
    sanPhamId: string;
    bienTheSanPhamId: string;
    tenSanPham: string;
    sku: string;
    soLuong: number;
    donGia: number;
    thanhTien: number;
    maTrangTrai: string;
    tenTrangTrai: string;
  };
  phanBo: Array<{
    tonKhoLoId: string;
    maKho: string;
    maLo: string;
    maTruyXuat: string | null;
    soLuong: number;
  }>;
  vanChuyen: Array<{
    id: string;
    maVanDon: string;
    trangThai: string;
    createdAt: string;
    updatedAt: string;
  }>;
  bangChung: Array<{
    id: string;
    tepTinId: string;
    tenGoc: string;
    mimeType: string;
    urlXem: string | null;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export async function layDieuKienKhieuNaiKhach(
  mucDonHangId: string,
): Promise<DieuKienKhieuNaiKhach> {
  const response = await thucThiApiKhachHang((tuyChon) =>
    layDieuKienKhieuNaiMucDonHang(mucDonHangId, tuyChon),
  );
  return duLieu(response) as DieuKienKhieuNaiKhach;
}

export async function taiBangChungKhieuNaiKhach(file: File): Promise<TepTinBangChungKhach> {
  const response = await thucThiApiKhachHang((tuyChon) => taiTepTin({ tep: file }, tuyChon));
  return duLieu(response) as TepTinBangChungKhach;
}

export async function taoKhieuNaiKhach(input: {
  mucDonHangId: string;
  lyDo: LyDoKhieuNaiKhach;
  moTa: string;
  tepTinIds?: string[];
}): Promise<KhieuNaiKhach> {
  const response = await thucThiApiKhachHang((tuyChon) => taoKhieuNai(input, tuyChon));
  return duLieu(response) as KhieuNaiKhach;
}

export async function layDanhSachKhieuNaiKhach(params: {
  trang: number;
  gioiHan: number;
  lyDo?: LyDoKhieuNaiKhach;
  trangThai?: TrangThaiKhieuNaiKhach;
  tuKhoa?: string;
  sapXep?: 'MOI_NHAT' | 'CU_NHAT';
}): Promise<DanhSachKhieuNaiKhach> {
  const response = await thucThiApiKhachHang((tuyChon) =>
    layDanhSachKhieuNaiCuaToi(params, tuyChon),
  );
  return duLieu(response) as DanhSachKhieuNaiKhach;
}

export async function layThongKeKhieuNaiKhach(): Promise<ThongKeKhieuNaiKhach> {
  const response = await thucThiApiKhachHang((tuyChon) =>
    layThongKeKhieuNaiCuaToi(tuyChon),
  );
  return duLieu(response) as ThongKeKhieuNaiKhach;
}

export async function layChiTietKhieuNaiKhach(id: string): Promise<KhieuNaiKhach> {
  const response = await thucThiApiKhachHang((tuyChon) => layChiTietKhieuNaiCuaToi(id, tuyChon));
  return duLieu(response) as KhieuNaiKhach;
}
