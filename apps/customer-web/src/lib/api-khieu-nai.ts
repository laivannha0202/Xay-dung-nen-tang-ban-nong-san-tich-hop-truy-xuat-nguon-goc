'use client';

import { layDieuKienKhieuNaiMucDonHang, taiTepTin, taoKhieuNai } from '@agrimarket/api-client';

import { bearerOptionsKhachHang } from './phien-khach-hang';

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

export type KhieuNaiKhach = {
  id: string;
  lyDo: LyDoKhieuNaiKhach;
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

export async function layDieuKienKhieuNaiKhach(
  mucDonHangId: string,
): Promise<DieuKienKhieuNaiKhach> {
  const response = await layDieuKienKhieuNaiMucDonHang(mucDonHangId, bearerOptionsKhachHang());
  return duLieu(response) as DieuKienKhieuNaiKhach;
}

export async function taiBangChungKhieuNaiKhach(file: File): Promise<TepTinBangChungKhach> {
  const response = await taiTepTin({ tep: file }, bearerOptionsKhachHang());
  return duLieu(response) as TepTinBangChungKhach;
}

export async function taoKhieuNaiKhach(input: {
  mucDonHangId: string;
  lyDo: LyDoKhieuNaiKhach;
  moTa: string;
  tepTinIds?: string[];
}): Promise<KhieuNaiKhach> {
  const response = await taoKhieuNai(input, bearerOptionsKhachHang());
  return duLieu(response) as KhieuNaiKhach;
}
