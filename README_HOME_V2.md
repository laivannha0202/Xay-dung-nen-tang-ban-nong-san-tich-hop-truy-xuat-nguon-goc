# AgriMarket Home V2 - hoàn thiện Trang chủ

Bản này giữ đúng flow Expo Go USB của repo và chỉ nâng cấp Trang chủ.

## Thay 4 file

- `apps/mobile/src/app/(tabs)/index.tsx`
- `apps/mobile/src/app/(tabs)/_layout.tsx`
- `apps/mobile/src/components/home/category-grid.tsx`
- `apps/mobile/src/components/home/home-header.tsx`

## Điểm đã sửa

- Giữ hotfix màn trắng: root dùng `View + useSafeAreaInsets`.
- 8 danh mục luôn hiển thị đủ trên một hàng, responsive theo chiều rộng màn hình.
- Trust strip không còn chữ bị vỡ thành 4-5 dòng.
- Card sản phẩm hiển thị 2 card vừa màn hình nếu backend có đủ dữ liệu.
- Chuẩn hóa URL ảnh sản phẩm tương đối / localhost để chạy qua Expo Go + adb reverse.
- Có fallback ảnh hỏng, skeleton, empty state, retry và pull-to-refresh.
- Các route Home tiếp tục dùng route hiện có của repo.
- Bottom tab được tinh chỉnh để sát mockup hơn.

## Áp dụng

Từ root repo, sao lưu trước:

```bash
cp "apps/mobile/src/app/(tabs)/index.tsx" /tmp/index.tsx.bak
cp "apps/mobile/src/app/(tabs)/_layout.tsx" /tmp/tabs-layout.tsx.bak
cp "apps/mobile/src/components/home/category-grid.tsx" /tmp/category-grid.tsx.bak
cp "apps/mobile/src/components/home/home-header.tsx" /tmp/home-header.tsx.bak
```

Sau đó chép đè 4 file trong ZIP vào đúng đường dẫn.

## Kiểm tra

```bash
pnpm --filter @agrimarket/mobile typecheck
pnpm dev:mobile:usb
```

Nếu Metro đang chạy, chỉ cần nhấn `r` để reload.

## Ghi chú về sản phẩm hiện tại

Nếu backend chỉ trả 1 sản phẩm (ví dụ dữ liệu callback/test), Home sẽ chỉ hiển thị đúng 1 card.
Đó là dữ liệu backend, không phải lỗi layout. Khi seed/database có nhiều sản phẩm công khai, section sẽ tự hiện nhiều card.
