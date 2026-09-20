'use client';

import { layApiBaseUrl } from '@agrimarket/api-client';
import { bearerOptions } from './phien-dang-nhap-admin';

export type LoaiPhieuKhoAdmin = 'NHAP' | 'XUAT' | 'CHUYEN' | 'DIEU_CHINH';
export type PhieuKhoTomTat = {
  id: string;
  maPhieu: string;
  loai: LoaiPhieuKhoAdmin;
  trangThai: 'DA_GHI_SO';
  donHangId: string | null;
  khoNguonId: string | null;
  khoDichId: string | null;
  maThamChieu: string | null;
  lyDo: string | null;
  ghiChu: string | null;
  nguoiLapId: string | null;
  nguoiLap: string;
  soDong: number;
  createdAt: string;
};
export type PhieuKhoChiTiet = Omit<PhieuKhoTomTat, 'soDong'> & {
  updatedAt: string;
  donHang: { id: string; maDonHang: string; trangThai: string } | null;
  dong: Array<{
    id: string;
    thuTu: number;
    tonKhoLoId: string;
    tonKhoLoDichId: string | null;
    loSanPhamId: string;
    maLo: string;
    bienTheSanPhamId: string;
    sku: string;
    tenSanPham: string;
    soLuong: number;
    donVi: string;
    khoId: string;
    maKho: string;
    khoDichId: string | null;
    maKhoDich: string | null;
    giaoDich: Array<{
      id: string;
      loai: string;
      soLuong: number;
      vaiTro: string | null;
      createdAt: string;
    }>;
  }>;
};

async function apiJson<T>(path: string): Promise<T> {
  const base = layApiBaseUrl().replace(/\/+$/, '');
  const response = await fetch(`${base}/api/v1${path}`, bearerOptions());
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as { message?: string | string[] };
      message = Array.isArray(payload.message)
        ? payload.message.join('; ')
        : (payload.message ?? message);
    } catch {}
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function layDanhSachPhieuKho(params: {
  trang?: number;
  gioiHan?: number;
  timKiem?: string;
  loai?: LoaiPhieuKhoAdmin;
  trangThai?: 'DA_GHI_SO';
  maKho?: string;
  maLo?: string;
  sku?: string;
  nguoiLap?: string;
  soLuongTu?: number;
  soLuongDen?: number;
  tuNgay?: string;
  denNgay?: string;
}) {
  const q = new URLSearchParams();
  if (params.trang) q.set('trang', String(params.trang));
  if (params.gioiHan) q.set('gioiHan', String(params.gioiHan));
  if (params.timKiem) q.set('timKiem', params.timKiem);
  if (params.loai) q.set('loai', params.loai);
  if (params.trangThai) q.set('trangThai', params.trangThai);
  if (params.maKho) q.set('maKho', params.maKho);
  if (params.maLo) q.set('maLo', params.maLo);
  if (params.sku) q.set('sku', params.sku);
  if (params.nguoiLap) q.set('nguoiLap', params.nguoiLap);
  if (params.soLuongTu !== undefined) q.set('soLuongTu', String(params.soLuongTu));
  if (params.soLuongDen !== undefined) q.set('soLuongDen', String(params.soLuongDen));
  if (params.tuNgay) q.set('tuNgay', params.tuNgay);
  if (params.denNgay) q.set('denNgay', params.denNgay);
  return apiJson<{ duLieu: PhieuKhoTomTat[]; tong: number; trang: number; gioiHan: number }>(
    `/quan-tri/phieu-kho?${q.toString()}`,
  );
}

export function layChiTietPhieuKho(id: string) {
  return apiJson<PhieuKhoChiTiet>(`/quan-tri/phieu-kho/${encodeURIComponent(id)}`);
}
