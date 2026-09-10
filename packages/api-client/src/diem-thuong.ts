import { layApiBaseUrl } from './runtime';

export type TongQuanDiemThuong = {
  diem: number;
  tongGiaoDich: number;
  capNhatLuc: string | null;
};

export type GiaoDichDiemThuong = {
  id: string;
  bienDongDiem: number;
  soDuSau: number;
  lyDo: string | null;
  createdAt: string;
};

export type DanhSachGiaoDichDiemThuong = {
  items: GiaoDichDiemThuong[];
  tong: number;
  trang: number;
  gioiHan: number;
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

async function goiJson<T>(path: string, options: RequestInit): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  const response = await fetch(new URL(path, layApiBaseUrl()), {
    ...options,
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw await taoLoiHttp(response);
  }

  return (await response.json()) as T;
}

function soNguyenTrongKhoang(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

/**
 * Adapter dùng chung cho Mobile/Web trong lúc OpenAPI snapshot chưa được đồng bộ.
 * Tên hàm cố ý khác operationId để không xung đột với client Orval sau khi generate.
 */
export function layTongQuanDiemThuongRuntime(
  options: RequestInit = {},
): Promise<TongQuanDiemThuong> {
  return goiJson<TongQuanDiemThuong>('/api/v1/khach-hang/diem-thuong', options);
}

export function layGiaoDichDiemThuongRuntime(
  params: { trang?: number; gioiHan?: number } = {},
  options: RequestInit = {},
): Promise<DanhSachGiaoDichDiemThuong> {
  const trang = soNguyenTrongKhoang(params.trang ?? 1, 1, Number.MAX_SAFE_INTEGER, 1);
  const gioiHan = soNguyenTrongKhoang(params.gioiHan ?? 20, 1, 50, 20);
  const url = new URL('/api/v1/khach-hang/diem-thuong/giao-dich', layApiBaseUrl());
  url.searchParams.set('trang', String(trang));
  url.searchParams.set('gioiHan', String(gioiHan));

  return goiJson<DanhSachGiaoDichDiemThuong>(`${url.pathname}${url.search}`, options);
}
