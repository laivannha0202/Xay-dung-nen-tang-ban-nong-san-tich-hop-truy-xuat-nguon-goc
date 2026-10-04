import { layApiBaseUrl } from './runtime';

export type TrangThaiVoucherKhachHang = 'KHA_DUNG' | 'DA_SU_DUNG' | 'HET_HAN';

export type VoucherHienThi = {
  khuyenMaiId: string;
  ma: string;
  ten: string;
  moTa: string | null;
  phamVi: 'PLATFORM' | 'DANH_MUC' | 'SAN_PHAM';
  danhMucSanPhamId: string | null;
  sanPhamId: string | null;
  donHangToiThieu: number;
  giaTriGiam: number;
  batDauLuc: string;
  ketThucLuc: string;
  gioiHanSuDung: number | null;
  soLanDaSuDung: number;
  daLuu: boolean;
  daLuuLuc: string | null;
  daSuDungLuc: string | null;
  maDonHangSuDung: string | null;
  trangThaiVoucher: TrangThaiVoucherKhachHang;
};

export type DanhSachVoucherHienThi = {
  items: VoucherHienThi[];
  tong: number;
};

type LoiHttp = Error & { status: number; data?: unknown };

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

async function goiJson<T>(
  path: string,
  method: 'GET' | 'POST',
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  const response = await fetch(new URL(path, layApiBaseUrl()), { ...options, method, headers });
  if (!response.ok) throw await taoLoiHttp(response);
  return (await response.json()) as T;
}

export function layVoucherCongKhaiRuntime(
  options: RequestInit = {},
): Promise<DanhSachVoucherHienThi> {
  return goiJson<DanhSachVoucherHienThi>('/api/v1/khuyen-mai/voucher', 'GET', options);
}

export function layVoucherCuaToiRuntime(
  options: RequestInit = {},
): Promise<DanhSachVoucherHienThi> {
  return goiJson<DanhSachVoucherHienThi>('/api/v1/khach-hang/voucher', 'GET', options);
}

export function luuVoucherCuaToiRuntime(
  khuyenMaiId: string,
  options: RequestInit = {},
): Promise<VoucherHienThi> {
  return goiJson<VoucherHienThi>(
    `/api/v1/khach-hang/voucher/${encodeURIComponent(khuyenMaiId)}/luu`,
    'POST',
    options,
  );
}
