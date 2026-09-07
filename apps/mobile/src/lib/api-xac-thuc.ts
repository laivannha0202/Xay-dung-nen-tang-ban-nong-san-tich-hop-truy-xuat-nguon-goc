import {
  dangKyKhachHang,
  dangNhap,
  dangXuat,
  lamMoiToken,
  yeuCauDatLaiMatKhau,
} from '@agrimarket/api-client';

import { thongBaoLoiApi } from './api-error';
import { duLieuApi } from './api-response';

export async function apiDangNhap(email: string, matKhau: string) {
  const body: Parameters<typeof dangNhap>[0] = {
    email: email.trim().toLowerCase(),
    matKhau,
    nenTang: 'MOBILE',
  };
  return duLieuApi(await dangNhap(body));
}

export async function apiDangKy(input: {
  email: string;
  matKhau: string;
  hoTen: string;
  soDienThoai?: string;
}) {
  const body: Parameters<typeof dangKyKhachHang>[0] = {
    email: input.email.trim().toLowerCase(),
    matKhau: input.matKhau,
    hoTen: input.hoTen.trim(),
    soDienThoai: input.soDienThoai?.trim() || undefined,
  };
  return duLieuApi(await dangKyKhachHang(body));
}

export async function apiLamMoi(refreshToken: string) {
  const body: Parameters<typeof lamMoiToken>[0] = { refreshToken, nenTang: 'MOBILE' };
  return duLieuApi(await lamMoiToken(body));
}

export async function apiDangXuat(refreshToken: string) {
  const body: Parameters<typeof dangXuat>[0] = { refreshToken, nenTang: 'MOBILE' };
  return duLieuApi(await dangXuat(body));
}

export async function apiQuenMatKhau(email: string) {
  const body: Parameters<typeof yeuCauDatLaiMatKhau>[0] = { email: email.trim().toLowerCase() };
  return duLieuApi(await yeuCauDatLaiMatKhau(body));
}

export function thongBaoLoiXacThuc(error: unknown): string {
  return thongBaoLoiApi(
    error,
    'Không thể kết nối dịch vụ xác thực. Vui lòng thử lại.',
  );
}
