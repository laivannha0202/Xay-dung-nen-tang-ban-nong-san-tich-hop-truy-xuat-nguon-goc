import { layApiBaseUrl } from './runtime';

export type CheckoutPreviewRuntimeParams = {
  maKhuyenMai?: string;
  diemSuDung?: number;
};

export type ThanhPhanCheckoutRuntime = {
  trangThai: string;
  giaTri: number | null;
  lyDo: string;
};

export type CheckoutPreviewRuntime = {
  gioHangId: string;
  items: Array<{
    mucGioHangId: string;
    sanPhamId: string;
    tenSanPham: string;
    anhBiaUrl: string | null;
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
  promotion: ThanhPhanCheckoutRuntime;
  shipping: ThanhPhanCheckoutRuntime;
  points: ThanhPhanCheckoutRuntime;
  total: {
    tamTinhDaBiet: number;
    tongThanhToan: number | null;
    coTheXacNhan: boolean;
    lyDoKhongTheXacNhan: string[];
  };
};

type LoiHttp = Error & {
  status: number;
  data?: unknown;
};

async function taoLoiHttp(response: Response): Promise<LoiHttp> {
  let data: unknown;
  try {
    const raw = await response.text();
    if (raw) {
      try {
        data = JSON.parse(raw) as unknown;
      } catch {
        data = raw;
      }
    }
  } catch {
    data = undefined;
  }

  const error = new Error(`Yêu cầu không thành công (HTTP ${response.status}).`) as LoiHttp;
  error.name = 'LoiHttpApiClient';
  error.status = response.status;
  error.data = data;
  return error;
}

/**
 * Runtime adapter giữ Mobile/Web dùng được promotion + loyalty ngay cả trước khi
 * OpenAPI/Orval snapshot được regenerate. release:final vẫn là bước bắt buộc để
 * đồng bộ generated client sau cùng.
 */
export async function layCheckoutPreviewRuntime(
  params: CheckoutPreviewRuntimeParams = {},
  options: RequestInit = {},
): Promise<CheckoutPreviewRuntime> {
  const url = new URL('/api/v1/gio-hang/checkout-preview', layApiBaseUrl());
  const maKhuyenMai = params.maKhuyenMai?.trim();
  if (maKhuyenMai) url.searchParams.set('maKhuyenMai', maKhuyenMai);
  if (params.diemSuDung !== undefined && params.diemSuDung > 0) {
    url.searchParams.set('diemSuDung', String(Math.trunc(params.diemSuDung)));
  }

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  const response = await fetch(url, {
    ...options,
    method: 'GET',
    headers,
  });
  if (!response.ok) throw await taoLoiHttp(response);

  return (await response.json()) as CheckoutPreviewRuntime;
}
