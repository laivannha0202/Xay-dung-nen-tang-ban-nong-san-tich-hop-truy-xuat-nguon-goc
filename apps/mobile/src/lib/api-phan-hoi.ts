import {
  layDieuKienKhieuNaiMucDonHang,
  layTrangThaiDanhGiaMucDonHang,
  taiTepTin,
  taoDanhGia,
  taoKhieuNai,
} from '@agrimarket/api-client';

import type { ChiTietKhieuNaiTaiKhoanMobile } from './api-tai-khoan';
import { duLieuApi } from './api-response';
import { layTuyChonBearer } from './phien-xac-thuc';

export type DanhGiaMobile = {
  id: string;
  mucDonHangId: string;
  sanPhamId: string;
  diem: number;
  binhLuan: string | null;
  nguoiDanhGia: string;
  createdAt: string;
  updatedAt: string;
};

export type TrangThaiDanhGiaMucDonHangMobile = {
  mucDonHangId: string;
  sanPhamId: string;
  tenSanPham: string;
  sku: string;
  daGiao: boolean;
  coTheDanhGia: boolean;
  lyDo: string | null;
  danhGia: DanhGiaMobile | null;
};

export const LY_DO_KHIEU_NAI_MOBILE = [
  { value: 'HONG', label: 'Hỏng' },
  { value: 'DAP', label: 'Dập' },
  { value: 'SAI', label: 'Sai sản phẩm' },
  { value: 'THIEU', label: 'Thiếu' },
  { value: 'HET_HAN', label: 'Hết hạn' },
  { value: 'CHAT_LUONG', label: 'Chất lượng' },
  { value: 'CHUNG_NHAN', label: 'Chứng nhận' },
] as const;

export type LyDoKhieuNaiMobile = (typeof LY_DO_KHIEU_NAI_MOBILE)[number]['value'];

export type DieuKienKhieuNaiMobile = {
  mucDonHangId: string;
  sanPhamId: string;
  tenSanPham: string;
  sku: string;
  daGiao: boolean;
  coTheKhieuNai: boolean;
  lyDo: string | null;
};

export type TepTinBangChungMobile = {
  id: string;
  tenGoc: string;
  mimeType: string;
  kichThuoc: number;
  sha256: string;
  createdAt: string;
};

export type KhieuNaiMobile = Omit<ChiTietKhieuNaiTaiKhoanMobile, 'lyDo'> & {
  lyDo: LyDoKhieuNaiMobile;
};

export function danhGiaMucDonHangMobileQueryKey(mucDonHangId: string) {
  return ['danh-gia-mobile', 'muc-don-hang', mucDonHangId] as const;
}

export function dieuKienKhieuNaiMobileQueryKey(mucDonHangId: string) {
  return ['khieu-nai-mobile', 'dieu-kien', mucDonHangId] as const;
}

export async function layTrangThaiDanhGiaMucDonHangMobile(
  mucDonHangId: string,
): Promise<TrangThaiDanhGiaMucDonHangMobile> {
  const response = await layTrangThaiDanhGiaMucDonHang(mucDonHangId, await layTuyChonBearer());

  return duLieuApi(response) as TrangThaiDanhGiaMucDonHangMobile;
}

export async function taoDanhGiaMobile(input: {
  mucDonHangId: string;
  diem: number;
  binhLuan?: string;
}): Promise<DanhGiaMobile> {
  const response = await taoDanhGia(input, await layTuyChonBearer());

  return duLieuApi(response) as DanhGiaMobile;
}

export async function layDieuKienKhieuNaiMobile(
  mucDonHangId: string,
): Promise<DieuKienKhieuNaiMobile> {
  const response = await layDieuKienKhieuNaiMucDonHang(mucDonHangId, await layTuyChonBearer());

  return duLieuApi(response) as DieuKienKhieuNaiMobile;
}

export async function taiBangChungKhieuNaiMobile(file: File): Promise<TepTinBangChungMobile> {
  const response = await taiTepTin({ tep: file }, await layTuyChonBearer());

  return duLieuApi(response) as TepTinBangChungMobile;
}

export async function taoKhieuNaiMobile(input: {
  mucDonHangId: string;
  lyDo: LyDoKhieuNaiMobile;
  moTa: string;
  tepTinIds?: string[];
}): Promise<KhieuNaiMobile> {
  const response = await taoKhieuNai(input, await layTuyChonBearer());

  return duLieuApi(response) as KhieuNaiMobile;
}
