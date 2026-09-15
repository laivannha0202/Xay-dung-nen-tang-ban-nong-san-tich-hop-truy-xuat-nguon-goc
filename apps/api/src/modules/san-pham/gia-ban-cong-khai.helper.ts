import type { GiaHieuLuc, LoaiGiaHieuLuc } from '../flash-sale/gia-hieu-luc.service';

export type DauVaoBienTheGiaBan = {
  id: string;
  gia: number;
};

export type KetQuaBienTheHieuLuc = {
  bienTheSanPhamId: string;
  giaGoc: number;
  giaHieuLuc: number;
  loaiGia: LoaiGiaHieuLuc;
  dangGiam: boolean;
  phanTramGiam: number | null;
};

export type KetQuaGiaBan = {
  tu: number;
  den: number;
  tienTe: string;
  bienTheDaiDienId: string;
  giaGocDaiDien: number;
  giaHieuLucDaiDien: number;
  loaiGia: LoaiGiaHieuLuc;
  dangGiam: boolean;
  phanTramGiam: number | null;
};

/**
 * Phần trăm giảm chỉ dùng để HIỂN THỊ badge. Không dùng để tính ngược giá sale.
 * Giá sale thật luôn lấy từ GiaHieuLucService.
 */
export function tinhPhanTramGiam(
  giaGoc: number,
  giaHieuLuc: number,
  loaiGia: LoaiGiaHieuLuc,
): number | null {
  if (loaiGia !== 'FLASH_SALE') return null;
  if (!Number.isFinite(giaGoc) || !Number.isFinite(giaHieuLuc)) return null;
  if (!(giaGoc > 0 && giaHieuLuc > 0 && giaHieuLuc < giaGoc)) return null;
  return Math.round(((giaGoc - giaHieuLuc) / giaGoc) * 100);
}

export function toBienTheHieuLuc(
  bienTheId: string,
  giaCatalog: number,
  effective: GiaHieuLuc | undefined,
): KetQuaBienTheHieuLuc {
  // Fallback an toàn: không bao giờ trả giá = 0 do resolver thiếu dữ liệu.
  if (!effective) {
    const giaGoc = Number.isFinite(giaCatalog) && giaCatalog > 0 ? giaCatalog : 0;
    return {
      bienTheSanPhamId: bienTheId,
      giaGoc,
      giaHieuLuc: giaGoc,
      loaiGia: 'NORMAL',
      dangGiam: false,
      phanTramGiam: null,
    };
  }
  const giaGoc = Number(effective.giaGoc) > 0 ? Number(effective.giaGoc) : giaCatalog;
  const giaHieuLuc =
    Number.isFinite(Number(effective.giaHieuLuc)) && Number(effective.giaHieuLuc) > 0
      ? Number(effective.giaHieuLuc)
      : giaGoc;
  const loaiGia: LoaiGiaHieuLuc = effective.loaiGia === 'FLASH_SALE' ? 'FLASH_SALE' : 'NORMAL';
  const phanTramGiam = tinhPhanTramGiam(giaGoc, giaHieuLuc, loaiGia);
  return {
    bienTheSanPhamId: bienTheId,
    giaGoc,
    giaHieuLuc,
    loaiGia: phanTramGiam === null ? 'NORMAL' : loaiGia,
    dangGiam: phanTramGiam !== null,
    phanTramGiam,
  };
}

/**
 * Chọn biến thể đại diện cho card: giaHieuLuc thấp nhất, tie-break id tăng dần
 * để ổn định. Giá hiệu lực và giá gốc của card PHẢI thuộc cùng variant đại diện
 * (không ghép min effective của variant này với min gốc của variant khác).
 */
export function tinhGiaBan(
  bienThes: DauVaoBienTheGiaBan[],
  giaMap: Map<string, GiaHieuLuc>,
): KetQuaGiaBan | null {
  if (bienThes.length === 0) return null;
  const chiTiet = bienThes.map((item) =>
    toBienTheHieuLuc(item.id, Number(item.gia), giaMap.get(item.id)),
  );
  const sapXep = [...chiTiet].sort(
    (a, b) => a.giaHieuLuc - b.giaHieuLuc || (a.bienTheSanPhamId < b.bienTheSanPhamId ? -1 : 1),
  );
  const daiDien = sapXep[0]!;
  const cacGiaHieuLuc = chiTiet.map((item) => item.giaHieuLuc);
  return {
    tu: Math.min(...cacGiaHieuLuc),
    den: Math.max(...cacGiaHieuLuc),
    tienTe: 'VND',
    bienTheDaiDienId: daiDien.bienTheSanPhamId,
    giaGocDaiDien: daiDien.giaGoc,
    giaHieuLucDaiDien: daiDien.giaHieuLuc,
    loaiGia: daiDien.loaiGia,
    dangGiam: daiDien.dangGiam,
    phanTramGiam: daiDien.phanTramGiam,
  };
}
