'use client';

import { layCheckoutPreview } from '@agrimarket/api-client';

import { bearerOptionsKhachHang } from './phien-khach-hang';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

export type ThanhPhanCheckoutKhach = {
  trangThai: string;
  giaTri: number | null;
  lyDo: string;
};

export type CheckoutPreviewKhach = {
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
  promotion: ThanhPhanCheckoutKhach;
  shipping: ThanhPhanCheckoutKhach;
  points: ThanhPhanCheckoutKhach;
  total: {
    tamTinhDaBiet: number;
    tongThanhToan: number | null;
    coTheXacNhan: boolean;
    lyDoKhongTheXacNhan: string[];
  };
};

export async function layCheckoutPreviewKhach(): Promise<CheckoutPreviewKhach> {
  const response = await layCheckoutPreview(bearerOptionsKhachHang());
  return duLieu(response) as CheckoutPreviewKhach;
}
