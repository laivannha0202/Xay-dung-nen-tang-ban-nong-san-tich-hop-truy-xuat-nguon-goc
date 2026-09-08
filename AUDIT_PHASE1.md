# AgriMarket repository audit — Phase 1

Audit dựa trên `agrimarket-source-review.zip` tại branch `main`,
last commit `21ebce3 feat: complete mobile home v3 cart images and seed data`.

## P0 — phải xử lý trước khi push

1. `local.properties` đang nằm trong tracked files.
   - File này là cấu hình máy local.
   - Phải `git rm --cached local.properties`.
   - Thêm `local.properties` và `**/local.properties` vào `.gitignore`.

2. Repository root đang chứa artifact one-off:
   - `agrimarket_home_v2_apply.zip` (tracked, local đã delete)
   - `README_APPLY.md`
   - `README_HOME_V2.md`
   - `README_FIX.md`
   - `README_HOME_POLISH_V3.md`
   - các ZIP patch V2/V3
   - apply/remove scripts trong `tools/`.

3. Root có 2 ảnh duplicate byte-for-byte:
   - `agrimarket-logo.png`
   - `hero-agri.png`
   đã có bản đúng tại `apps/mobile/assets/images/home/`.

## P1 — code cleanup an toàn

- `apps/mobile/src/app/(tabs)/index.tsx`
  - `useLayChiTietSanPhamCongKhai` import không dùng.
  - `Image` import chỉ dùng bởi `ProductImage` cũ.
  - `ProductImage` không còn consumer sau `SmartProductImage`.
  - `MUTED` không dùng.
  - imports Home đang tách rời.
- `apps/mobile/src/components/man-hinh-placeholder.tsx`: orphan.
- `apps/mobile/src/components/trang-thai-api.tsx`: orphan.
- seed comment ghi 12 sản phẩm nhưng mảng có 13.

## P1 — chưa được coi là production-ready

`home-lower-sections.tsx` hiện hard-code:
- sản phẩm nổi bật;
- rating/review count;
- ưu đãi/discount/countdown;
- trang trại tiêu biểu.

Điều này mâu thuẫn với `docs/MOBILE-APP.md` và kế hoạch MOBILE-FIX-013:
Home chỉ render semantics Backend thật sự hỗ trợ.

Không nên coi lower sections là business implementation cuối cùng.
UI có thể giữ, nhưng Phase 2 phải nối API thật hoặc ẩn semantics chưa có API.

## P1 — ảnh seed

`apps/api/public/products/*.jpg` hiện chủ yếu là placeholder màu/chữ.
`SmartProductImage` đang override theo tên sản phẩm trong `__DEV__`.
Đây là workaround UI, không phải kiến trúc cuối.

Phase 2:
- thay seed assets bằng ảnh thật;
- Backend trả URL ảnh thật;
- xóa mapping theo tên khỏi Mobile;
- Mobile chỉ render `anhBiaUrl`.

## P2

- `apps/api/public/products/ca-hoi-na-uy.jpg` và
  `ca-hoi-na-uys.jpg` trùng byte-for-byte.
- Seed hiện tham chiếu typo `ca-hoi-na-uys.jpg`.
  Cần migration/update `TepTin.objectKey` an toàn trước khi xóa alias.
- category Gạo dùng slug `gom`; cần quyết định migration riêng, không đổi vội
  trong cleanup vì có thể tạo duplicate category trong DB.
