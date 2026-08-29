'use client';

const KHOA = 'agrimarket-admin-session';

export type PhienAdmin = {
  accessToken: string;
  nguoiDung: {
    id: string;
    email: string;
    hoTen: string;
  };
  quyen: string[];
};

export function luuPhienAdmin(phien: PhienAdmin): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(KHOA, JSON.stringify(phien));
}

export function layPhienAdmin(): PhienAdmin | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(KHOA);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PhienAdmin;
  } catch {
    window.sessionStorage.removeItem(KHOA);
    return null;
  }
}

export function xoaPhienAdmin(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(KHOA);
}

export function coQuyen(maQuyen: string): boolean {
  return layPhienAdmin()?.quyen.includes(maQuyen) ?? false;
}

export function bearerOptions(): RequestInit {
  const token = layPhienAdmin()?.accessToken;

  if (!token) {
    throw new Error('Phiên quản trị đã hết. Hãy đăng nhập lại.');
  }

  return {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}
