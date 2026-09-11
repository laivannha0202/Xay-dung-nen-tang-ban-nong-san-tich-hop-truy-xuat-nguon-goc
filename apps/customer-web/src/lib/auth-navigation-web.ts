export function duongDanNoiBo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/';
  }

  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 32 || code === 127) return '/';
  }

  try {
    const base = 'https://agrimarket.local';
    const url = new URL(value, base);
    if (url.origin !== base) return '/';
    if (url.pathname === '/dang-nhap' || url.pathname === '/dang-ky') return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

export function themNext(pathname: string, next: string | null | undefined): string {
  const safeNext = duongDanNoiBo(next);
  if (safeNext === '/') return pathname;

  const params = new URLSearchParams({ next: safeNext });
  return `${pathname}?${params.toString()}`;
}
