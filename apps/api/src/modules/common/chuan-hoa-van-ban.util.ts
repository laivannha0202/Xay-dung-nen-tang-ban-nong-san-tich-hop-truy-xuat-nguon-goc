/**
 * Chuẩn hóa văn bản tiếng Việt dùng chung.
 *
 * Trước đây có 4 bản `normalize('NFD')` + strip dấu rải rác ở 4 module
 * (`dia-ban-hung-yen`, `dia-chi-khach-hang`, `giao-hang/pham-vi-giao-hang`,
 * `san-pham/xep-hang-san-pham`). Bản trong `xep-hang-san-pham` từng dùng
 * `\p{Diacritic}` nên **tìm "Đà Lạt" / "Đức Thọ" không bao giờ khớp** —
 * `\p{Diacritic}` không tách được chữ Đ (U+0110) vì đó là ký tự riêng, không
 * phải D + dấu. Sự lặp lại đúng là nơi sinh ra bug đó.
 *
 * Vì vậy toàn bộ phần "bỏ dấu" gom về đây, và phần ghi chú về Đ được giữ lại
 * ngay tại chỗ dễ sót nhất.
 */

/**
 * Bỏ dấu tiếng Việt, giữ nguyên hoa/thường.
 *
 * `\p{Diacritic}` KHÔNG bóc được `đ`/`Đ` (U+0110/U+0111): đó là chữ cách
 * điệu riêng, không phải `D` + dấu nên NFD không tách ra combining mark nào.
 * Phải thay thẳng `đ -> d`, `Đ -> D`.
 *
 * Dấu nống tiếng Việt nằm trong khoảng U+0300–U+036F, không phải toàn bộ
 * `Diacritic` block (U+20D0–U+20FF + U+FE20–U+FE2F là dấu toán học/tu thể).
 */
export function boDauTiengViet(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Khoá tỉnh/thành cho phép so sánh: bỏ dấu, hạ chữ thường, gộp khoảng trắng.
 *
 * Không bỏ tiền tố "Tỉnh"/"Thành phố" vì dùng để so khớp với tên xã/phường
 * (`Xã Kiến Xương`, `Phố Hiến`) — thêm bước đó sẽ làm lệch mục đích.
 */
export function chuanHoaTenDiaBan(value: string): string {
  return boDauTiengViet(value).toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim();
}

/**
 * Tên tỉnh/thành: như trên **và** bỏ tiền tố hành chính.
 *
 * Địa chỉ khách hàng lưu cả "Hưng Yên" lẫn "Tỉnh Hưng Yên" / "Thành phố Hưng
 * Yên" (tùy nguồn dữ liệu). Không bỏ tiền tố thì một địa chỉ hợp lệ bị coi là
 * ngoài phạm vi giao hàng.
 */
export function chuanHoaTenTinh(value: string): string {
  return boDauTiengViet(value)
    .toLocaleLowerCase('vi')
    .replace(/^(tinh|thanh pho)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Khoá tìm kiếm trên văn bản tự do (tên sản phẩm, tên trại, từ khoá).
 *
 * Giữ thứ tự `trim` TRƯỚC `toLocaleLowerCase` như bản gốc để không đổi hành vi.
 */
export function chuanHoaVanBanTimKiem(value: string): string {
  return boDauTiengViet(value).trim().toLocaleLowerCase('vi');
}
