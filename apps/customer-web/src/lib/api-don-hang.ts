'use client';

import {
  huyDonHangCuaToi,
  layChiTietDonHangCuaToi,
  layDanhSachDonHangCuaToi,
  nhanTrangThaiDonHangCanonical,
  taoDonHang,
  taoThanhToan,
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

export const LUA_CHON_TRANG_THAI_DON_HANG = TRANG_THAI_DON_HANG_LOC.map((value) => ({
  value,
  label: nhanTrangThaiDonHangCanonical(value),
}));

export function nhanTrangThaiDonHang(trangThai: string): string {
  return nhanTrangThaiDonHangCanonical(trangThai);
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

export type MucDatHangKhach = {
  bienTheSanPhamId: string;
  soLuong: number;
  donGiaDuKien: number;
};

export type UuDaiDatHangKhach = {
  maKhuyenMai?: string;
  diemSuDung?: number;
};

export type DonHangTaoKhach = {
  id: string;
  maDonHang: string;
  khachHangId: string;
  trangThai: string;
  tongTien: number;
  datCho: {
    id: string;
    maThamChieu: string;
    trangThai: string;
    hetHanLuc: string;
  };
};

export type ThanhToanCodKhach = {
  id: string;
  donHangId: string;
  maDonHang: string;
  soTien: number;
  phuongThuc: string;
  trangThai: string;
  giaoDich: {
    id: string;
    maGiaoDich: string;
    soTien: number;
    phuongThuc: string;
    trangThai: string;
    thoiGian: string;
  };
};

export type KetQuaDatHangCodKhach = {
  donHang: DonHangTaoKhach;
  thanhToan: ThanhToanCodKhach;
};

export async function taoDonHangKhach(
  items: MucDatHangKhach[],
  diaChiGiaoHangId: string,
  uuDai: UuDaiDatHangKhach = {},
  maYeuCau = crypto.randomUUID(),
): Promise<DonHangTaoKhach> {
  if (items.length === 0) {
    throw new Error('Giỏ hàng không có sản phẩm để đặt.');
  }

  const body = {
    maYeuCau,
    diaChiGiaoHangId,
    maKhuyenMai: uuDai.maKhuyenMai?.trim() || undefined,
    diemSuDung:
      uuDai.diemSuDung && uuDai.diemSuDung > 0
        ? Math.trunc(uuDai.diemSuDung)
        : undefined,
    items,
  } as Parameters<typeof taoDonHang>[0] & {
    maKhuyenMai?: string;
    diemSuDung?: number;
  };

  const response = await taoDonHang(body, bearerOptionsKhachHang());
  return duLieu(response) as DonHangTaoKhach;
}

export async function taoDonHangCodKhach(
  items: MucDatHangKhach[],
  diaChiGiaoHangId: string,
  uuDai: UuDaiDatHangKhach = {},
): Promise<KetQuaDatHangCodKhach> {
  const donHang = await taoDonHangKhach(items, diaChiGiaoHangId, uuDai);

  try {
    const thanhToanResponse = await taoThanhToan(
      {
        donHangId: donHang.id,
        maYeuCau: crypto.randomUUID(),
        phuongThuc: 'COD',
      },
      bearerOptionsKhachHang(),
    );
    const thanhToan = duLieu(thanhToanResponse) as ThanhToanCodKhach;
    return { donHang, thanhToan };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không tạo được thanh toán COD.';
    throw new Error(
      `Đơn ${donHang.maDonHang} đã được tạo nhưng chưa hoàn tất bước thanh toán COD. ${message}`,
    );
  }
}

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
