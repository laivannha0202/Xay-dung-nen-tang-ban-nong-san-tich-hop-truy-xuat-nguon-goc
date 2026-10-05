/**
 * Chuẩn hoá slug tiếng Việt dùng chung cho Admin/Web/Mobile:
 * - chữ thường
 * - bỏ dấu (đ/Đ → d)
 * - khoảng trắng → '-'
 * - loại ký tự không hợp lệ
 * - gộp nhiều '-' liên tiếp, trim '-'
 */
export function taoSlugTiengViet(giaTri: string): string {
  return giaTri
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
