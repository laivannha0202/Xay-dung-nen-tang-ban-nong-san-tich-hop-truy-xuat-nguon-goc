/**
 * Chuẩn hóa HTTP response wrapper do Orval sinh ra.
 *
 * Orval của dự án đang bật includeHttpResponseReturnType=true nên một số API
 * trả { data, status, headers }, trong khi adapter chỉ cần phần data.
 *
 * Trước đây mỗi app tự copy một bản `duLieu` (44 bản trước khi gộp). Bản này là
 * nguồn duy nhất cho cả Customer Web, Admin Web và Mobile.
 */

export type DuLieuHttp<T> = T extends { data: infer D } ? D : T;

export type HttpResponse<T> = { data: T };

/** Bóc phần `data` khỏi response Orval, giữ nguyên giá trị nếu không bọc. */
export function duLieu<T>(response: T | HttpResponse<T>): DuLieuHttp<T> {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<DuLieuHttp<T>>).data;
  }

  return response as DuLieuHttp<T>;
}
