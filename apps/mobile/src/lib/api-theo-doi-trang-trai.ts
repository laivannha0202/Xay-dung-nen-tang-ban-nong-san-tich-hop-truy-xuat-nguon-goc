import {
  boTheoDoiTrangTrai,
  layTrangThaiTheoDoiTrangTrai,
  theoDoiTrangTrai,
} from '@agrimarket/api-client';

import { duLieuApi } from './api-response';
import { layTuyChonBearer } from './phien-xac-thuc';

export function trangThaiTheoDoiTrangTraiMobileQueryKey(trangTraiId: string) {
  return ['trang-trai-mobile', 'theo-doi', trangTraiId] as const;
}

export type TrangThaiTheoDoiTrangTraiMobile = {
  trangTraiId: string;
  dangTheoDoi: boolean;
};

export async function layTrangThaiTheoDoiTrangTraiMobile(
  trangTraiId: string,
): Promise<TrangThaiTheoDoiTrangTraiMobile> {
  const response = await layTrangThaiTheoDoiTrangTrai(
    trangTraiId,
    await layTuyChonBearer(),
  );
  return duLieuApi(response) as TrangThaiTheoDoiTrangTraiMobile;
}

export async function theoDoiTrangTraiMobile(
  trangTraiId: string,
): Promise<TrangThaiTheoDoiTrangTraiMobile> {
  const response = await theoDoiTrangTrai(trangTraiId, await layTuyChonBearer());
  return duLieuApi(response) as TrangThaiTheoDoiTrangTraiMobile;
}

export async function boTheoDoiTrangTraiMobile(
  trangTraiId: string,
): Promise<TrangThaiTheoDoiTrangTraiMobile> {
  const response = await boTheoDoiTrangTrai(trangTraiId, await layTuyChonBearer());
  return duLieuApi(response) as TrangThaiTheoDoiTrangTraiMobile;
}
