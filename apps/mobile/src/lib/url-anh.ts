const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';

const HOST_LOCAL = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function layApiUrl(): URL | null {
  if (!API_BASE_URL) return null;

  try {
    return new URL(API_BASE_URL);
  } catch {
    return null;
  }
}

function boApiPrefix(value: string): string {
  return value.replace(/\/api\/v1\/?$/i, '').replace(/\/+$/, '');
}

function thayHostLocalTheoApi(value: string): string {
  const apiUrl = layApiUrl();

  try {
    const parsed = new URL(value);
    if (!HOST_LOCAL.has(parsed.hostname) || !apiUrl?.hostname) {
      return value;
    }

    // Ảnh/S3 local có thể chạy ở cổng khác API (ví dụ MinIO :9000),
    // vì vậy chỉ thay hostname để điện thoại thật truy cập được qua LAN IP.
    parsed.hostname = apiUrl.hostname;
    return parsed.toString();
  } catch {
    return value;
  }
}

export function chuanHoaUrlAnhMobile(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  if (raw.startsWith('data:') || raw.startsWith('file:') || raw.startsWith('content:')) {
    return raw;
  }

  if (/^https?:\/\//i.test(raw)) {
    return thayHostLocalTheoApi(raw);
  }

  if (!API_BASE_URL) return null;

  const base = boApiPrefix(API_BASE_URL);
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${path}`;
}
