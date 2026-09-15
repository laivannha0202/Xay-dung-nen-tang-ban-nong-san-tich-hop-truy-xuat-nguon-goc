import { layApiBaseUrl } from './runtime';

export type PhamViKhuyenMaiKhachHang = 'PLATFORM' | 'DANH_MUC' | 'SAN_PHAM';

export type KhuyenMaiKhachHang = {
  id: string;
  ma: string;
  ten: string;
  moTa: string | null;
  phamVi: PhamViKhuyenMaiKhachHang;
  danhMucSanPhamId: string | null;
  sanPhamId: string | null;
  donHangToiThieu: number;
  giaTriGiam: number;
  batDauLuc: string;
  ketThucLuc: string;
  gioiHanSuDung: number | null;
  soLanDaSuDung: number;
  soLuotConLai: number | null;
  daLuu: boolean;
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

async function goiJson<T>(
  path: string,
  method: 'GET' | 'POST' | 'DELETE',
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  const response = await fetch(new URL(path, layApiBaseUrl()), {
    ...options,
    method,
    headers,
  });

  if (!response.ok) throw await taoLoiHttp(response);
  return (await response.json()) as T;
}

export function layKhuyenMaiCongKhaiRuntime(
  options: RequestInit = {},
): Promise<KhuyenMaiKhachHang[]> {
  return goiJson<KhuyenMaiKhachHang[]>('/api/v1/khuyen-mai/cong-khai', 'GET', options);
}

export function layKhuyenMaiDaLuuRuntime(
  options: RequestInit = {},
): Promise<KhuyenMaiKhachHang[]> {
  return goiJson<KhuyenMaiKhachHang[]>('/api/v1/khach-hang/khuyen-mai', 'GET', options);
}

export function luuKhuyenMaiRuntime(
  id: string,
  options: RequestInit = {},
): Promise<KhuyenMaiKhachHang> {
  return goiJson<KhuyenMaiKhachHang>(
    `/api/v1/khach-hang/khuyen-mai/${encodeURIComponent(id)}/luu`,
    'POST',
    options,
  );
}

export function boLuuKhuyenMaiRuntime(
  id: string,
  options: RequestInit = {},
): Promise<{ ok: boolean }> {
  return goiJson<{ ok: boolean }>(
    `/api/v1/khach-hang/khuyen-mai/${encodeURIComponent(id)}/luu`,
    'DELETE',
    options,
  );
}
