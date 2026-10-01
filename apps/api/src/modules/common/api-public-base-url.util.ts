import type { ConfigService } from '@nestjs/config';

/**
 * Nguồn sự thật DUY NHẤT cho base URL công khai của API ở phía server.
 *
 * Vì sao cần file này
 * -------------------
 * `TepTinService` từng nội tuyến `http://127.0.0.1:3000/api/v1/products/...`
 * cho ảnh catalog seed. Ở dev máy dev thì đúng, nhưng ở môi trường deploy
 * (domain khác, cổng khác, HTTPS) API trả URL trỏ về loopback của chính máy
 * chạy backend -> browser khách hàng không tải được ảnh. Đó là P1 thật, không
 * phải chuyện "cho đẹp code".
 *
 * Vì sao KHÔNG dùng lại `PAYMENT_PUBLIC_BASE_URL`
 * -----------------------------------------------
 * Biến đó có semantic riêng: base dùng để ký return URL VNPay. Dùng chung
 * cho ảnh sẽ khiến một deploy đổi domain payment là hỏng luôn ảnh sản phẩm.
 * Tách `API_PUBLIC_BASE_URL` riêng.
 *
 * Hợp đồng:
 *   - luôn trả về base KHÔNG có dấu `/` cuối;
 *   - `tenFile` luôn được `encodeURIComponent` (tên file có khoảng trắng / ký
 *     tự tiếng Việt / dấu `/` không phá URL);
 *   - không bao giờ sinh `//` ở giữa;
 *   - chưa cấu hình -> fallback `http://127.0.0.1:3000` để dev không phải cấu
 *     hình gì cả;
 *   - cấu hình SAI -> ném lỗi, KHÔNG âm thầm rơi về localhost. Rơi về
 *     localhost trong production chính là bug P1 này quay lại, chỉ khác chỗ nó
 *     nằm trong log thay vì trong code.
 */

/** Base dùng khi chưa cấu hình. Trùng với fallback của `api-client`. */
export const API_PUBLIC_BASE_URL_MAC_DINH = 'http://127.0.0.1:3000';

/** Tên biến môi trường — dùng cho thông báo lỗi và tài liệu. */
export const TEN_BIEN_API_PUBLIC_BASE_URL = 'API_PUBLIC_BASE_URL';

/** Đường dẫn ảnh catalog công khai (xem `TepTinServeController`). */
export const DUONG_DAN_ANH_SANPHAM_CONG_KHAI = '/api/v1/products';

/** Đường dẫn phục vụ file trong `FILE_STORAGE_MODE=memory` (chỉ dùng cho e2e). */
export const DUONG_DAN_E2E_FILE = '/api/v1/__e2e-files';

/**
 * Chuẩn hoá base URL công khai: bỏ khoảng trắng thừa và mọi dấu `/` cuối.
 *
 * - Rỗng/không set -> `http://127.0.0.1:3000` (dev không cần cấu hình gì).
 * - Có giá trị nhưng không phải `http(s)://...` có host -> ném lỗi.
 */
export function chuanHoaApiPublicBaseUrl(giaTri?: string | null): string {
  const raw = (giaTri ?? '').trim();

  if (!raw) {
    return API_PUBLIC_BASE_URL_MAC_DINH;
  }

  const khongSlashCuoi = raw.replace(/\/+$/, '');

  // Chỉ toàn dấu `/` -> coi như chưa cấu hình, không phải cấu hình sai.
  if (!khongSlashCuoi) {
    return API_PUBLIC_BASE_URL_MAC_DINH;
  }

  const khop = /^https?:\/\//i.exec(khongSlashCuoi);
  const host = khop ? khongSlashCuoi.slice(khop[0].length) : '';

  if (!host) {
    throw new Error(
      `${TEN_BIEN_API_PUBLIC_BASE_URL} không hợp lệ: "${raw}". ` +
        'Phải là URL tuyệt đối http:// hoặc https:// có host, ví dụ ' +
        'API_PUBLIC_BASE_URL=https://api.example.com. ' +
        'Bỏ trống nếu chạy local (mặc định ' +
        `${API_PUBLIC_BASE_URL_MAC_DINH}).`,
    );
  }

  return khongSlashCuoi;
}

/**
 * Dựng URL công khai từ base đã chuẩn hoá + đường dẫn + tên file đã encode.
 * Tách riêng để test được phần "không double slash / không còn slash cuối"
 * mà không cần dựng ConfigService của Nest.
 */
export function taoUrlCongKhai(
  baseUrl: string | null | undefined,
  duongDan: string,
  tenFile: string,
  truyVan?: string,
): string {
  const base = chuanHoaApiPublicBaseUrl(baseUrl);
  const duongDanSach = `/${duongDan.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  const tenDaEncode = encodeURIComponent(tenFile);
  const truyVanSach = (truyVan ?? '').replace(/^\?/, '');

  return `${base}${duongDanSach}/${tenDaEncode}${truyVanSach ? `?${truyVanSach}` : ''}`;
}

/** URL ảnh catalog seed, ví dụ `.../api/v1/products/rau-muong.jpg?v=photo-v3`. */
export function taoUrlAnhSanPhamCongKhai(
  baseUrl: string | null | undefined,
  tenFile: string,
  phienTienIch = 'photo-v3',
): string {
  return taoUrlCongKhai(
    baseUrl,
    DUONG_DAN_ANH_SANPHAM_CONG_KHAI,
    tenFile,
    phienTienIch ? `v=${phienTienIch}` : undefined,
  );
}

/** URL file trong bộ nhớ e2e, ví dụ `.../api/v1/__e2e-files/<id>`. */
export function taoUrlE2eFile(baseUrl: string | null | undefined, id: string): string {
  return taoUrlCongKhai(baseUrl, DUONG_DAN_E2E_FILE, id);
}

/**
 * Helper DUY NHẤT mọi service dùng để đọc base URL công khai.
 *
 * Chỉ nhận `get()` (structural type) nên unit test không cần dựng Nest
 * container. Đây là điểm gọi duy nhất đọc `API_PUBLIC_BASE_URL` trong toàn bộ
 * backend — thêm chỗ đọc biến này ở nơi khác là sai.
 */
export function layApiPublicBaseUrl(configService: Pick<ConfigService, 'get'>): string {
  return chuanHoaApiPublicBaseUrl(configService.get<string>(TEN_BIEN_API_PUBLIC_BASE_URL));
}
