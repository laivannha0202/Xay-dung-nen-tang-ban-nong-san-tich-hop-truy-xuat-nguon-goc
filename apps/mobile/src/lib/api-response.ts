/**
 * Chuẩn hóa HTTP response wrapper do Orval sinh ra.
 *
 * Orval của dự án đang bật includeHttpResponseReturnType=true nên một số API
 * trả { data, status, headers }, trong khi adapter Mobile chỉ cần phần data.
 */
export type DuLieuHttp<T> = T extends { data: infer D } ? D : T;

export function duLieuApi<T>(response: T): DuLieuHttp<T> {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as { data: DuLieuHttp<T> }).data;
  }

  return response as DuLieuHttp<T>;
}
