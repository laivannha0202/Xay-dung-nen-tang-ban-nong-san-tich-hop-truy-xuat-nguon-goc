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
