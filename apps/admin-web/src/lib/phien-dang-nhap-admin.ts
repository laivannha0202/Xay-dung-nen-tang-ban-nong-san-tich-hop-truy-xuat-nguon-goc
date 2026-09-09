'use client';

import { layApiBaseUrl } from '@agrimarket/api-client';

const KHOA = 'agrimarket-admin-session';
export const SU_KIEN_HET_PHIEN_ADMIN = 'agrimarket-admin-session-expired';

type WindowAdmin = Window & {
  __agrimarketAdminFetchInstalled?: boolean;
};

export type PhienAdmin = {
  accessToken: string;
  nguoiDung: {
    id: string;
    email: string;
    hoTen: string;
  };
  quyen: string[];
};

type PhanHoiLamMoi = {
  accessToken: string;
  nguoiDung?: PhienAdmin['nguoiDung'];
};

export function luuPhienAdmin(phien: PhienAdmin): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KHOA, JSON.stringify(phien));
}

export function layPhienAdmin(): PhienAdmin | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(KHOA);
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<PhienAdmin>;
    if (
      typeof value.accessToken !== 'string' ||
      !value.accessToken ||
      !value.nguoiDung ||
      !Array.isArray(value.quyen)
    ) {
      throw new Error('Phiên không hợp lệ.');
    }
    return value as PhienAdmin;
  } catch {
    window.sessionStorage.removeItem(KHOA);
    return null;
  }
}

export function xoaPhienAdmin(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(KHOA);
}

export function coQuyen(maQuyen: string): boolean {
  return layPhienAdmin()?.quyen.includes(maQuyen) ?? false;
}

export function bearerOptions(): RequestInit {
  const token = layPhienAdmin()?.accessToken;
  if (!token) throw new Error('Phiên quản trị đã hết. Hãy đăng nhập lại.');

  return {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  };
}

function thongBaoHetPhien(): void {
  xoaPhienAdmin();
  window.dispatchEvent(new Event(SU_KIEN_HET_PHIEN_ADMIN));
}

export function caiDatTuDongLamMoiPhienAdmin(): void {
  if (typeof window === 'undefined') return;

  const adminWindow = window as WindowAdmin;
  if (adminWindow.__agrimarketAdminFetchInstalled) return;

  const fetchGoc = window.fetch.bind(window);
  const apiBase = layApiBaseUrl().replace(/\/+$/, '');
  const authPrefix = `${apiBase}/api/v1/xac-thuc/`;
  let dangLamMoi: Promise<string | null> | null = null;

  const lamMoi = async (): Promise<string | null> => {
    const response = await fetchGoc(`${authPrefix}lam-moi`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nenTang: 'WEB' }),
    });

    if (!response.ok) {
      thongBaoHetPhien();
      return null;
    }

    const payload = (await response.json()) as PhanHoiLamMoi;
    if (!payload.accessToken) {
      thongBaoHetPhien();
      return null;
    }

    const current = layPhienAdmin();
    if (!current) return null;

    luuPhienAdmin({
      ...current,
      accessToken: payload.accessToken,
      nguoiDung: payload.nguoiDung ?? current.nguoiDung,
    });

    return payload.accessToken;
  };

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const laApi = url === apiBase || url.startsWith(`${apiBase}/`);
    const laAuthKhongRetry =
      url.startsWith(`${authPrefix}dang-nhap`) ||
      url.startsWith(`${authPrefix}lam-moi`) ||
      url.startsWith(`${authPrefix}dang-xuat`);

    const response = await fetchGoc(input, init);

    if (!laApi || laAuthKhongRetry || response.status !== 401 || !layPhienAdmin()) {
      return response;
    }

    dangLamMoi ??= lamMoi().finally(() => {
      dangLamMoi = null;
    });

    const accessTokenMoi = await dangLamMoi;
    if (!accessTokenMoi) return response;

    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    headers.set('Authorization', `Bearer ${accessTokenMoi}`);

    return fetchGoc(input, {
      ...init,
      credentials: 'include',
      headers,
    });
  }) as typeof window.fetch;

  adminWindow.__agrimarketAdminFetchInstalled = true;
}

export async function dangXuatAdmin(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await fetch(`${layApiBaseUrl().replace(/\/+$/, '')}/api/v1/xac-thuc/dang-xuat`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nenTang: 'WEB' }),
    });
  } finally {
    xoaPhienAdmin();
  }
}
