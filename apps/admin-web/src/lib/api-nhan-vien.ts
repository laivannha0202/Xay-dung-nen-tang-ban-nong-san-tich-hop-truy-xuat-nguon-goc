'use client';

import {
  capNhatNhanVienQuanTri,
  datLaiMatKhauNhanVienQuanTri,
  ganVaiTroNhanVienQuanTri,
  khoaNhanVienQuanTri,
  layChiTietNhanVienQuanTri,
  layDanhSachNhanVienQuanTri,
  layVaiTroKhaDungNhanVienQuanTri,
  taoNhanVienQuanTri,
} from '@agrimarket/api-client';
import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = { data: T };
function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export type NhanVienAdmin = {
  id: string;
  nguoiDungId: string;
  maNhanVien: string;
  chucDanh: string | null;
  email: string;
  hoTen: string;
  soDienThoai: string | null;
  trangThaiNguoiDung: 'CHUA_KICH_HOAT' | 'HOAT_DONG' | 'TAM_KHOA';
  trangThaiNhanVien: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
  vaiTro: string[];
  createdAt: string;
  updatedAt: string;
};
export type DanhSachNhanVienAdmin = {
  items: NhanVienAdmin[];
  tong: number;
  trang: number;
  gioiHan: number;
};
export type VaiTroKhaDungAdmin = { ma: string; ten: string };
export type TaoNhanVienInput = {
  email: string;
  matKhau: string;
  hoTen: string;
  soDienThoai?: string;
  maNhanVien: string;
  chucDanh?: string;
};
export type CapNhatNhanVienInput = {
  email?: string;
  hoTen?: string;
  soDienThoai?: string;
  maNhanVien?: string;
  chucDanh?: string;
};
export type DatLaiMatKhauInput = { matKhauMoi: string };
export type GanVaiTroInput = { maVaiTro: string[] };

export async function apiLayDanhSachNhanVien(
  params: Parameters<typeof layDanhSachNhanVienQuanTri>[0],
): Promise<DanhSachNhanVienAdmin> {
  return duLieu(await layDanhSachNhanVienQuanTri(params, bearerOptions())) as DanhSachNhanVienAdmin;
}
export async function apiLayVaiTroKhaDung(): Promise<VaiTroKhaDungAdmin[]> {
  const response = duLieu(await layVaiTroKhaDungNhanVienQuanTri(bearerOptions())) as {
    items: VaiTroKhaDungAdmin[];
  };
  return response.items;
}
export async function apiLayChiTietNhanVien(id: string): Promise<NhanVienAdmin> {
  return duLieu(await layChiTietNhanVienQuanTri(id, bearerOptions())) as NhanVienAdmin;
}
export async function apiTaoNhanVien(input: TaoNhanVienInput): Promise<NhanVienAdmin> {
  return duLieu(await taoNhanVienQuanTri(input, bearerOptions())) as NhanVienAdmin;
}
export async function apiCapNhatNhanVien(
  id: string,
  input: CapNhatNhanVienInput,
): Promise<NhanVienAdmin> {
  return duLieu(await capNhatNhanVienQuanTri(id, input, bearerOptions())) as NhanVienAdmin;
}
export async function apiKhoaNhanVien(id: string): Promise<NhanVienAdmin> {
  return duLieu(await khoaNhanVienQuanTri(id, bearerOptions())) as NhanVienAdmin;
}
export async function apiDatLaiMatKhau(
  id: string,
  input: DatLaiMatKhauInput,
): Promise<{ id: string; nguoiDungId: string; thongBao: string }> {
  return duLieu(await datLaiMatKhauNhanVienQuanTri(id, input, bearerOptions())) as {
    id: string;
    nguoiDungId: string;
    thongBao: string;
  };
}
export async function apiGanVaiTro(id: string, input: GanVaiTroInput): Promise<NhanVienAdmin> {
  return duLieu(await ganVaiTroNhanVienQuanTri(id, input, bearerOptions())) as NhanVienAdmin;
}
