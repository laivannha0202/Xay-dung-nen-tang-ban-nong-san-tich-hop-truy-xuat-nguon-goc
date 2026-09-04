import * as Linking from 'expo-linking';

export type TrangThaiKetQuaThanhToanMobile = 'success' | 'failure' | 'pending';

export const PAYMENT_RETURN_PATH = '/thanh-toan/ket-qua';

export function taoPaymentReturnUrl(): string {
  return Linking.createURL(PAYMENT_RETURN_PATH);
}

export function layGiaTriThamSo(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function chuanHoaTrangThaiThanhToan(
  value: string | string[] | undefined,
): TrangThaiKetQuaThanhToanMobile {
  const normalized = layGiaTriThamSo(value)?.trim().toLowerCase();

  if (normalized === 'success' || normalized === 'failure' || normalized === 'pending') {
    return normalized;
  }

  return 'pending';
}
