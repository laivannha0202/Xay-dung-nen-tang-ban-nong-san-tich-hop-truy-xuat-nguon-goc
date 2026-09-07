import {
  layCheckoutPreview,
  taoDonHang,
} from '@agrimarket/api-client';

import { duLieuApi } from './api-response';
import { layTuyChonBearer } from './phien-xac-thuc';

export const CHECKOUT_PREVIEW_MOBILE_QUERY_KEY = [
  'checkout-preview-mobile',
] as const;

export type ThanhPhanCheckoutMobile = {
  trangThai: string;
  giaTri: number | null;
  lyDo: string;
};

export type CheckoutPreviewMobile = {
  gioHangId: string;
  items: Array<{
    mucGioHangId: string;
    sanPhamId: string;
    tenSanPham: string;
    bienTheId: string;
    sku: string;
    soLuong: number;
    donGia: number;
    thanhTien: number;
    soLuongKhaDung: number;
    coTheDatHang: boolean;
    nhaCungCap: {
      id: string;
      ten: string;
    };
  }>;
  price: {
    tamTinhHangHoa: number;
    tienTe: string;
  };
  promotion: ThanhPhanCheckoutMobile;
  shipping: ThanhPhanCheckoutMobile;
  points: ThanhPhanCheckoutMobile;
  total: {
    tamTinhDaBiet: number;
    tongThanhToan: number | null;
    coTheXacNhan: boolean;
    lyDoKhongTheXacNhan: string[];
  };
};

export type TaoDonHangMobileInput = {
  maYeuCau: string;
  diaChiGiaoHangId: string;
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

export async function layCheckoutPreviewMobile(): Promise<CheckoutPreviewMobile> {
  const response = await layCheckoutPreview(await layTuyChonBearer());
  return duLieuApi(response) as CheckoutPreviewMobile;
}

/**
 * Chuyển đúng dữ liệu Backend vừa preview thành create-order contract.
 *
 * Lưu ý:
 * - donGiaDuKien chỉ là giá client vừa thấy;
 * - Backend POST /don-hang bắt buộc đối chiếu current price;
 * - Mobile không gửi tongTien / phiVanChuyen / thanhTien làm source of truth.
 */
export function taoDuLieuDonHangTuPreview(
  preview: CheckoutPreviewMobile,
  diaChiGiaoHangId: string,
  maYeuCau: string,
): TaoDonHangMobileInput {
  return {
    maYeuCau,
    diaChiGiaoHangId,
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
  const body: Parameters<typeof taoDonHang>[0] = {
    maYeuCau: input.maYeuCau,
    diaChiGiaoHangId: input.diaChiGiaoHangId,
    items: input.items,
  };

  const response = await taoDonHang(
    body,
    await layTuyChonBearer(),
  );

  return duLieuApi(response) as TaoDonHangMobileKetQua;
}
