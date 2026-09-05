export const TRONG_SO_XEP_HANG_SAN_PHAM = {
  text: 0.4,
  stock: 0.2,
  freshness: 0.15,
  rating: 0.15,
  distance: 0.1,
} as const;

export type ViTriXepHang = {
  viDo: number;
  kinhDo: number;
};

export type DuLieuXepHangSanPham = {
  ten: string;
  tuKhoa: string | null;
  soLuongKhaDung: number;
  ngayThuHoachGanNhat: Date | null;
  diemDanhGiaTrungBinh: number | null;
  viTriTrangTrai: ViTriXepHang | null;
  viTriNguoiDung: ViTriXepHang | null;
  bayGio?: Date;
};

export type ChiTietDiemXepHang = {
  text: number;
  stock: number;
  freshness: number;
  rating: number;
  distance: number;
  tong: number;
};

const DIEM_TRUNG_TINH = 0.5;
const BAN_KINH_TRAI_DAT_KM = 6371;

function gioiHan01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lamTron(value: number): number {
  return Number(value.toFixed(6));
}

function chuanHoaVanBan(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLocaleLowerCase('vi');
}

function diemText(ten: string, tuKhoa: string | null): number {
  const keyword = tuKhoa ? chuanHoaVanBan(tuKhoa) : '';
  if (!keyword) return DIEM_TRUNG_TINH;

  const name = chuanHoaVanBan(ten);
  if (name === keyword) return 1;
  if (name.startsWith(keyword)) return 0.9;
  if (name.includes(keyword)) return 0.7;
  return 0;
}

function diemStock(soLuongKhaDung: number): number {
  if (soLuongKhaDung <= 0) return 0;
  return gioiHan01(Math.log10(1 + soLuongKhaDung) / Math.log10(21));
}

function diemFreshness(ngayThuHoachGanNhat: Date | null, bayGio: Date): number {
  if (!ngayThuHoachGanNhat) return DIEM_TRUNG_TINH;

  const motNgayMs = 24 * 60 * 60 * 1000;
  const soNgay = Math.max(
    0,
    Math.floor((bayGio.getTime() - ngayThuHoachGanNhat.getTime()) / motNgayMs),
  );

  if (soNgay <= 7) return 1;
  if (soNgay <= 30) return 0.85;
  if (soNgay <= 90) return 0.6;
  if (soNgay <= 180) return 0.35;
  return 0.15;
}

function diemRating(diemDanhGiaTrungBinh: number | null): number {
  if (diemDanhGiaTrungBinh === null) {
    return DIEM_TRUNG_TINH;
  }
  return gioiHan01(diemDanhGiaTrungBinh / 5);
}

function radian(value: number): number {
  return (value * Math.PI) / 180;
}

export function khoangCachHaversineKm(a: ViTriXepHang, b: ViTriXepHang): number {
  const dLat = radian(b.viDo - a.viDo);
  const dLon = radian(b.kinhDo - a.kinhDo);
  const lat1 = radian(a.viDo);
  const lat2 = radian(b.viDo);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const centralAngle = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return BAN_KINH_TRAI_DAT_KM * centralAngle;
}

function diemDistance(
  viTriTrangTrai: ViTriXepHang | null,
  viTriNguoiDung: ViTriXepHang | null,
): number {
  if (!viTriTrangTrai || !viTriNguoiDung) {
    return DIEM_TRUNG_TINH;
  }

  const km = khoangCachHaversineKm(viTriNguoiDung, viTriTrangTrai);

  if (km <= 10) return 1;
  if (km <= 50) return 0.85;
  if (km <= 150) return 0.6;
  if (km <= 300) return 0.35;
  return 0.15;
}

export function tinhDiemXepHangSanPham(input: DuLieuXepHangSanPham): ChiTietDiemXepHang {
  const text = diemText(input.ten, input.tuKhoa);
  const stock = diemStock(input.soLuongKhaDung);
  const freshness = diemFreshness(input.ngayThuHoachGanNhat, input.bayGio ?? new Date());
  const rating = diemRating(input.diemDanhGiaTrungBinh);
  const distance = diemDistance(input.viTriTrangTrai, input.viTriNguoiDung);

  const tong =
    text * TRONG_SO_XEP_HANG_SAN_PHAM.text +
    stock * TRONG_SO_XEP_HANG_SAN_PHAM.stock +
    freshness * TRONG_SO_XEP_HANG_SAN_PHAM.freshness +
    rating * TRONG_SO_XEP_HANG_SAN_PHAM.rating +
    distance * TRONG_SO_XEP_HANG_SAN_PHAM.distance;

  return {
    text: lamTron(text),
    stock: lamTron(stock),
    freshness: lamTron(freshness),
    rating: lamTron(rating),
    distance: lamTron(distance),
    tong: lamTron(tong),
  };
}
