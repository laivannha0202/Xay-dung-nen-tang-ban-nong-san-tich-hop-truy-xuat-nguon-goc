import type { Href } from 'expo-router';

type ThamSoRoute = string | string[] | undefined;

type RouterCoPush = {
  push: (href: Href) => void;
};

export type HanhDongSauDangNhapMobile = {
  loai: 'them-gio-hang';
  returnTo: string;
  bienTheSanPhamId: string;
  soLuong: number;
};

const AUTH_ROUTES = new Set(['/dang-nhap', '/dang-ky', '/quen-mat-khau']);
const MAX_RETURN_TO_LENGTH = 512;

let hanhDongSauDangNhap: HanhDongSauDangNhapMobile | null = null;

function layMotGiaTri(value: ThamSoRoute): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

/**
 * Chỉ chấp nhận route nội bộ.
 *
 * Không chấp nhận:
 * - URL tuyệt đối;
 * - protocol-relative URL //example.com;
 * - backslash;
 * - control characters;
 * - auth route để tránh loop login.
 */
export function chuanHoaReturnTo(value: ThamSoRoute | string): string {
  const raw = layMotGiaTri(value as ThamSoRoute).trim();

  if (
    !raw ||
    raw.length > MAX_RETURN_TO_LENGTH ||
    !raw.startsWith('/') ||
    raw.startsWith('//') ||
    raw.includes('\\') ||
    raw.includes('://') ||
    /[\u0000-\u001F\u007F]/.test(raw)
  ) {
    return '/';
  }

  const pathname = raw.split(/[?#]/, 1)[0] ?? '/';

  if (AUTH_ROUTES.has(pathname)) {
    return '/';
  }

  return raw;
}

export function hrefSauDangNhap(value: ThamSoRoute): Href {
  return chuanHoaReturnTo(value) as Href;
}

export function taoHrefDangNhap(returnTo: string): Href {
  const safeReturnTo = chuanHoaReturnTo(returnTo);

  return {
    pathname: '/dang-nhap',
    params: {
      returnTo: safeReturnTo,
    },
  } as Href;
}

export function moDangNhap(
  router: RouterCoPush,
  returnTo: string,
  action?: HanhDongSauDangNhapMobile,
): void {
  const safeReturnTo = chuanHoaReturnTo(returnTo);

  if (action) {
    hanhDongSauDangNhap = {
      ...action,
      returnTo: safeReturnTo,
    };
  } else {
    // Không để pending action cũ vô tình chạy sau một login unrelated.
    hanhDongSauDangNhap = null;
  }

  router.push(taoHrefDangNhap(safeReturnTo));
}

export function layVaXoaHanhDongSauDangNhap(
  returnTo: string,
): HanhDongSauDangNhapMobile | null {
  const safeReturnTo = chuanHoaReturnTo(returnTo);
  const current = hanhDongSauDangNhap;

  if (!current || current.returnTo !== safeReturnTo) {
    return null;
  }

  hanhDongSauDangNhap = null;
  return current;
}

export function xoaHanhDongSauDangNhap(): void {
  hanhDongSauDangNhap = null;
}
