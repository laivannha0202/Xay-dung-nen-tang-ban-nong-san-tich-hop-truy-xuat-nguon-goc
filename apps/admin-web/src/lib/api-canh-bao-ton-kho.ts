'use client';

import { layCanhBaoHetHanTonKho } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

type HttpResponse<T> = {
  data: T;
  status: number;
  headers: Headers;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

export async function layCanhBaoTonKho(params: Parameters<typeof layCanhBaoHetHanTonKho>[0]) {
  return duLieu(await layCanhBaoHetHanTonKho(params, bearerOptions()));
}
