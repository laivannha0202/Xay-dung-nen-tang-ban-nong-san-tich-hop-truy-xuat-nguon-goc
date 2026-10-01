/**
 * Hàm thuần cho dữ liệu địa bàn Hưng Yên.
 *
 * Tách riêng khỏi `api-dia-ban.ts` vì file đó phụ thuộc `@agrimarket/api-client`
 * (generated client), không load được trong test Node thuần. Giữ đúng một nguồn
 * sự thật cho thuật toán chuẩn hoá + nhãn loại xã/phường.
 */

/**
 * `chuanHoaKhongDau` dùng chung nằm trong `@agrimarket/api-client` (`domain-ui`).
 * Bản ở đây chỉ khác ở chỗ gom khoảng trắng + trim trước khi so khớp tên địa danh.
 */
function boDau(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
    .replace(/\s+/g, ' ')
    .trim();
}

export const TINH_HUNG_YEN = 'Hưng Yên';

/**
 * Chuẩn hoá chuỗi để tìm kiếm không dấu, ví dụ:
 *   "Kiến Xương" -> "kien xuong"
 *   "Đức Thọ"    -> "duc tho"
 */
export function chuanHoaTenDiaBanMobile(value: string): string {
  return boDau(value);
}

/**
 * Nhãn hiển thị cho xã/phường — cùng semantics với Customer Web
 * (`nhanLoaiXaPhuong` trong `apps/customer-web/src/lib/api-dia-ban-hung-yen.ts`).
 */
export function nhanLoaiXaPhuongMobile(loai: string): string {
  return loai === 'PHUONG' ? 'Phường' : 'Xã';
}
