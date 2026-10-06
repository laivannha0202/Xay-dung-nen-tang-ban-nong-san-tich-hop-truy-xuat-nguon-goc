'use client';

import {
  duLieu,
  capNhatBienTheSanPham,
  capNhatSanPham,
  doiTrangThaiSanPham,
  ganNhieuAnhSanPham,
  layApiBaseUrl,
  layChiTietSanPham,
  layDanhSachAnhSanPham,
  layDanhSachBienTheSanPham,
  layDanhSachDanhMucSanPham,
  layDanhSachSanPham,
  layDanhSachTrangTrai,
  datAnhBiaSanPham,
  taoBienTheSanPham,
  taoSanPham,
  xoaAnhSanPham as xoaAnhSanPhamApi,
} from '@agrimarket/api-client';

import { bearerOptions } from './phien-dang-nhap-admin';

// `chuanHoaUrlAnhAdmin` từng bị copy-paste ở cả hai file. Giữ MỘT bản duy nhất
// trong `./url-anh-admin` và re-export tại đây để các import cũ
// (`from '@/lib/api-san-pham'`) tiếp tục chạy đúng, không đổi chữ ký.
export { chuanHoaUrlAnhAdmin } from './url-anh-admin';

export async function layDanhSach(params: Parameters<typeof layDanhSachSanPham>[0]) {
  const response = await layDanhSachSanPham(params, bearerOptions());

  return duLieu(response);
}

export async function layChiTiet(id: string) {
  const response = await layChiTietSanPham(id, bearerOptions());

  return duLieu(response);
}

export async function taoMoi(body: Parameters<typeof taoSanPham>[0]) {
  const response = await taoSanPham(body, bearerOptions());

  return duLieu(response);
}

export async function capNhat(id: string, body: Parameters<typeof capNhatSanPham>[1]) {
  const response = await capNhatSanPham(id, body, bearerOptions());

  return duLieu(response);
}

export async function doiTrangThai(id: string, trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG') {
  const response = await doiTrangThaiSanPham(
    id,
    {
      trangThai,
    },
    bearerOptions(),
  );

  return duLieu(response);
}

export async function layTrangTraiHoatDong() {
  const response = await layDanhSachTrangTrai(
    {
      trang: 1,
      gioiHan: 100,
      trangThai: 'HOAT_DONG',
    },
    bearerOptions(),
  );

  return duLieu(response);
}

export async function layDanhMucHoatDong() {
  const response = await layDanhSachDanhMucSanPham(
    {
      trang: 1,
      gioiHan: 100,
      trangThai: 'HOAT_DONG',
    },
    bearerOptions(),
  );

  return duLieu(response);
}

export async function layBienThe(sanPhamId: string) {
  const response = await layDanhSachBienTheSanPham(sanPhamId, bearerOptions());

  return duLieu(response);
}

export async function taoBienThe(
  sanPhamId: string,
  body: Parameters<typeof taoBienTheSanPham>[1],
) {
  const response = await taoBienTheSanPham(sanPhamId, body, bearerOptions());

  return duLieu(response);
}

export async function capNhatBienThe(
  sanPhamId: string,
  id: string,
  body: Parameters<typeof capNhatBienTheSanPham>[2],
) {
  const response = await capNhatBienTheSanPham(sanPhamId, id, body, bearerOptions());

  return duLieu(response);
}

export async function layAnhSanPham(sanPhamId: string) {
  const response = await layDanhSachAnhSanPham(sanPhamId, bearerOptions());
  return duLieu(response);
}

export async function datAnhBia(sanPhamId: string, id: string) {
  const response = await datAnhBiaSanPham(sanPhamId, id, bearerOptions());
  return duLieu(response);
}

export async function ganAnhSanPham(sanPhamId: string, tepTinIds: string[]) {
  const response = await ganNhieuAnhSanPham(sanPhamId, { tepTinIds }, bearerOptions());
  return duLieu(response);
}

export async function xoaAnhSanPham(sanPhamId: string, id: string) {
  const response = await xoaAnhSanPhamApi(sanPhamId, id, bearerOptions());
  return duLieu(response);
}

export async function taiAnhSanPham(file: File): Promise<{
  id: string;
  tenGoc: string;
  mimeType: string;
}> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.');
  }

  const form = new FormData();
  form.append('tep', file);

  const auth = bearerOptions();
  const headers = new Headers(auth.headers);

  const response = await fetch(`${layApiBaseUrl()}/api/v1/tep-tin/tai-len`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: form,
  });

  if (!response.ok) {
    let thongBao = 'Không tải được ảnh sản phẩm.';

    try {
      const body = (await response.json()) as {
        message?: string | string[];
      };

      if (Array.isArray(body.message)) {
        thongBao = body.message.join(', ');
      } else if (body.message) {
        thongBao = body.message;
      }
    } catch {
      // Giữ thông báo mặc định.
    }

    throw new Error(thongBao);
  }

  const result = (await response.json()) as {
    id: string;
    tenGoc: string;
    mimeType: string;
  };

  if (!result.mimeType.startsWith('image/')) {
    throw new Error('File tải lên không phải ảnh.');
  }

  return result;
}

export type SanPhamCongKhaiChoAdmin = {
  id: string;
  ten: string;
  gia: {
    tu: number;
    den: number;
    tienTe: string;
  };
  quyCach: {
    khoiLuong: number;
    donVi: string;
  };
  anhBiaUrl: string | null;
  khaDung: {
    coGia: boolean;
    soLuongKhaDung: number;
    coTheDatHang: boolean;
    lyDo: string;
  };
};

