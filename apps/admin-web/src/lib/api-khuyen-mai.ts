'use client';

import { layApiBaseUrl } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

export type PhamViKhuyenMaiAdmin = 'PLATFORM' | 'DANH_MUC' | 'SAN_PHAM';
export type TrangThaiKhuyenMaiAdmin = 'HOAT_DONG' | 'NGUNG_HOAT_DONG';

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

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = bearerOptions();
  const headers = new Headers(auth.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${layApiBaseUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    let thongBao = `Yêu cầu khuyến mãi thất bại (HTTP ${response.status}).`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) thongBao = body.message.join(', ');
      else if (body.message) thongBao = body.message;
    } catch {
      // Giữ thông báo mặc định.
    }
    throw new Error(thongBao);
  }

  return response.json() as Promise<T>;
}

export async function layDanhSachKhuyenMaiAdmin(
  params: LocKhuyenMaiAdmin = {},
): Promise<DanhSachKhuyenMaiAdmin> {
  const query = new URLSearchParams();
  if (params.trang) query.set('trang', String(params.trang));
  if (params.gioiHan) query.set('gioiHan', String(params.gioiHan));
  if (params.timKiem?.trim()) query.set('timKiem', params.timKiem.trim());
  if (params.phamVi) query.set('phamVi', params.phamVi);
  if (params.trangThai) query.set('trangThai', params.trangThai);
  const suffix = query.size ? `?${query.toString()}` : '';
  return requestJson(`/api/v1/quan-tri/khuyen-mai${suffix}`);
}

export async function layChiTietKhuyenMaiAdmin(id: string): Promise<KhuyenMaiAdmin> {
  return requestJson(`/api/v1/quan-tri/khuyen-mai/${encodeURIComponent(id)}`);
}

export async function taoKhuyenMaiAdmin(body: LuuKhuyenMaiAdmin): Promise<KhuyenMaiAdmin> {
  return requestJson('/api/v1/quan-tri/khuyen-mai', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function capNhatKhuyenMaiAdmin(
  id: string,
  body: LuuKhuyenMaiAdmin,
): Promise<KhuyenMaiAdmin> {
  return requestJson(`/api/v1/quan-tri/khuyen-mai/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function doiTrangThaiKhuyenMaiAdmin(
  id: string,
  trangThai: TrangThaiKhuyenMaiAdmin,
): Promise<KhuyenMaiAdmin> {
  return requestJson(`/api/v1/quan-tri/khuyen-mai/${encodeURIComponent(id)}/trang-thai`, {
    method: 'PATCH',
    body: JSON.stringify({ trangThai }),
  });
}
