import {
  layCheckoutPreviewRuntime,
  taoDonHang,
  type CheckoutPreviewRuntime,
  type CheckoutPreviewRuntimeParams,
  type ThanhPhanCheckoutRuntime,
} from '@agrimarket/api-client';

import { duLieuApi } from './api-response';
import { layTuyChonBearer } from './phien-xac-thuc';

export const CHECKOUT_PREVIEW_MOBILE_QUERY_KEY = [
  'checkout-preview-mobile',
] as const;

export type ThanhPhanCheckoutMobile = ThanhPhanCheckoutRuntime;
export type CheckoutPreviewMobile = CheckoutPreviewRuntime;

export type TaoDonHangMobileInput = {
  maYeuCau: string;
  diaChiGiaoHangId: string;
  maKhuyenMai?: string;
  diemSuDung?: number;
  items: Array<{
    bienTheSanPhamId: string;
    soLuong: number;
    donGiaDuKien: number;
  }>;
};

export type TaoDonHangMobileKetQua = {
  id: string;
  maDonHang: string;
  khachHangId: string;
  trangThai: string;
  tongTien: number;
  datCho: {
    id: string;
    maThamChieu: string;
    trangThai: string;
    hetHanLuc: string;
  };
  donNhaCungCap: Array<{
    id: string;
    maDon: string;
    nhaCungCapId: string;
    tenNhaCungCap: string;
    trangThai: string;
    tamTinh: number;
    muc: Array<{
      id: string;
      sanPhamId: string;
      bienTheSanPhamId: string;
      trangTraiId: string;
      soLuong: number;
      donGiaSnapshot: number;
      tenSanPhamSnapshot: string;
      skuBienTheSnapshot: string;
      khoiLuongBienTheSnapshot: number;
      donViBienTheSnapshot: string;
      maTrangTraiSnapshot: string;
      tenTrangTraiSnapshot: string;
      phanBo: Array<{
        id: string;
        tonKhoLoId: string;
        maLo: string;
        maKho: string;
        soLuong: number;
      }>;
    }>;
  }>;
};

export async function layCheckoutPreviewMobile(
  params: CheckoutPreviewRuntimeParams = {},
): Promise<CheckoutPreviewMobile> {
  return layCheckoutPreviewRuntime(params, await layTuyChonBearer());
}

/**
 * Chuyển đúng dữ liệu Backend vừa preview thành create-order contract.
 * Mobile chỉ gửi lựa chọn promotion/points; Backend luôn đánh giá lại trong transaction.
 */
export function taoDuLieuDonHangTuPreview(
  preview: CheckoutPreviewMobile,
  diaChiGiaoHangId: string,
  maYeuCau: string,
  uuDai: { maKhuyenMai?: string; diemSuDung?: number } = {},
): TaoDonHangMobileInput {
  return {
    maYeuCau,
    diaChiGiaoHangId,
    maKhuyenMai: uuDai.maKhuyenMai?.trim() || undefined,
    diemSuDung: uuDai.diemSuDung && uuDai.diemSuDung > 0 ? Math.trunc(uuDai.diemSuDung) : undefined,
    items: preview.items.map((item) => ({
      bienTheSanPhamId: item.bienTheId,
      soLuong: item.soLuong,
      donGiaDuKien: item.donGia,
    })),
  };
}

export async function taoDonHangMobile(
  input: TaoDonHangMobileInput,
): Promise<TaoDonHangMobileKetQua> {
  const body = {
    maYeuCau: input.maYeuCau,
    diaChiGiaoHangId: input.diaChiGiaoHangId,
    maKhuyenMai: input.maKhuyenMai,
    diemSuDung: input.diemSuDung,
    items: input.items,
  } as Parameters<typeof taoDonHang>[0] & {
    maKhuyenMai?: string;
    diemSuDung?: number;
  };

  const response = await taoDonHang(
    body,
    await layTuyChonBearer(),
  );

  return duLieuApi(response) as TaoDonHangMobileKetQua;
}
