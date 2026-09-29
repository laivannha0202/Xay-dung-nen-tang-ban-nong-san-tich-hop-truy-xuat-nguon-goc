/**
 * Mapping icon Web (Tabler) -> Mobile (Ionicons).
 * Web dùng `@tabler/icons-react`, mobile dùng `@expo/vector-icons` (Ionicons).
 * Không thể dùng chung package (Tabler web là SVG DOM, Ionicons là font native),
 * nên file này chốt tương đương hình ảnh 1:1 để 2 nền tảng nhìn giống nhau.
 *
 * | Vị trí web              | Tabler web        | Ionicons mobile       |
 * |-------------------------|-------------------|-----------------------|
 * | Truy xuất nguồn gốc     | IconQrcode        | qr-code-outline       |
 * | Trang trại minh bạch    | IconBuildingStore | storefront-outline    |
 * | Sản phẩm an toàn        | IconShieldCheck   | shield-checkmark-outline |
 * | Vì sức khỏe cộng đồng   | IconHeart         | heart-outline         |
 * | Giao nhanh toàn quốc    | truck (Tabler)    | car-outline           |
 * | Hỗ trợ 24/7             | headset           | headset-outline       |
 * | Thanh toán an toàn      | card              | card-outline          |
 * | Tìm kiếm                | IconSearch        | search-outline        |
 * | Giỏ hàng                | IconShoppingCart  | cart-outline          |
 * | Thông báo               | (bell)            | notifications-outline |
 * | Vị trí                  | IconMapPin        | location-sharp        |
 * | Danh mục Rau củ         | IconSalad         | leaf-outline          |
 * | Trái cây                | IconApple         | nutrition-outline     |
 * | Thịt, trứng             | IconEgg           | egg-outline           |
 * | Thủy sản                | IconFish          | fish-outline (*)      |
 * | Flash Sale              | IconBolt          | flash                 |
 * | Đánh giá sao            | IconStarFilled    | star                  |
 * | Quét QR                 | IconQrcode        | qr-code-outline       |
 *
 * (*) Ionicons không có `fish-outline` ở bản cũ — fallback `water-outline`.
 */

export const ICON_WEB_TO_MOBILE = {
  qrcode: 'qr-code-outline',
  store: 'storefront-outline',
  shieldCheck: 'shield-checkmark-outline',
  heart: 'heart-outline',
  truck: 'car-outline',
  headset: 'headset-outline',
  card: 'card-outline',
  search: 'search-outline',
  cart: 'cart-outline',
  bell: 'notifications-outline',
  pin: 'location-sharp',
  flash: 'flash',
  star: 'star',
  leaf: 'leaf-outline',
} as const;

export type IconWebMobile = (typeof ICON_WEB_TO_MOBILE)[keyof typeof ICON_WEB_TO_MOBILE];
