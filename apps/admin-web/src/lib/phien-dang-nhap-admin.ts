'use client';

import { layApiBaseUrl } from '@agrimarket/api-client';

const KHOA = 'agrimarket-admin-session';
export const SU_KIEN_HET_PHIEN_ADMIN = 'agrimarket-admin-session-expired';

/** Refresh chủ động khi access token còn <= 30 giây. */
const NGUONG_LAM_MOI_TRUOC_HAN_MS = 30_000;

type WindowAdmin = Window & {
  __agrimarketAdminFetchInstalled?: boolean;
};

export type PhienAdmin = {
  accessToken: string;
  accessTokenExpiresAt?: number;
  nguoiDung: {
    id: string;
    email: string;
    hoTen: string;
  };
  quyen: string[];
};

type PhanHoiLamMoi = {
  accessToken: string;
  expiresIn?: number;
  nguoiDung?: PhienAdmin['nguoiDung'];
};

type HttpResponse<T> = { data: T };

let dangDamBaoPhien: Promise<PhienAdmin | null> | null = null;

function duLieu<T>(payload: T | HttpResponse<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as HttpResponse<T>).data;
  }
  return payload as T;
}

function hanAccessTokenTuJwt(accessToken: string): number | undefined {
  try {
    const [, payload] = accessToken.split('.');
    if (!payload) return undefined;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = JSON.parse(window.atob(padded)) as { exp?: unknown };
    const exp = Number(decoded.exp);
    return Number.isFinite(exp) && exp > 0 ? exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function chuanHoaPhien(phien: PhienAdmin): PhienAdmin {
  if (typeof phien.accessTokenExpiresAt === 'number') return phien;
  const expiresAt = hanAccessTokenTuJwt(phien.accessToken);
  return expiresAt ? { ...phien, accessTokenExpiresAt: expiresAt } : phien;
}

function accessTokenSapHetHan(phien: PhienAdmin): boolean {
  const expiresAt =
    phien.accessTokenExpiresAt ?? hanAccessTokenTuJwt(phien.accessToken);
  if (typeof expiresAt !== 'number') return false;
  return expiresAt <= Date.now() + NGUONG_LAM_MOI_TRUOC_HAN_MS;
}

export function luuPhienAdmin(phien: PhienAdmin): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KHOA, JSON.stringify(chuanHoaPhien(phien)));
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
    return chuanHoaPhien(value as PhienAdmin);
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

function apiBaseUrl(): string {
  return layApiBaseUrl().replace(/\/+$/, '');
}

function authPrefix(): string {
  return `${apiBaseUrl()}/api/v1/xac-thuc/`;
}

function thongBaoHetPhien(): void {
  xoaPhienAdmin();
  window.dispatchEvent(new Event(SU_KIEN_HET_PHIEN_ADMIN));
}

async function goiLamMoiBangCookie(
  fetcher: typeof window.fetch = window.fetch.bind(window),
): Promise<PhanHoiLamMoi | null> {
  const response = await fetcher(`${authPrefix()}lam-moi`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nenTang: 'WEB' }),
  });

  if (response.status === 401) return null;

  if (!response.ok) {
    throw new Error(`Không làm mới được phiên quản trị (HTTP ${response.status}).`);
  }

  const payload = duLieu((await response.json()) as PhanHoiLamMoi | HttpResponse<PhanHoiLamMoi>);
  if (!payload.accessToken) {
    throw new Error('API refresh không trả access token.');
  }
  return payload;
}

async function layQuyenVoiToken(accessToken: string): Promise<string[]> {
  const response = await window.fetch(`${apiBaseUrl()}/api/v1/phan-quyen/cua-toi`, {
    method: 'GET',
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) return [];

  if (!response.ok) {
    throw new Error(`Không tải được quyền quản trị (HTTP ${response.status}).`);
  }

  const data = duLieu(
    (await response.json()) as { quyen: string[] } | HttpResponse<{ quyen: string[] }>,
  );
  return Array.isArray(data.quyen) ? data.quyen : [];
}

/**
 * Bootstrap phiên Admin trước khi mount page protected:
 * - token còn hạn: dùng luôn
 * - token hết/sắp hết: refresh bằng HttpOnly cookie trước
 * - tab/browser mới không còn sessionStorage nhưng cookie "Ghi nhớ" còn:
 *   refresh + tải lại quyền rồi dựng lại phiên
 *
 * Single-flight để React Strict Mode/HMR không rotate refresh token 2 lần.
 */
export function damBaoPhienAdmin(): Promise<PhienAdmin | null> {
  const hienTai = layPhienAdmin();

  if (hienTai && !accessTokenSapHetHan(hienTai)) {
    return Promise.resolve(hienTai);
  }

  if (dangDamBaoPhien) return dangDamBaoPhien;

  dangDamBaoPhien = (async () => {
    try {
      const payload = await goiLamMoiBangCookie();
      if (!payload) {
        xoaPhienAdmin();
        return null;
      }

      const nguoiDung = payload.nguoiDung ?? hienTai?.nguoiDung;
      if (!nguoiDung) {
        xoaPhienAdmin();
        return null;
      }

      const quyen = await layQuyenVoiToken(payload.accessToken);
      if (quyen.length === 0) {
        xoaPhienAdmin();
        return null;
      }

      const phien: PhienAdmin = {
        accessToken: payload.accessToken,
        ...(typeof payload.expiresIn === 'number' && Number.isFinite(payload.expiresIn)
          ? { accessTokenExpiresAt: Date.now() + payload.expiresIn * 1000 }
          : {}),
        nguoiDung,
        quyen,
      };

      luuPhienAdmin(phien);
      return phien;
    } catch {
      // Lỗi mạng/API tạm thời: nếu còn phiên local thì giữ để UI có thể thử lại.
      // Không xóa phiên oan; chỉ refresh 401 ở trên mới xóa.
      return hienTai;
    } finally {
      dangDamBaoPhien = null;
    }
  })();

  return dangDamBaoPhien;
}

/**
 * Lớp bảo vệ thứ hai cho request phát sinh sau khi app đã chạy:
 * access token 401 -> refresh single-flight -> retry đúng 1 lần.
 */
export function caiDatTuDongLamMoiPhienAdmin(): void {
  if (typeof window === 'undefined') return;

  const adminWindow = window as WindowAdmin;
  if (adminWindow.__agrimarketAdminFetchInstalled) return;

  const fetchGoc = window.fetch.bind(window);
  const apiBase = apiBaseUrl();
  const prefixAuth = `${apiBase}/api/v1/xac-thuc/`;
  let dangLamMoi: Promise<string | null> | null = null;

  const lamMoi = async (): Promise<string | null> => {
    const payload = await goiLamMoiBangCookie(fetchGoc);

    if (!payload) {
      thongBaoHetPhien();
      return null;
    }

    const current = layPhienAdmin();
    if (!current) return null;

    luuPhienAdmin({
      ...current,
      accessToken: payload.accessToken,
      ...(typeof payload.expiresIn === 'number' && Number.isFinite(payload.expiresIn)
        ? { accessTokenExpiresAt: Date.now() + payload.expiresIn * 1000 }
        : {}),
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
      url.startsWith(`${prefixAuth}dang-nhap`) ||
      url.startsWith(`${prefixAuth}lam-moi`) ||
      url.startsWith(`${prefixAuth}dang-xuat`);

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
    await fetch(`${authPrefix()}dang-xuat`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nenTang: 'WEB' }),
    });
  } finally {
    xoaPhienAdmin();
  }
}
