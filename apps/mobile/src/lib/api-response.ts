/**
 * Re-export từ `@agrimarket/api-client` để giữ nguyên đường dẫn import cũ.
 *
 * Trước đây đây là một bản `duLieuApi` riêng của Mobile; nay dùng chung
 * `duLieu` với Customer Web và Admin Web.
 */
import { duLieu } from '@agrimarket/api-client';

export { duLieu, type DuLieuHttp } from '@agrimarket/api-client';

/** Tên cũ do các module Mobile đang dùng, giữ alias để không phải sửa hàng loạt. */
export const duLieuApi = duLieu;