type DanhSachCongKhaiChoAdmin = {
  duLieu: SanPhamCongKhaiChoAdmin[];
  tong: number;
  trang: number;
  gioiHan: number;
};

/** AGRIMARKET-ADMIN-REQUEST-WATERFALL-V1 */
const SO_TRANG_CHIA_NHIEU = 100;
/** Chạy song song có kiểm soát: đổi waterfall thành vài chặng thay vì N lần tuần tự. */
const SO_TRANG_SONG_SONG = 6;
/** Trần an toàn để một catalog khổng lồ không biến trang thành vòng lặp vô hạn. */
const SO_TRANG_TOI_DA = 30;

async function taiTrangCongKhai(trang: number): Promise<DanhSachCongKhaiChoAdmin> {
  // `sapXep=TEN_AZ` là nhánh orderBy DB trong service (ten asc, id asc): nhanh,
  // và ổn định giữa các trang — phân trang mặc định 'PHU_HOP' không bảo đảm
  // thứ tự nên có thể lặp/mất dòng giữa các lần gọi.
  const response = await fetch(
    `${layApiBaseUrl()}/api/v1/san-pham-cong-khai` +
      `?trang=${trang}&gioiHan=${SO_TRANG_CHIA_NHIEU}&sapXep=TEN_AZ`,
    {
      credentials: 'include',
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(`Không tải được dữ liệu giá/tồn sản phẩm (${response.status}).`);
  }

  return (await response.json()) as DanhSachCongKhaiChoAdmin;
}

/**
 * Bản đồ tra cứu (ảnh bìa / giá / tồn kho công khai) cho trang quản lý sản phẩm.
 *
 * Trước đây là `while (true)` gọi TUẦN TỰ từng trang: 500 sản phẩm = 5 round
 * trip nối tiếp, 5000 sản phẩm = 50 round trip nối tiếp ⇒ bảng sản phẩm đứng
 * hình vài chục giây. Nay đọc trang 1 để biết `tong`, rồi tải các trang còn
 * lại SONG SONG theo lô.
 *
 * Giới hạn: bảng Admin dùng phân trang server (ProTable `trang`/`gioiHan`,
 * `total` từ API) nên chỉ cần trang hiện tại; map công khai này chỉ để làm
 * giàu (giá/ảnh/tồn) các dòng đang hiển thị. `SO_TRANG_TOI_DA` (30 × 100 =
 * 3000) là trần an toàn chống vòng lặp vô hạn, KHÔNG phải silent truncation:
 * khi `tong` vượt trần, hàm ghi `console.warn` để không âm thầm thiếu dữ
 * liệu. Số liệu "Hết hàng" luôn lấy từ server count
 * (`demSanPhamCongKhaiHetHang`), không phụ thuộc map này.
 */
export async function layDanhSachCongKhaiChoAdmin(): Promise<SanPhamCongKhaiChoAdmin[]> {
  const dau = await taiTrangCongKhai(1);
  const tatCa: SanPhamCongKhaiChoAdmin[] = [...dau.duLieu];

  const tongTrangThat = Math.ceil(dau.tong / SO_TRANG_CHIA_NHIEU);
  const tongTrang = Math.min(tongTrangThat, SO_TRANG_TOI_DA);
  if (tongTrangThat > SO_TRANG_TOI_DA) {
    // Không cắt âm thầm: báo rõ để vận hành biết map làm giàu chỉ phủ
    // SO_TRANG_TOI_DA trang đầu (dòng ngoài phạm vi hiện "—", không sai số).
    console.warn(
      `[AgriMarket Admin] Catalog công khai (${dau.tong} sản phẩm, ${tongTrangThat} trang) ` +
        `vượt trần tải client ${SO_TRANG_TOI_DA} trang — chỉ tải ${SO_TRANG_TOI_DA * SO_TRANG_CHIA_NHIEU} mục đầu. ` +
        `Bảng/phân trang vẫn đúng vì dùng server pagination + total.`,
    );
  }
  const trangConLai = Array.from({ length: Math.max(tongTrang - 1, 0) }, (_, i) => i + 2);

  for (let i = 0; i < trangConLai.length; i += SO_TRANG_SONG_SONG) {
    const nhom = trangConLai.slice(i, i + SO_TRANG_SONG_SONG);
    const ketQua = await Promise.all(nhom.map(taiTrangCongKhai));
    for (const trangData of ketQua) {
      tatCa.push(...trangData.duLieu);
    }
  }

  return tatCa;
}

/**
 * Số sản phẩm hết hàng — để backend đếm (`khaDung=HET_HANG`, `gioiHan=1`).
 * Trước đây phải tải TOÀN BỘ catalog về rồi `filter` ở trình duyệt.
 */
export async function demSanPhamCongKhaiHetHang(): Promise<number> {
  const response = await fetch(
    `${layApiBaseUrl()}/api/v1/san-pham-cong-khai` +
      `?trang=1&gioiHan=1&sapXep=TEN_AZ&khaDung=HET_HANG`,
    {
      credentials: 'include',
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(`Không tải được số sản phẩm hết hàng (${response.status}).`);
  }

  const body = (await response.json()) as DanhSachCongKhaiChoAdmin;
  return body.tong;
}
