import {
  layThanhToanDonHangCuaToi,
  taoThanhToan,
} from '@agrimarket/api-client';

import { duLieuApi } from './api-response';
import { layTuyChonBearer } from './phien-xac-thuc';

export const THANH_TOAN_MOBILE_QUERY_KEY = [
  'thanh-toan-mobile',
] as const;

export function thanhToanDonHangMobileQueryKey(donHangId: string) {
  return [...THANH_TOAN_MOBILE_QUERY_KEY, 'don-hang', donHangId] as const;
}

export type ThanhToanMobile = {
  id: string;
  donHangId: string;
  maDonHang: string;
  soTien: number;
  phuongThuc: string;
  trangThai: string;
  giaoDich: {
    id: string;
    maGiaoDich: string;
    soTien: number;
    phuongThuc: string;
    trangThai: string;
    thoiGian: string;
  };
  datCho: {
    id: string;
    trangThai: string;
    hetHanLuc: string;
  };
  paymentUrl?: string;
  expiresAt?: string;
};

export async function taoThanhToanCodMobile(
  donHangId: string,
  maYeuCau: string,
): Promise<ThanhToanMobile> {
  const body: Parameters<typeof taoThanhToan>[0] = {
    donHangId,
    maYeuCau,
    phuongThuc: 'COD',
  };

  const response = await taoThanhToan(
    body,
    await layTuyChonBearer(),
  );

  return duLieuApi(response) as ThanhToanMobile;
}

export async function taoThanhToanVnPaySandboxMobile(
  donHangId: string,
  maYeuCau: string,
): Promise<ThanhToanMobile> {
  const body: Parameters<typeof taoThanhToan>[0] = {
    donHangId,
    maYeuCau,
    phuongThuc: 'VNPAY_SANDBOX',
  };

  const response = await taoThanhToan(
    body,
    await layTuyChonBearer(),
  );

  return duLieuApi(response) as ThanhToanMobile;
}

export async function layThanhToanDonHangMobile(
  donHangId: string,
): Promise<ThanhToanMobile> {
  const response = await layThanhToanDonHangCuaToi(
    donHangId,
    await layTuyChonBearer(),
  );

  return duLieuApi(response) as ThanhToanMobile;
}
