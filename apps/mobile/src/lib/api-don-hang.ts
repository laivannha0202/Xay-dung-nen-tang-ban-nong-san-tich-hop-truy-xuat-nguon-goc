import {
  huyDonHangCuaToi,
  layChiTietDonHangCuaToi,
  layDanhSachDonHangCuaToi,
  nhanTrangThaiDonHangCanonical,
} from '@agrimarket/api-client';

import { duLieuApi } from './api-response';
import { layTuyChonBearer } from './phien-xac-thuc';

export const TRANG_THAI_DON_HANG_MOBILE = [
  'CHO_THANH_TOAN',
  'DA_XAC_NHAN',
  'DANG_CHUAN_BI',
  'DA_DONG_GOI',
  'DANG_GIAO',
  'DA_GIAO',
  'HOAN_THANH',
  'DA_HUY',
] as const;

export type TrangThaiDonHangMobile = (typeof TRANG_THAI_DON_HANG_MOBILE)[number];

export const LUA_CHON_TRANG_THAI_DON_HANG_MOBILE = TRANG_THAI_DON_HANG_MOBILE.map((value) => ({
  value,
  label: nhanTrangThaiDonHangCanonical(value),
}));

export function nhanTrangThaiDonHangMobile(trangThai: string): string {
  return nhanTrangThaiDonHangCanonical(trangThai);
}

export type DonHangTomTatMobile = {
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

export type DanhSachDonHangMobile = {
  duLieu: DonHangTomTatMobile[];
  tong: number;
  trang: number;
  gioiHan: number;
};

export type ChiTietDonHangMobile = {
  id: string;
  maDonHang: string;
  trangThai: string;
  tongTien: number;
  tamTinhHangHoa: number;
  phiVanChuyen: number;
  maKhuyenMai: string | null;
  giamKhuyenMai: number;
  diemDaDung: number;
  giaTriDiemDaDung: number;
  coTheHuy: boolean;
  lyDoKhongTheHuy: string | null;
  createdAt: string;
  updatedAt: string;
  diaChiGiaoHang: {
    id: string;
    tenNguoiNhan: string;
    soDienThoai: string;
    diaChi: string;
  } | null;
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

export const DON_HANG_MOBILE_LIST_QUERY_KEY = ['don-hang-mobile', 'list'] as const;

export function donHangMobileDetailQueryKey(id: string) {
  return ['don-hang-mobile', 'detail', id] as const;
}

export async function layDanhSachDonHangMobile(params: {
  trang: number;
  gioiHan: number;
  trangThai?: TrangThaiDonHangMobile;
}): Promise<DanhSachDonHangMobile> {
  const response = await layDanhSachDonHangCuaToi(params, await layTuyChonBearer());

  return duLieuApi(response) as DanhSachDonHangMobile;
}

export async function layChiTietDonHangMobile(id: string): Promise<ChiTietDonHangMobile> {
  const response = await layChiTietDonHangCuaToi(id, await layTuyChonBearer());

  return duLieuApi(response) as ChiTietDonHangMobile;
}

export async function huyDonHangMobile(id: string): Promise<ChiTietDonHangMobile> {
  const response = await huyDonHangCuaToi(id, await layTuyChonBearer());

  return duLieuApi(response) as ChiTietDonHangMobile;
}
