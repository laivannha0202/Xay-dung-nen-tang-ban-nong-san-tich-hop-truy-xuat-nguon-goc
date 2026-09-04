import { layCheckoutPreview } from '@agrimarket/api-client';

import { layTuyChonBearer } from './phien-xac-thuc';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

export const CHECKOUT_PREVIEW_MOBILE_QUERY_KEY = ['checkout-preview-mobile'] as const;

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

export async function layCheckoutPreviewMobile(): Promise<CheckoutPreviewMobile> {
  const response = await layCheckoutPreview(await layTuyChonBearer());
  return duLieu(response) as CheckoutPreviewMobile;
}
