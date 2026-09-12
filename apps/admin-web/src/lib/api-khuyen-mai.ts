'use client';

import {
  capNhatKhuyenMaiQuanTri,
  doiTrangThaiKhuyenMaiQuanTri,
  layChiTietKhuyenMaiQuanTri,
  layDanhSachKhuyenMaiQuanTri,
  taoKhuyenMaiQuanTri,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

export type PhamViKhuyenMaiAdmin =
  | 'PLATFORM'
  | 'DANH_MUC'
  | 'SAN_PHAM';

export type TrangThaiKhuyenMaiAdmin =
  | 'HOAT_DONG'
  | 'NGUNG_HOAT_DONG';

export type KhuyenMaiAdmin = {
  id: string;
  ma: string;
  ten: string;
  phamVi: PhamViKhuyenMaiAdmin;
  danhMucSanPhamId: string | null;
  sanPhamId: string | null;
  donHangToiThieu: number;
  giaTriGiam: number;
  batDauLuc: string;
  ketThucLuc: string;
  gioiHanSuDung: number | null;
  soLanDaSuDung: number;
  trangThai: TrangThaiKhuyenMaiAdmin;
  createdAt: string;
  updatedAt: string;
};

export type DanhSachKhuyenMaiAdmin = {
  duLieu: KhuyenMaiAdmin[];
  tong: number;
  trang: number;
  gioiHan: number;
};

export type LocKhuyenMaiAdmin = {
  trang?: number;
  gioiHan?: number;
  timKiem?: string;
  phamVi?: PhamViKhuyenMaiAdmin;
  trangThai?: TrangThaiKhuyenMaiAdmin;
};

export type LuuKhuyenMaiAdmin = {
  ma: string;
  ten: string;
  phamVi: PhamViKhuyenMaiAdmin;
  danhMucSanPhamId?: string | null;
  sanPhamId?: string | null;
  donHangToiThieu?: number;
  giaTriGiam: number;
  batDauLuc: string;
  ketThucLuc: string;
  gioiHanSuDung?: number | null;
};

function tuyChonAdmin(): RequestInit {
  return {
    ...bearerOptions(),
    credentials: 'include',
    cache: 'no-store',
  };
}

export async function layDanhSachKhuyenMaiAdmin(
  params: LocKhuyenMaiAdmin = {},
): Promise<DanhSachKhuyenMaiAdmin> {
  const response = await layDanhSachKhuyenMaiQuanTri(
    params as Parameters<typeof layDanhSachKhuyenMaiQuanTri>[0],
    tuyChonAdmin(),
  );

  return response.data as unknown as DanhSachKhuyenMaiAdmin;
}

export async function layChiTietKhuyenMaiAdmin(
  id: string,
): Promise<KhuyenMaiAdmin> {
  const response = await layChiTietKhuyenMaiQuanTri(
    id,
    tuyChonAdmin(),
  );

  return response.data as unknown as KhuyenMaiAdmin;
}

export async function taoKhuyenMaiAdmin(
  body: LuuKhuyenMaiAdmin,
): Promise<KhuyenMaiAdmin> {
  const response = await taoKhuyenMaiQuanTri(
    body as unknown as Parameters<typeof taoKhuyenMaiQuanTri>[0],
    tuyChonAdmin(),
  );

  return response.data as unknown as KhuyenMaiAdmin;
}

export async function capNhatKhuyenMaiAdmin(
  id: string,
  body: LuuKhuyenMaiAdmin,
): Promise<KhuyenMaiAdmin> {
  const response = await capNhatKhuyenMaiQuanTri(
    id,
    body as unknown as Parameters<typeof capNhatKhuyenMaiQuanTri>[1],
    tuyChonAdmin(),
  );

  return response.data as unknown as KhuyenMaiAdmin;
}

export async function doiTrangThaiKhuyenMaiAdmin(
  id: string,
  trangThai: TrangThaiKhuyenMaiAdmin,
): Promise<KhuyenMaiAdmin> {
  const response = await doiTrangThaiKhuyenMaiQuanTri(
    id,
    { trangThai } as Parameters<typeof doiTrangThaiKhuyenMaiQuanTri>[1],
    tuyChonAdmin(),
  );

  return response.data as unknown as KhuyenMaiAdmin;
}
