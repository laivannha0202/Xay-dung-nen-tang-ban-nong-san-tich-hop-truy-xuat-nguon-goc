const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';

function thayHostLocalBangLoopback(value: string): string {
  return value
    .replace('://localhost:', '://127.0.0.1:')
    .replace('://0.0.0.0:', '://127.0.0.1:');
}

export function chuanHoaUrlAnhMobile(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  if (raw.startsWith('data:') || raw.startsWith('file:') || raw.startsWith('content:')) {
    return raw;
  }

  if (/^https?:\/\//i.test(raw)) {
    return thayHostLocalBangLoopback(raw);
  }

  if (!API_BASE_URL) return null;

  const base = thayHostLocalBangLoopback(API_BASE_URL)
    .replace(/\/api\/v1\/?$/i, '')
    .replace(/\/+$/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${path}`;
}
