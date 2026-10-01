/**
 * Hàm toán tiền / số lượng / ngày dùng chung.
 *
 * Trước đây mỗi service tự định nghĩa bản riêng:
 * - `tien()`  xuất hiện ở 5 file với 2 cách làm tròn khác nhau
 *   (`Number(x.toFixed(2))` và `Math.round((x + EPSILON) * 100) / 100`).
 *   Hai cách cho khác kết quả ở các số bị biểu diễn sai, ví dụ `1.005`:
 *   `toFixed(2)` ra `"1.00"` còn cách kia ra `1.01` -> checkout và dashboard
 *   lệch nhau 1 cent.
 * - `soLuong()` 3 bản, `homNay()` 6 bản, `toCents()` 4 bản — cùng nội dung.
 *
 * Nay tất cả trỏ về đây để chỉ có một nguồn sự thật.
 */

/**
 * Làm tròn về 2 chữ số thập phân (tiền VND, tỷ lệ).
 *
 * Vài sao không dùng `Number(x.toFixed(2))`:
 * 1. `toFixed` dính lỗi biểu diễn: `1.005` thực ra là `1.0049999...` nên ra
 *    `"1.00"`.
 * 2. `Math.round(x * 100)` thì đối xứng hơn nhưng lại dính lỗi trên.
 *
 * Vì sao không dùng `Math.round((x + Number.EPSILON) * 100) / 100`:
 * cộng EPSILON là lệch theo dấu, nên với số âm lại quay về lỗi cũ
 * (`-1.005` ra `-1.00` thay vì `-1.01`). Tiền trong hệ thống này có thể âm
 * (hoàn tiền, điều chỉnh đối soát) nên phải làm tròn đối xứng.
 *
 * Cách dùng đây: làm tròn trên trị tuyệt đối rồi gắn lại dấu.
 */
export function lamTronTien(value: number): number {
  const dau = value < 0 ? -1 : 1;
  return dau * (Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100);
}

/** Làm tròn về 3 chữ số thập phân (khối lượng nông sản theo quy cách). */
export function lamTronSoLuong(value: number): number {
  const dau = value < 0 ? -1 : 1;
  return dau * (Math.round((Math.abs(value) + Number.EPSILON) * 1000) / 1000);
}

/** Đổi đơn vị tiền sang cent để so sánh bằng số nguyên (tránh lệch float). */
export function toCent(value: number): number {
  return Math.round(value * 100);
}

/** Đổi cent về lại đơn vị tiền. */
export function fromCent(value: number): number {
  return lamTronTien(value / 100);
}

/**
 * Mốc bắt đầu ngày theo múi giờ server, biểu diễn ở UTC.
 *
 * Dùng `getFullYear/getMonth/getDate` (giờ địa phương) chứ không phải bản
 * `getUTC*`. Server chạy ở Asia/Ho_Chi_Minh nên bản UTC lệch 7 giờ và làm
 * lô tồn kho bị đánh giá sai ngày ở ranh giới 0h.
 */
export function homNay(bayGio = new Date()): Date {
  return new Date(Date.UTC(bayGio.getFullYear(), bayGio.getMonth(), bayGio.getDate()));
}
