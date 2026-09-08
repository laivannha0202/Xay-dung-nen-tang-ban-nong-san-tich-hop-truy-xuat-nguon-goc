# AgriMarket Home Redesign

Gói này thay toàn bộ giao diện Trang chủ Mobile theo mockup đã cung cấp.

## File cần thay

Chép đè các file sau vào project:

- apps/mobile/src/app/(tabs)/index.tsx
- apps/mobile/src/app/(tabs)/_layout.tsx
- apps/mobile/src/components/home/home-header.tsx
- apps/mobile/src/components/home/search-bar.tsx
- apps/mobile/src/components/home/hero-banner.tsx
- apps/mobile/src/components/home/quick-actions.tsx
- apps/mobile/src/components/home/category-grid.tsx
- apps/mobile/src/components/home/index.ts

Chép cả thư mục ảnh:

- apps/mobile/assets/images/home/

## Dọn code Trang chủ cũ

Sau khi chép đè, các component Home cũ không còn dùng có thể xóa nếu tồn tại:

- src/components/home/marketplace-header.tsx
- src/components/home/harvest-product-card.tsx
- src/components/home/home-section.tsx

Chỉ xóa nếu `grep` xác nhận không còn file khác import chúng.

## Lệnh kiểm tra

Tại root repository:

```bash
pnpm --filter @agrimarket/mobile typecheck
pnpm --filter @agrimarket/mobile start
```

Nếu chạy Android native:

```bash
pnpm --filter @agrimarket/mobile android
```

## Lưu ý chức năng

- Header: Thông báo -> `/tai-khoan/thong-bao`
- Giỏ hàng -> `/gio-hang`
- Search -> `/kham-pha`
- Hero -> `/kham-pha`
- Quick actions dùng route hiện có.
- Product card -> `/san-pham/[id]`
- Nút `+` mở chi tiết sản phẩm để chọn biến thể trước khi thêm giỏ, đúng với flow hiện tại của project.
- Danh mục gửi param `danhMuc` sang `/kham-pha`. Để màn Khám phá tự áp param này, xem file `OPTIONAL_kham-pha_category-param.patch.txt`.

## Ảnh

Ảnh logo, hero và 8 ảnh danh mục nằm trong:

`apps/mobile/assets/images/home/`

Không cần cài thêm package ảnh: project hiện đã có `expo-image`.
