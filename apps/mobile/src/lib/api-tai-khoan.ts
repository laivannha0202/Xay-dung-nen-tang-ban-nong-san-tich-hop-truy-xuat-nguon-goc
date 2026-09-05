import {
  boTheoDoiTrangTrai,
  capNhatDiaChiKhachHang,
  capNhatHoSoKhachHang,
  datDiaChiMacDinhKhachHang,
  layChiTietKhieuNaiCuaToi,
  layDanhSachDiaChiKhachHang,
  layDanhSachKhieuNaiCuaToi,
  layDanhSachSanPhamYeuThich,
  layDanhSachTrangTraiTheoDoi,
  layHoSoKhachHang,
  taoDiaChiKhachHang,
  xoaDiaChiKhachHang,
  xoaSanPhamYeuThich,
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

export const HO_SO_TAI_KHOAN_QUERY_KEY = ['tai-khoan-mobile', 'ho-so'] as const;

export const DIA_CHI_TAI_KHOAN_QUERY_KEY = ['tai-khoan-mobile', 'dia-chi'] as const;

export const WISHLIST_TAI_KHOAN_QUERY_KEY = ['tai-khoan-mobile', 'wishlist'] as const;

export const TRANG_TRAI_THEO_DOI_TAI_KHOAN_QUERY_KEY = [
  'tai-khoan-mobile',
  'trang-trai-theo-doi',
] as const;

export const KHIEU_NAI_TAI_KHOAN_LIST_QUERY_KEY = [
  'tai-khoan-mobile',
  'khieu-nai',
  'list',
] as const;

export function khieuNaiTaiKhoanDetailQueryKey(id: string) {
  return ['tai-khoan-mobile', 'khieu-nai', 'detail', id] as const;
}

export type HoSoTaiKhoanMobile = {
  khachHangId: string;
  nguoiDungId: string;
  email: string;
  soDienThoai: string | null;
  hoTen: string;
  ngaySinh: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CapNhatHoSoTaiKhoanInput = {
  hoTen?: string;
  soDienThoai?: string | null;
  ngaySinh?: string | null;
};

export type DiaChiTaiKhoanMobile = {
  id: string;
  tenNguoiNhan: string;
  soDienThoai: string;
  dongDiaChi: string;
  phuongXa: string | null;
  quanHuyen: string | null;
  tinhThanh: string;
  maBuuChinh: string | null;
  macDinh: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DuLieuDiaChiTaiKhoan = {
  tenNguoiNhan: string;
  soDienThoai: string;
  dongDiaChi: string;
  phuongXa?: string | null;
  quanHuyen?: string | null;
  tinhThanh: string;
  maBuuChinh?: string | null;
};

export type SanPhamYeuThichTaiKhoan = {
  sanPhamId: string;
  ten: string;
  moTa: string | null;
  trangTraiId: string;
  tenTrangTrai: string;
  createdAt: string;
};

export type DanhSachWishlistTaiKhoan = {
  duLieu: SanPhamYeuThichTaiKhoan[];
  tong: number;
};

export type TrangTraiTheoDoiTaiKhoan = {
  trangTraiId: string;
  ma: string;
  ten: string;
  diaChi: string;
  createdAt: string;
};

export type DanhSachTrangTraiTheoDoiTaiKhoan = {
  duLieu: TrangTraiTheoDoiTaiKhoan[];
  tong: number;
};

export type TomTatKhieuNaiTaiKhoan = {
  id: string;
  lyDo: string;
  maDonHang: string;
  tenSanPham: string;
  soBangChung: number;
  createdAt: string;
};

export type DanhSachKhieuNaiTaiKhoan = {
  items: TomTatKhieuNaiTaiKhoan[];
  tong: number;
  trang: number;
  gioiHan: number;
};

export type ChiTietKhieuNaiTaiKhoanMobile = {
  id: string;
  lyDo: string;
  moTa: string;
  donHang: {
    id: string;
    maDonHang: string;
  };
  donNhaCungCap: {
    id: string;
    maDon: string;
    tenNhaCungCap: string;
  };
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

const NHAN_LY_DO_KHIEU_NAI: Record<string, string> = {
  HONG: 'Hỏng',
  DAP: 'Dập',
  SAI: 'Sai sản phẩm',
  THIEU: 'Thiếu',
  HET_HAN: 'Hết hạn',
  CHAT_LUONG: 'Chất lượng',
  CHUNG_NHAN: 'Chứng nhận',
};

export function nhanLyDoKhieuNaiTaiKhoan(value: string): string {
  return NHAN_LY_DO_KHIEU_NAI[value] ?? value;
}

export async function layHoSoTaiKhoanMobile(): Promise<HoSoTaiKhoanMobile> {
  const response = await layHoSoKhachHang(await layTuyChonBearer());

  return duLieu(response) as HoSoTaiKhoanMobile;
}

export async function capNhatHoSoTaiKhoanMobile(
  input: CapNhatHoSoTaiKhoanInput,
): Promise<HoSoTaiKhoanMobile> {
  const response = await capNhatHoSoKhachHang(input, await layTuyChonBearer());

  return duLieu(response) as HoSoTaiKhoanMobile;
}

export async function layDiaChiTaiKhoanMobile(): Promise<DiaChiTaiKhoanMobile[]> {
  const response = await layDanhSachDiaChiKhachHang(await layTuyChonBearer());

  return duLieu(response) as DiaChiTaiKhoanMobile[];
}

export async function taoDiaChiTaiKhoanMobile(
  input: DuLieuDiaChiTaiKhoan & { macDinh?: boolean },
): Promise<DiaChiTaiKhoanMobile> {
  const response = await taoDiaChiKhachHang(input, await layTuyChonBearer());

  return duLieu(response) as DiaChiTaiKhoanMobile;
}

export async function capNhatDiaChiTaiKhoanMobile(
  id: string,
  input: Partial<DuLieuDiaChiTaiKhoan>,
): Promise<DiaChiTaiKhoanMobile> {
  const response = await capNhatDiaChiKhachHang(id, input, await layTuyChonBearer());

  return duLieu(response) as DiaChiTaiKhoanMobile;
}

export async function datDiaChiMacDinhTaiKhoanMobile(id: string): Promise<DiaChiTaiKhoanMobile> {
  const response = await datDiaChiMacDinhKhachHang(id, await layTuyChonBearer());

  return duLieu(response) as DiaChiTaiKhoanMobile;
}

export async function xoaDiaChiTaiKhoanMobile(id: string): Promise<void> {
  await xoaDiaChiKhachHang(id, await layTuyChonBearer());
}

export async function layWishlistTaiKhoanMobile(): Promise<DanhSachWishlistTaiKhoan> {
  const response = await layDanhSachSanPhamYeuThich(await layTuyChonBearer());

  return duLieu(response) as DanhSachWishlistTaiKhoan;
}

export async function xoaWishlistTaiKhoanMobile(sanPhamId: string): Promise<void> {
  await xoaSanPhamYeuThich(sanPhamId, await layTuyChonBearer());
}

export async function layTrangTraiTheoDoiTaiKhoanMobile(): Promise<DanhSachTrangTraiTheoDoiTaiKhoan> {
  const response = await layDanhSachTrangTraiTheoDoi(await layTuyChonBearer());

  return duLieu(response) as DanhSachTrangTraiTheoDoiTaiKhoan;
}

export async function boTheoDoiTrangTraiTaiKhoanMobile(trangTraiId: string): Promise<void> {
  await boTheoDoiTrangTrai(trangTraiId, await layTuyChonBearer());
}

export async function layKhieuNaiTaiKhoanMobile(params: {
  trang: number;
  gioiHan: number;
}): Promise<DanhSachKhieuNaiTaiKhoan> {
  const response = await layDanhSachKhieuNaiCuaToi(params, await layTuyChonBearer());

  return duLieu(response) as DanhSachKhieuNaiTaiKhoan;
}

export async function layChiTietKhieuNaiTaiKhoanMobile(
  id: string,
): Promise<ChiTietKhieuNaiTaiKhoanMobile> {
  const response = await layChiTietKhieuNaiCuaToi(id, await layTuyChonBearer());

  return duLieu(response) as ChiTietKhieuNaiTaiKhoanMobile;
}
