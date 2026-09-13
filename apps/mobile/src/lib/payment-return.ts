export const PAYMENT_RETURN_PATH = '/thanh-toan/ket-qua';

/**
 * Production/dev-build deep link cố định.
 *
 * Backend MOBILE_PAYMENT_RETURN_URL phải trùng giá trị này.
 * Expo Go không đăng ký custom scheme của project; manual VNPay round-trip
 * cần development build/standalone app.
 */
export const PAYMENT_RETURN_URL = 'agrimarket://thanh-toan/ket-qua';

export function taoPaymentReturnUrl(): string {
  return PAYMENT_RETURN_URL;
}

export function layGiaTriThamSo(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
