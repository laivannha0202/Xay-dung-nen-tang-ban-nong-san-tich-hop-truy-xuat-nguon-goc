# Báo cáo nâng cấp giao diện (UI/UX)

Nhánh: `feat/hung-yen-checkout-security-ux`. Ngày: 2026-11-17.
Phạm vi: ba bề mặt giao diện (`customer-web` :3000, `admin-web` :3001, `customer-mobile` :8081).
**Không đổi nghiệp vụ**: mọi endpoint, quy tắc giá, kiểm tra vùng giao, FEFO/FIFO, bất biến tồn kho giữ nguyên.

## 1. Ảnh và dữ liệu bổ sung

| Hạng mục | Thay đổi | Tệp |
|---|---|---|
| Ảnh sản phẩm | +7 ảnh CC (`cam-sanh`, `nhan-long-hung-yen`, `chuoi-gia-nam`, `dua-hau-kim-long`, `du-du-ruot-do`, `bi-do-hokkai`, `xa-lach-romaine`) | `apps/customer-web/public/images/products/*.jpg` |
| Ảnh danh mục | +4 ảnh (`rau-cu`, `trai-cay`, `gao-ngu-coc`, `dac-san`) | `apps/customer-web/public/images/categories/` |
| Banner | +3 ảnh (`hero-farm`, `trace-lab`, `hung-yen`) | `apps/customer-web/public/images/banners/` |
| Cột ảnh danh mục | `categories.image_url` + migration | `apps/api/migrations/006_category_images.sql` |
| `/home` | trả `image_url` danh mục, fallback ảnh sản phẩm đầu tiên; danh sách sản phẩm trả thêm `origin_note` | `apps/api/src/routes/public.ts` |
| Kiểu dữ liệu | `Product.origin_note?: string \| null` (tuỳ chọn, không phá client cũ) | `packages/core/src/types.ts` |
| Dữ liệu demo | 8 sản phẩm Hưng Yên + nông trại `Vườn cam Khoái Châu`, chứng nhận VietGAP, mùa vụ, nhật ký canh tác, lô `LO-DEMO-*`, phiếu kiểm nghiệm, tồn kho, token QR `demo-<slug>` | `apps/api/src/scripts/seed.ts`, `apps/api/src/scripts/seed-demo-catalog.ts` |

Nguồn/giấy phép ảnh: `docs/IMAGE_SOURCES.md` (tất cả CC BY / CC BY-SA / CC0 / public domain, tải về cục bộ, đã nén JPEG q80–82).

`seed-demo-catalog.ts` là script **idempotent** (upsert theo khoá tự nhiên, không `TRUNCATE`) để bổ sung dữ liệu vào CSDL dev đang có đơn thật. `pnpm db:seed` vẫn giữ nguyên hành vi phá huỷ và không gọi script này; test tích hợp không phụ thuộc nó.

## 2. Cửa hàng (`apps/customer-web`)

| Khu vực | Thay đổi |
|---|---|
| `site-header` | Thanh thông báo đóng được (nội tỉnh Hưng Yên + miễn phí giao từ 500.000₫), ô tìm kiếm có nút icon, dải điều hướng đủ danh mục, liên kết tài khoản/đơn hàng, badge giỏ, drawer mobile |
| Trang chủ | Hero tối trên `hero-farm.jpg`, thẻ khuyến mãi, số liệu (sản phẩm/lô), ô danh mục có ảnh, khối LƯU Ý, sản phẩm đánh giá cao, khối theo mùa, khối truy xuất (`trace-lab.jpg`), vì sao AgriMarket, khối giao hàng Hưng Yên (đọc `/locations/service-area`), lưới mới nhất |
| `product-card` | Nhãn danh mục, badge cận hạn/hết hàng, dòng xuất xứ có icon, điểm đánh giá hoặc "Chưa đánh giá", tình trạng tồn |
| PLP `/san-pham` | Dòng đếm kết quả phía trên lưới |
| PDP `/san-pham/[slug]` | Khối "Cùng nhóm <danh mục>" (tối đa 4 sản phẩm còn hàng, sắp theo điểm đánh giá) đặt trước JSON-LD; tải song song với chi tiết sản phẩm |
| Khu tài khoản | `components/account-nav.tsx` — tab có `aria-current` + trạng thái active theo `usePathname` |

Kiểm chứng trình duyệt (Playwright, DOM-eval vì model vision hết credit):
- `/` ở 390px và 1440px: `scrollWidth - clientWidth = 0`, ảnh `naturalWidth > 0` toàn bộ.
- `/san-pham/cam-sanh`: có khối liên quan, 0 ảnh hỏng sau khi đổi tên tệp ảnh khớp slug, không tràn ngang.
- `/t/demo-cam-sanh` ở 390px: 0 tràn ngang, 0 ảnh hỏng, có mục nhật ký canh tác và kiểm nghiệm.
- `/gio-hang`, `/thanh-toan`, `/tai-khoan/don-hang`: render dữ liệu thật (đơn, địa chỉ, phí giao), 0 tràn ngang.

## 3. Quản trị (`apps/admin-web`)

Rà 6 khu vực sau khi đăng nhập (`/admin`, `/admin/don-hang`, `/admin/lo-hang`, `/admin/khieu-nai`, `/admin/bao-cao`, `/admin/kho`, `/admin/ma-qr`):
mỗi trang dùng chung `PageHeader`/`SectionHeader`, `Kpi`, `StatusPill`, `EmptyState`, `.card-pad`, `.table-base`; không trang nào tràn ngang ở 1440px; bảng dữ liệu thật render đủ dòng (10 / 17 / 4 / 39 / 35 / 16).
Dashboard giữ biểu đồ cột tự vẽ (không thêm thư viện chart), pipeline đơn hàng + khối "Cần xử lý" + bảng 6 đơn mới nhất.

