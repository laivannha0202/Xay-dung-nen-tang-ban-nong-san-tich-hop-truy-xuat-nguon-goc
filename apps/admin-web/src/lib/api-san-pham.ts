'use client';

import {
  duLieu,
  capNhatSanPham,
  doiTrangThaiSanPham,
  layApiBaseUrl,
  layChiTietSanPham,
  layDanhSachAnhSanPham,
  layDanhSachBienTheSanPham,
  layDanhSachDanhMucSanPham,
  layDanhSachSanPham,
  layDanhSachTrangTrai,
  datAnhBiaSanPham,
  taoSanPham,
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

export async function layAnhSanPham(sanPhamId: string) {
  const response = await layDanhSachAnhSanPham(sanPhamId, bearerOptions());
  return duLieu(response);
}

export async function datAnhBia(sanPhamId: string, id: string) {
  const response = await datAnhBiaSanPham(sanPhamId, id, bearerOptions());
  return duLieu(response);
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

export async function layDanhSachCongKhaiChoAdmin(): Promise<SanPhamCongKhaiChoAdmin[]> {
  const tatCa: SanPhamCongKhaiChoAdmin[] = [];
  let trang = 1;
  const gioiHan = 100;

  while (true) {
    const response = await fetch(
      `${layApiBaseUrl()}/api/v1/san-pham-cong-khai?trang=${trang}&gioiHan=${gioiHan}`,
      {
        credentials: 'include',
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      throw new Error(`Không tải được dữ liệu giá/tồn sản phẩm (${response.status}).`);
    }

    const body = (await response.json()) as DanhSachCongKhaiChoAdmin;
    tatCa.push(...body.duLieu);

    if (tatCa.length >= body.tong || body.duLieu.length === 0) {
      return tatCa;
    }

    trang += 1;
  }
}
