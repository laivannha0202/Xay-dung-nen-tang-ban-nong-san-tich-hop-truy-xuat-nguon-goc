'use client';

const KHOA = 'agrimarket-customer-session';

export type PhienKhachHang = {
  accessToken: string;
  nguoiDung: {
    id: string;
    email: string;
    hoTen: string;
  };
};

export function luuPhienKhachHang(phien: PhienKhachHang): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KHOA, JSON.stringify(phien));
}

export function layPhienKhachHang(): PhienKhachHang | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(KHOA);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PhienKhachHang;
  } catch {
    window.sessionStorage.removeItem(KHOA);
    return null;
  }
}

export function xoaPhienKhachHang(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(KHOA);
}

export function coPhienKhachHang(): boolean {
  return layPhienKhachHang() !== null;
}

/**
 * Backend (jwt-access.guard) trả HTTP 401 khi access token không hợp lệ
 * hoặc đã hết hạn. Generated client ném Error có `.status`, còn runtime
 * thủ công ném `LoiHttpApiClient` với message `HTTP 401`.
 * Nhận diện 401 để xóa phiên stale và đưa về đăng nhập thay vì hiển thị
 * lỗi chung + retry vô ích (mỗi retry là một dòng 401 nữa trong console).
 */
export function laLoiPhienHetHan(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = (error as { status?: unknown }).status;
  if (typeof status === 'number') return status === 401;
  const message = error instanceof Error ? error.message : '';
  return /HTTP 401|\b401\b|Unauthorized/i.test(message);
}

export function bearerOptionsKhachHang(): RequestInit {
  const token = layPhienKhachHang()?.accessToken;

  if (!token) {
    throw new Error('Bạn cần đăng nhập để đồng bộ giỏ hàng.');
  }

  return {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}