## 4. Ứng dụng di động (`apps/customer-mobile`)

| Khu vực | Thay đổi |
|---|---|
| Khung app | Tab bar `Ionicons` (home/bag/qr-code/receipt/person, icon đặc khi active), badge số lượng giỏ, header thương hiệu, nút quay lại, splash khi bootstrap |
| Thẻ sản phẩm | Ảnh 72px, dòng xuất xứ, giá + đơn vị, điểm đánh giá, tồn kho / "Đang chờ lô mới", badge cận hạn + danh mục |
| Trang chủ | Hero có pill số liệu, ô danh mục có ảnh (fallback chữ cái đầu), bỏ CTA truy xuất rỗng (điều hướng tới token rỗng) |
| Truy xuất | Thêm hàng KPI (nhật ký / kiểm nghiệm / chứng nhận) ngay dưới tiêu đề lô |

`useSafeAreaInsets` đã bỏ: app chưa bọc `SafeAreaProvider` nên hook ném lỗi runtime trên Expo Web. Chỉ bọc lại provider rồi mới dùng insets.

Đã kiểm: `npx tsc --noEmit` exit 0; Expo Web 390px — 0 tràn ngang, ảnh tải được, tab hiển thị; bundle biên dịch không còn lỗi console "No safe area value available".

## 5. Kiểm chứng

| Bước | Kết quả |
|---|---|
| `pnpm -r typecheck` | Pass cả 6 gói |
| `pnpm test` | `9 passed (9)`, `56 passed (56)` |
| `pnpm build` | customer-web + admin-web exit 0 |
| `pnpm verify:local` | xem `docs/test-report.md` |
| `pnpm e2e:local` | xem `docs/test-report.md` |

## 6. Chưa làm / giới hạn

- Build native Android/iOS: **BLOCKED** — máy không có `adb`/emulator; chỉ kiểm bản Expo Web.
- Không dùng `next/image`: giữ `<img>` theo ghi chú `ponytail:` trong `apps/customer-web/lib/config.ts` (ảnh tĩnh serve qua `public/`, API base khác origin).
- Ảnh chỉ là minh hoạ giấy phép tự do, không phải ảnh thật của nông trại/phiếu kiểm nghiệm.

## 7. Đợt UPGRADE V3 (2026-11-17)

| Khu vực | Thay đổi | Tệp |
|---|---|---|
| Dấu dữ liệu demo | Cột `is_demo` trên `products, farms, suppliers, batches, orders, reviews, complaints`; seeder chỉ đặt trên bản ghi do nó sở hữu theo khoá tự nhiên | `migrations/007_demo_marker.sql`, `scripts/seed-demo-catalog.ts` |
| Đơn demo | `seed-demo-orders.ts`: 5 đơn `AGM-2026-0101…0105` (DELIVERED/COMPLETED/PREPARING/CONFIRMED/CANCELLED), đánh giá 5★, khiếu nại `KN-0102` + 2 tin nhắn, shipment, payment, trừ/tăng tồn đúng nghiệp vụ, voucher `HUNGYEN10`, advance `code_sequences`; idempotent | `apps/api/src/scripts/seed-demo-orders.ts` |
| API | Trả `is_demo` ở admin products/batches/orders và review công khai | `routes/admin.ts:176,582`, `routes/adminOps.ts:224,692`, `routes/public.ts:182` |
| Admin | Badge `DEMO` (`title` giải thích) ở danh sách đơn/sản phẩm/lô/đánh giá; ô mô tả khiếu nại `truncate` → `line-clamp-2` | `components/admin-kit.tsx:7-18`, `app/admin/{don-hang,san-pham,lo-hang,danh-gia,khieu-nai}/page.tsx` |
| Admin shell | Bỏ `<h1>` trùng `PageHeader` (còn 1 `<h1>`/trang) | `components/admin-shell.tsx:159` |
| Storefront | Ô tìm kiếm header trỏ `/san-pham?q=` (trước trỏ trang chỉ tra QR); chip bộ lọc xoá được + "Xoá tất cả"; 4/4 danh mục có ảnh riêng | `components/site-header.tsx:36-41`, `app/san-pham/page.tsx:132-157`, `routes/public.ts:85-89` |
| SEO | `sitemap.xml` (danh mục + tối đa 100 sản phẩm), `robots.txt` chặn `/tai-khoan /gio-hang /thanh-toan /doi-mat-khau`; `generateMetadata` cho `/danh-muc/[slug]` và `/t/[token]`; favicon SVG riêng mỗi web; bỏ hậu tố `— AgriMarket` lặp trong 5 trang customer | `app/{sitemap,robots}.ts`, `app/danh-muc/[slug]/page.tsx:8-13`, `app/t/[token]/page.tsx:10-18`, `app/icon.svg` |
| Ảnh danh mục | 4 ảnh Commons mới (CC BY-SA 2.0/3.0/4.0), 600×600 q82 | `public/images/categories/*.jpg`, `docs/IMAGE_SOURCES.md` |

Kiểm chứng: `pnpm -r typecheck` → Done ×6; `node .audit/shot-all.mjs before|after` → 43 ảnh/lượt, 0 overflow, 0 ảnh hỏng, 0 lỗi JS; `node .audit/dom-audit.mjs` → 17/17 trang admin đúng 1 `<h1>`, 0 phần tử bị cắt; `curl /categories` → 4/4 có `image`; `sitemap.xml` / `robots.txt` / `icon.svg` → 200.
