'use client';

import {
  layCheckoutPreviewRuntime,
  type CheckoutPreviewRuntime,
  type CheckoutPreviewRuntimeParams,
  type ThanhPhanCheckoutRuntime,
} from '@agrimarket/api-client';

import { bearerOptionsKhachHang } from './phien-khach-hang';

export type ThanhPhanCheckoutKhach = ThanhPhanCheckoutRuntime;
export type CheckoutPreviewKhach = CheckoutPreviewRuntime;

export async function layCheckoutPreviewKhach(
  params: CheckoutPreviewRuntimeParams = {},
): Promise<CheckoutPreviewKhach> {
  return layCheckoutPreviewRuntime(params, bearerOptionsKhachHang());
}
