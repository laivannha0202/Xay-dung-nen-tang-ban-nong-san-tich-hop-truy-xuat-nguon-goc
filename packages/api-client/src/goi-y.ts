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

function gioiHanHopLe(value: number): number {
  if (!Number.isFinite(value)) return 8;
  return Math.min(20, Math.max(1, Math.trunc(value)));
}

/**
 * Client typed cho Recommendation runtime. Hàm này nằm trong package API client
 * để Web/Mobile không tự gọi fetch trong screen. Khi OpenAPI snapshot được sinh
 * lại, contract server vẫn giữ cùng operationId `layGoiYSanPhamCuaToi`.
 */
export async function layGoiYSanPhamCuaToi(
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
    throw new Error(`Không tải được gợi ý sản phẩm (HTTP ${response.status}).`);
  }

  return (await response.json()) as DanhSachGoiYSanPham;
}
