import { layChiTietDonHangCuaToi, layDanhSachDonHangCuaToi } from '@agrimarket/api-client';

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

export const LUA_CHON_TRANG_THAI_DON_HANG_MOBILE = [
  { value: 'CHO_THANH_TOAN', label: 'Chờ thanh toán' },
  { value: 'DA_XAC_NHAN', label: 'Đã xác nhận' },
  { value: 'DANG_CHUAN_BI', label: 'Đang chuẩn bị' },
  { value: 'DA_DONG_GOI', label: 'Đã đóng gói' },
  { value: 'DANG_GIAO', label: 'Đang giao' },
  { value: 'DA_GIAO', label: 'Đã giao' },
  { value: 'HOAN_THANH', label: 'Hoàn thành' },
  { value: 'DA_HUY', label: 'Đã hủy' },
] as const;

export function nhanTrangThaiDonHangMobile(trangThai: string): string {
  return (
    LUA_CHON_TRANG_THAI_DON_HANG_MOBILE.find((item) => item.value === trangThai)?.label ?? trangThai
  );
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

  return duLieu(response) as DanhSachDonHangMobile;
}

export async function layChiTietDonHangMobile(id: string): Promise<ChiTietDonHangMobile> {
  const response = await layChiTietDonHangCuaToi(id, await layTuyChonBearer());

  return duLieu(response) as ChiTietDonHangMobile;
}
