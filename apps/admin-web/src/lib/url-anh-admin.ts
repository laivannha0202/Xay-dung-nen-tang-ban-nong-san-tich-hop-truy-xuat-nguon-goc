'use client';

import { layApiBaseUrl } from '@agrimarket/api-client';

export function chuanHoaUrlAnhAdmin(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  if (raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }

  const base = layApiBaseUrl().replace(/\/+$/, '');

  try {
    const absolute = /^https?:\/\//i.test(raw)
      ? raw
      : `${base}${raw.startsWith('/') ? '' : '/'}${raw}`;

    const parsed = new URL(absolute);
    const local =
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === 'minio';

    if (local) {
      return `/api/anh-san-pham?src=${encodeURIComponent(absolute)}`;
    }

    return absolute;
  } catch {
    return null;
  }
}
