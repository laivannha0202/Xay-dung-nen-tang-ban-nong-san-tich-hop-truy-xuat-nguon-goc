import { layApiBaseUrl } from './runtime';

export type SanPhamGoiYTomTat = {
  id: string;
  ten: string;
  moTa: string | null;
  danhMuc: { id: string; ten: string; slug: string };
  trangTrai: { id: string; ma: string; ten: string; diaChi: string };
  gia: { tu: number; den: number; tienTe: string };
  quyCach: { khoiLuong: number; donVi: string };
  anhBiaUrl: string | null;
  chungNhan: Array<{ loai: string; ma: string; donViCap: string; ngayHetHan: string }>;
  khaDung: {
    coGia: boolean;
    soLuongKhaDung: number;
    coTheDatHang: boolean;
    lyDo: string;
  };
};

export type MucGoiYSanPham = {
  sanPham: SanPhamGoiYTomTat;
  diem: number;
  thanhPhan: {
    phoBien: number;
    danhMuc: number;
    trangTrai: number;
  };
};

export type DanhSachGoiYSanPham = {
  chienLuoc: 'HYBRID_AFFINITY_V1' | 'MOST_POPULAR_90D';
  caNhanHoa: boolean;
  duLieu: MucGoiYSanPham[];
  tong: number;
};

export type LoiHttpApiClient = Error & {
  status: number;
  data?: unknown;
};

function gioiHanHopLe(value: number): number {
  if (!Number.isFinite(value)) return 8;
  return Math.min(20, Math.max(1, Math.trunc(value)));
}

async function taoLoiHttp(response: Response): Promise<LoiHttpApiClient> {
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    try {
      data = await response.text();
    } catch {
      data = undefined;
    }
  }

  const error = new Error(`Yêu cầu không thành công (HTTP ${response.status}).`) as LoiHttpApiClient;
  error.name = 'LoiHttpApiClient';
  error.status = response.status;
  error.data = data;
  return error;
}

/**
 * Adapter typed tạm thời ở biên API client để Web/Mobile không gọi fetch trong screen.
 * Tên hàm cố ý khác operationId `layGoiYSanPhamCuaToi` để không xung đột khi Orval
 * sinh operation này từ OpenAPI snapshot mới.
 */
export async function layGoiYSanPhamRuntime(
  gioiHan = 8,
  options: RequestInit = {},
): Promise<DanhSachGoiYSanPham> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  const url = new URL('/api/v1/khach-hang/goi-y', layApiBaseUrl());
  url.searchParams.set('gioiHan', String(gioiHanHopLe(gioiHan)));

  const response = await fetch(url, {
    ...options,
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw await taoLoiHttp(response);
  }

  return (await response.json()) as DanhSachGoiYSanPham;
}
