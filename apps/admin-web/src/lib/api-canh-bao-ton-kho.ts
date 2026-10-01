'use client';

import { duLieu, layCanhBaoHetHanTonKho } from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';


export async function layCanhBaoTonKho(params: Parameters<typeof layCanhBaoHetHanTonKho>[0]) {
  return duLieu(await layCanhBaoHetHanTonKho(params, bearerOptions()));
}
