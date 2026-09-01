'use client';

import { layChiTietKhieuNaiQuanTri, layDanhSachKhieuNaiQuanTri } from '@agrimarket/api-client';

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

export type TomTatKhieuNaiAdmin = {
  id: string;
  lyDo: LyDoKhieuNaiAdmin;
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

export type KhieuNaiChiTietAdmin = {
  id: string;
  lyDo: LyDoKhieuNaiAdmin;
  moTa: string;
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
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export async function layDanhSachKhieuNaiAdmin(
  params: Parameters<typeof layDanhSachKhieuNaiQuanTri>[0],
): Promise<DanhSachKhieuNaiAdmin> {
  return duLieu(await layDanhSachKhieuNaiQuanTri(params, bearerOptions())) as DanhSachKhieuNaiAdmin;
}

export async function layChiTietKhieuNaiAdmin(id: string): Promise<KhieuNaiChiTietAdmin> {
  return duLieu(await layChiTietKhieuNaiQuanTri(id, bearerOptions())) as KhieuNaiChiTietAdmin;
}
