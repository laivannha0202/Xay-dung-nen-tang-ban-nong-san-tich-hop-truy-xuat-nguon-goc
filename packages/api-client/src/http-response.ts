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

type LoiApiCoInfo = {
  message?: unknown;
  info?: unknown;
  status?: unknown;
  response?: unknown;
};

function trichChuoiThongDiep(value: unknown): string[] {
  if (typeof value === 'string') {
    const text = value.trim();
    return text ? [text] : [];
  }
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function trichTuBanGhi(record: Record<string, unknown>): string[] {
  const out: string[] = [];
  out.push(...trichChuoiThongDiep(record.message));
  out.push(...trichChuoiThongDiep(record.error));
  return out;
}

/**
 * Trích thông điệp lỗi thân thiện từ Error do api-client sinh ra.
 *
 * Orval generated client throw `new Error()` RỖNG và gắn body vào
 * `err.info` + `err.status`, nên `error.message` luôn trống và Admin
 * chỉ hiện fallback chung (hoặc im lặng). Helper này bóc `info.message`
 * (string | string[]) để backend message như "Slug này đã được sử dụng."
 * hiển thị đúng. Không lộ stack/raw object.
 */
export function trichThongDiepLoiApi(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const record = error as LoiApiCoInfo & Record<string, unknown>;
    const candidates: string[] = [];
    if (typeof record.info !== 'undefined') {
      if (typeof record.info === 'object' && record.info !== null) {
        candidates.push(...trichTuBanGhi(record.info as Record<string, unknown>));
      } else {
        candidates.push(...trichChuoiThongDiep(record.info));
      }
    }
    if (typeof record.response === 'object' && record.response !== null) {
      const response = record.response as Record<string, unknown>;
      const data = response.data;
      if (typeof data === 'object' && data !== null) {
        candidates.push(...trichTuBanGhi(data as Record<string, unknown>));
      }
    }
    candidates.push(...trichChuoiThongDiep(record.message));
    const hopLe = candidates.map((item) => item.trim()).filter(Boolean);
    if (hopLe.length > 0) return hopLe.join(', ');
  }
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
}
