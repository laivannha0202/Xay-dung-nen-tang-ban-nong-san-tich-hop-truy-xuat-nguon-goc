/** Formatter hiển thị dùng chung cho toàn bộ Admin. */

const tienVND = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const soLuongVN = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });

const phanTramVN = new Intl.NumberFormat('vi-VN', {
  style: 'percent',
  maximumFractionDigits: 1,
});

/** 356.000 ₫ — format tiền duy nhất của Admin. */
export function dinhDangTien(value: number | string): string {
  return tienVND.format(Number(value));
}

/** 06/10/2026 */
export function dinhDangNgay(value: string | Date): string {
  return new Date(value).toLocaleDateString('vi-VN');
}

/** 06/10/2026 14:30 */
export function dinhDangNgayGio(value: string | Date): string {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 12,5% — nhận tỉ lệ 0..1. */
export function dinhDangPhanTram(tiLe: number | string): string {
  return phanTramVN.format(Number(tiLe));
}

/** Số lượng tối đa 3 chữ số thập phân. */
export function dinhDangSoLuong(value: number | string): string {
  return soLuongVN.format(Number(value));
}
