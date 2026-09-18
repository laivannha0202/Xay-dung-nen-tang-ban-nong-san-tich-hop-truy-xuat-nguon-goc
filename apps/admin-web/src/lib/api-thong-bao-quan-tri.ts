'use client';

import { guiThongBaoPushQuanTri } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

export async function guiThongBao(body: {
  tieuDe: string;
  noiDung: string;
  deepLink?: string;
}): Promise<{ soThietBi: number; daGui: number; soLoi: number }> {
  const r = await guiThongBaoPushQuanTri(body as Parameters<typeof guiThongBaoPushQuanTri>[0], {
    ...bearerOptions(),
    credentials: 'include',
    cache: 'no-store',
  });
  return r.data as unknown as { soThietBi: number; daGui: number; soLoi: number };
}
