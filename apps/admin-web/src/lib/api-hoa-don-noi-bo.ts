'use client';

import { layApiBaseUrl } from '@agrimarket/api-client';
import { bearerOptions } from './phien-dang-nhap-admin';

export type HoaDonTomTat = {
  id: string;
  maHoaDon: string;
  donHangId: string;
  maDonHang: string;
  trangThai: 'DA_PHAT_HANH';
  tenNguoiMua: string;
  tongThanhToan: number;
  phuongThucThanhToan: string | null;
  trangThaiThanhToan: string | null;
  nguoiLap: string;
  phatHanhLuc: string;
  soDong: number;
};
export type HoaDonChiTiet = Omit<HoaDonTomTat, 'soDong'> & {
  donHang: { id: string; maDonHang: string; trangThai: string };
  soDienThoai: string | null;
  diaChi: string | null;
  tamTinhHangHoa: number;
  phiVanChuyen: number;
  giamKhuyenMai: number;
  diemDaDung: number;
  giaTriDiemDaDung: number;
  nguoiLapId: string | null;
  dong: Array<{
    id: string;
    thuTu: number;
    mucDonHangId: string;
    tenSanPham: string;
    sku: string;
    soLuong: number;
    donVi: string;
    donGia: number;
    thanhTien: number;
    tenTrangTrai: string;
  }>;
  canhBaoPhapLy: string;
};

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = layApiBaseUrl().replace(/\/+$/, '');
  const options = bearerOptions();
  const headers = new Headers(options.headers);
  if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(`${base}/api/v1${path}`, { ...options, ...init, headers });
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

export function layDanhSachHoaDon(params: { trang?: number; gioiHan?: number; timKiem?: string }) {
  const q = new URLSearchParams();
  if (params.trang) q.set('trang', String(params.trang));
  if (params.gioiHan) q.set('gioiHan', String(params.gioiHan));
  if (params.timKiem) q.set('timKiem', params.timKiem);
  return apiJson<{ duLieu: HoaDonTomTat[]; tong: number; trang: number; gioiHan: number }>(
    `/quan-tri/hoa-don-noi-bo?${q.toString()}`,
  );
}
export function layChiTietHoaDon(id: string) {
  return apiJson<HoaDonChiTiet>(`/quan-tri/hoa-don-noi-bo/${encodeURIComponent(id)}`);
}
export function phatHanhHoaDon(donHangId: string) {
  return apiJson<HoaDonChiTiet>(
    `/quan-tri/hoa-don-noi-bo/don-hang/${encodeURIComponent(donHangId)}/phat-hanh`,
    { method: 'POST' },
  );
}
