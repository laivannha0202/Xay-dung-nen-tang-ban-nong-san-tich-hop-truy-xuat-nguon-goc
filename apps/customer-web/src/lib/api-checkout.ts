'use client';

import { layCheckoutPreview } from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

type CheckoutPreviewGenerated =
  Awaited<ReturnType<typeof layCheckoutPreview>>['data'];

export type CheckoutPreviewKhach = CheckoutPreviewGenerated & {
  loyalty?: {
    soDuDiem: number;
    giaTriMoiDiem: number;
    diemToiDaCoTheSuDung: number;
    giaTriGiamToiDa: number;
  };
};

export type ThanhPhanCheckoutKhach =
  CheckoutPreviewKhach['promotion'];

export type CheckoutPreviewKhachParams =
  NonNullable<Parameters<typeof layCheckoutPreview>[0]>;

export async function layCheckoutPreviewKhach(
  params: CheckoutPreviewKhachParams = {},
): Promise<CheckoutPreviewKhach> {
  const response = await thucThiApiKhachHang((tuyChon) => layCheckoutPreview(params, tuyChon));

  return response.data;
}
