import { randomBytes } from 'node:crypto';

/**
 * Sinh mã nghiệp vụ dễ đọc, server-side, unique theo DB unique constraint.
 * Không dùng index DB đơn giản gây race: caller phải catch P2002 và retry với mã mới.
 * UUID vẫn giữ làm PK/FK, mã này chỉ để hiển thị/tìm kiếm.
 */

function ngayHomNayYYYYMMDD(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function hauToNgauNhien(doDai = 6): string {
  // Hex upper, không gây nhầm lẫn quá mức, đủ entropy cho retry + unique DB.
  return randomBytes(Math.ceil(doDai / 2))
    .toString('hex')
    .toUpperCase()
    .slice(0, doDai);
}

export function taoMaKhachHang(date = new Date()): string {
  return `KH-${ngayHomNayYYYYMMDD(date)}-${hauToNgauNhien(6)}`;
}

export function taoMaKhieuNai(date = new Date()): string {
  return `KN-${ngayHomNayYYYYMMDD(date)}-${hauToNgauNhien(6)}`;
}

/**
 * Giữ tương thích: maDonHang hiện tại = 'ORD-' + hex của maYeuCau (UUID idempotency key).
 * Tách khái niệm ở schema bằng DonHang.maYeuCau UNIQUE riêng, nhưng format maDonHang
 * được giữ nguyên để không phá compatibility/fixtures. Không thay đổi chỉ vì thẩm mỹ.
 */
export function maDonHangTuMaYeuCau(maYeuCau: string): string {
  return 'ORD-' + maYeuCau.replaceAll('-', '').toUpperCase();
}

/**
 * Backfill/kiểm thử: khôi phục UUID maYeuCau từ maDonHang dạng ORD-<32hex>.
 * Trả null nếu không đúng format (order tạo trực tiếp với mã tự do).
 */
export function khoiPhucMaYeuCauTuMaDonHang(maDonHang: string): string | null {
  const hex = maDonHang.startsWith('ORD-') ? maDonHang.slice(4) : null;
  if (!hex || hex.length !== 32 || !/^[0-9A-Fa-f]{32}$/.test(hex)) return null;
  const h = hex.toLowerCase();
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

export function laLoiUniquePrisma(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  return (error as { code?: unknown }).code === 'P2002';
}
