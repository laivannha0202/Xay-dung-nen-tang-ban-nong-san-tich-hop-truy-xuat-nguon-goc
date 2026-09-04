import {
  dangKyKhachHang,
  dangNhap,
  dangXuat,
  lamMoiToken,
  yeuCauDatLaiMatKhau,
} from '@agrimarket/api-client';

type UnwrapHttp<T> = T extends { data: infer D } ? D : T;

function duLieu<T>(response: T): UnwrapHttp<T> {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as { data: UnwrapHttp<T> }).data;
  }
  return response as UnwrapHttp<T>;
}

export async function apiDangNhap(email: string, matKhau: string) {
  const body: Parameters<typeof dangNhap>[0] = {
    email: email.trim().toLowerCase(),
    matKhau,
    nenTang: 'MOBILE',
  };
  return duLieu(await dangNhap(body));
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
  return duLieu(await dangKyKhachHang(body));
}

export async function apiLamMoi(refreshToken: string) {
  const body: Parameters<typeof lamMoiToken>[0] = { refreshToken, nenTang: 'MOBILE' };
  return duLieu(await lamMoiToken(body));
}

export async function apiDangXuat(refreshToken: string) {
  const body: Parameters<typeof dangXuat>[0] = { refreshToken, nenTang: 'MOBILE' };
  return duLieu(await dangXuat(body));
}

export async function apiQuenMatKhau(email: string) {
  const body: Parameters<typeof yeuCauDatLaiMatKhau>[0] = { email: email.trim().toLowerCase() };
  return duLieu(await yeuCauDatLaiMatKhau(body));
}

export function thongBaoLoiXacThuc(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null) {
    const data = 'data' in error ? (error as { data?: unknown }).data : error;
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (Array.isArray(message)) {
        return message.filter((item): item is string => typeof item === 'string').join(', ');
      }
      if (typeof message === 'string' && message) return message;
    }
  }
  return 'Không thể kết nối dịch vụ xác thực. Vui lòng thử lại.';
}
