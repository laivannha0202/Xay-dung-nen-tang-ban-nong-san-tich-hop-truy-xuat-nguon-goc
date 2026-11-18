# Trạng thái triển khai

Cập nhật: 2026-11-17. Báo cáo nghiệm thu từng mã yêu cầu: `docs/FINAL_ACCEPTANCE_REPORT.md`.

## Đã xong

| Hạng mục | Bằng chứng |
|---|---|
| PostgreSQL nhúng 18.6 (UTF8, cổng 5544) | `scripts/db.mjs` |
| 41 bảng + seed dữ liệu thật | `apps/api/migrations/001_init.sql`, `src/scripts/seed.ts` |
| 110 endpoint khai báo `app.*` dưới `/api/v1` | `src/routes/{auth,public,customer,admin,adminOps,uploads}.ts` |
| PDF truy xuất font tĩnh Roboto | `src/services/tracePdf.ts` |
| **Tách đôi website**: `apps/customer-web` (:3000, 20 route) và `apps/admin-web` (:3001, 18 route + `/dang-nhap`) | `npx next build` cả hai exit 0 |
| **Gói dùng chung** `@agrimarket/core` (types/format/client) và `@agrimarket/ui` (token/primitives) | `packages/core`, `packages/ui` |
| Ứng dụng Expo 5 tab + quét QR, dùng chung `@agrimarket/core` | `apps/customer-mobile`, `src/format.ts`/`src/types.ts` chỉ re-export |
| 56/56 test tích hợp (9 files) | `cd apps/api && pnpm test` → `9 passed (9)`, `56 passed (56)` |
| Typecheck cả 6 gói | `pnpm -r typecheck` → Done × 6 |
| Build cả hai web app | `pnpm build` → exit 0 (customer-web + admin-web, 2026-11-17) |
| Kịch bản demo 10 bước chạy thật | `docs/demo-script.md`, `docs/screenshots/` |

## Đợt 2026-11-17 (vùng giao hàng Hưng Yên + bảo mật uploads)

| Hạng mục | Bằng chứng |
|---|---|
| Địa giới Hưng Yên mới: 104 xã/phường (93 Xã + 11 Phường), NQ 1666/NQ-UBTVQH15 | `apps/api/data/hung-yen-wards.json`, `migrations/004_service_area.sql`, `docs/ADDRESS_SERVICE_AREA_HUNG_YEN.md` |
| Giới hạn giao nội tỉnh ở backend (không chỉ UI) | `services/serviceArea.ts`, kiểm lại trong transaction ở `POST /orders` |
| Phí giao 20.000₫, miễn phí từ 500.000₫, chốt theo `address_status` | `services/pricing.ts`, `/checkout/preview` |
| Chọn xã/phường nhanh có tìm không dấu (Web combobox, Expo bottom sheet) | `components/ward-picker.tsx`, `apps/customer-mobile/src/ward-picker.tsx` |
| Console bật/tắt xã ở admin, chặn tắt xã cuối cùng | `components/service-area-console.tsx`, `PATCH /admin/service-area/wards/:code` |
| Uploads không còn IDOR: PRODUCT public, UPLOAD theo owner, evidence chỉ khi lô đã công bố | `routes/uploads.ts`, `test/08-security.test.ts` |
| Logout thu hồi đúng token, xoá token cục bộ kể cả khi mạng lỗi | `apps/customer-mobile/src/auth.tsx`, `/auth/logout` |
| Mã lô tự sinh `LO-YYYY-NNNN` qua `code_sequences` | `POST /admin/batches` khi `code` để trống |
| Kiểm thử local thay CI: `pnpm verify:local` 10 bước + `pnpm e2e:local` | `apps/api/scripts/verify-local.mjs`, `apps/api/scripts/e2e-local.mjs`, `docs/LOCAL_TESTING_GUIDE.md` |
| Migration `005_reconcile_ward_codes.sql` đối soát 5 mã xã (mới / 004 cũ / sửa tay) | `apps/api/migrations/005_reconcile_ward_codes.sql`, `test/09-ward-reconcile.test.ts` |

## P2 đã làm

- FEFO qua `settings.allocation_strategy`, đổi được ở `/admin/cai-dat`.
- Giảm giá theo đúng khối lượng lấy từ lô cận hạn (`batch_promotions`), hiển thị từng phần trong báo giá.
- PDF truy xuất theo lô (`GET /t/:token/pdf`).

## P2/P3 chưa làm (đúng phạm vi P1)

Blockchain, IoT, QR từng gói, 2FA, cổng thanh toán/giao vận thật, email/SMS, đa kho liên thông, gộp/tách lô, Flash Sale nhiều tầng, chatbot. Xem §11 của `docs/PROMPT_XAY_DUNG_MOI_AGRIMARKET_FULLSTACK_TU_DAU.md`.

## Đợt nghiệm thu cuối (2026-11-17)

| Hạng mục | Bằng chứng |
|---|---|
| Giỏ khách chưa đăng nhập, gộp vào giỏ server sau login | `components/cart-provider.tsx` (`agri.guest-cart.v1`), kiểm bằng trình duyệt |
| Hồ sơ khách sửa được (web + app) | `components/profile-form.tsx`, `ProfileScreen` trong `screens3.tsx` |
| Khiếu nại từ trang tem QR và từ chi tiết đơn (app) | `components/complaint-from-trace.tsx`, `screens.tsx` |
| Đánh giá + khiếu nại + hồ sơ trong app | `apps/customer-mobile/src/screens3.tsx` |
| Lọc giá ở `/san-pham`, lọc ngày ở dashboard và đơn của khách | `apps/customer-web/app/san-pham/page.tsx`, `apps/admin-web/app/admin/page.tsx`, `/tai-khoan/don-hang/page.tsx` |
| Upload hồ sơ nông trại + quản lý ảnh sản phẩm | `apps/admin-web/components/admin-kit.tsx` (`Uploader`), `components/product-images.tsx` |
| Sửa lỗi mốc ngày UTC→ICT và tham số `POST /admin/evidence` | `src/services/invariants.ts`, `src/routes/uploads.ts` |
| Khiếu nại hiện trên chi tiết lô, có link sang đợt thu hồi | `apps/admin-web/app/admin/lo-hang/[id]/page.tsx`, `adminOps.ts` (`recall_id`) |
| Tệp đính kèm khiếu nại: chỉ nhận file của chính khách, `mime` do server quyết định | `POST /me/complaints` (`routes/customer.ts`), `test/08-security.test.ts` |
| Ảnh khiếu nại trong trang quản trị trỏ đúng origin API (trước đây 404) | `apps/admin-web/app/admin/khieu-nai/[id]/page.tsx` (`mediaUrl`), ảnh `admin-complaint-evidence-1440.png` |
| Expo: ảnh upload đi qua `API_BASE` (file riêng tư phải qua API, không qua cửa hàng) | `apps/customer-mobile/src/nav.ts` (`imgUrl`), `screens.tsx` |

## Đợt tách website (2026-11-17)

| Hạng mục | Bằng chứng |
|---|---|
| Xoá `apps/web`, chuyển toàn bộ cây quản trị sang `apps/admin-web/app/admin/*`, cửa hàng sang `apps/customer-web/app/*` | `git status` shows renames |
| Shell quản trị mới: sidebar nhóm, drawer di động, header lấy tiêu đề từ nav, đăng xuất | `apps/admin-web/components/admin-shell.tsx` |
| Trang đăng nhập/403 nằm ngoài thư mục được bảo vệ → hết vòng lặp redirect | `app/dang-nhap`, `app/khong-co-quyen` |
| Đăng nhập bằng tài khoản ADMIN ở cửa hàng chuyển sang `${ADMIN_WEB}/admin` | `apps/customer-web/app/dang-nhap/page.tsx` |
| Trang lỗi/loading/not-found + icon riêng cho từng site | `app/{error,loading,not-found}.tsx`, `app/icon.svg` |
| Hộp thoại nhập lý do thay `window.prompt` (kiểm thử tự động chạy được) | `apps/admin-web/components/admin-kit.tsx` (`Act` + `Modal`) |
| Dòng thời gian đơn của khách lấy mốc thật từ `placed_at`/`shipment.*`/`updated_at` | `apps/customer-web/app/tai-khoan/don-hang/[id]/page.tsx` |
| API từ chối khách gọi endpoint quản trị | `curl -b ck.txt /admin/orders` → `403`, `/admin/dashboard` → `403` |
| Luồng mua trọn vẹn: giỏ khách → đăng nhập → thanh toán → Admin xác nhận → xuất kho → giao → hoàn tất + ghi thanh toán | đơn `AGM-2026-0005` (`a17825b0-…`), ảnh `c*/a*` trong `docs/screenshots/` |

## Đợt nâng cấp giao diện (2026-11-17)

| Hạng mục | Bằng chứng |
|---|---|
| Bỏ hẳn `leaf-`/`clay-` khỏi hai website | `grep -rn "leaf-\|clay-" apps/admin-web apps/customer-web` → rỗng |
| `Tone` dùng chung thêm `brand` | `packages/core/src/status.ts` |
| 18 trang quản trị đồng bộ `PageHeader`/`Kpi`/`table-base`/`StatusPill`/`EmptyState` | `apps/admin-web/app/admin/**` |
| Bảng điều khiển có thêm bảng "Đơn hàng gần đây" (gọi song song `/admin/orders`) | `apps/admin-web/app/admin/page.tsx` |
| Thanh toán 3 bước có số thứ tự, bảng phân bổ lô, `Badge` mã giảm giá | `apps/customer-web/components/checkout-flow.tsx` |
| 3 trang chính sách thay cho 3 link chết ở footer | `apps/customer-web/app/chinh-sach/[slug]/page.tsx` |
| Ứng dụng di động dùng `Screen`/`SectionLabel`/`KpiTile`/`EmptyState`/`Divider` | `apps/customer-mobile/src/ui.tsx` |
| `CartItem` bổ sung `slug`/`image` đúng như `GET /me/cart` trả về | `apps/customer-mobile/src/cart.tsx` |

## Đợt UI/UX cao cấp + dữ liệu ảnh (2026-11-17, nhánh `feat/hung-yen-checkout-security-ux`)

| Hạng mục | Bằng chứng |
|---|---|
| 14 ảnh CC mới (7 sản phẩm, 4 danh mục, 3 banner) + 1 ảnh gạo nếp | `apps/customer-web/public/images/**`, `docs/IMAGE_SOURCES.md` |
| Cột `categories.image_url` + migration | `apps/api/migrations/006_category_images.sql` |
| `/home` trả ảnh danh mục và `origin_note` cho sản phẩm | `apps/api/src/routes/public.ts`, `packages/core/src/types.ts` |
| 8 sản phẩm Hưng Yên + nông trại Khoái Châu + lô `LO-DEMO-*` + token `demo-<slug>` | `apps/api/src/scripts/seed-demo-catalog.ts` (idempotent, không xoá dữ liệu) |
| Dựng lại trang chủ, header, thẻ sản phẩm, khối liên quan ở PDP | `apps/customer-web/app/page.tsx`, `components/{site-header,product-card}.tsx`, `app/san-pham/[slug]/page.tsx` |
| Tab tài khoản có trạng thái active | `apps/customer-web/components/account-nav.tsx` |
| App Expo: tab Ionicons + badge giỏ, thẻ sản phẩm mới, ô danh mục có ảnh, KPI ở trang truy xuất | `apps/customer-mobile/App.tsx`, `src/screens.tsx` |
| Đo tràn ngang 360/390/768/1280/1440 và ảnh hỏng trên 7 trang khách | `0` tràn ngang, `0` ảnh hỏng (Playwright DOM-eval) |
| Ảnh chụp giao diện mới | `docs/screenshots/ui/*-{1440,390}.png` (18 tệp) |
| Báo cáo đợt này | `docs/UI_UX_UPGRADE_REPORT.md` |

## Việc còn hở (không chặn P1)

| Việc | Ghi chú |
|---|---|
| Chưa kiểm trên thiết bị/emulator | Máy này không có `adb`, `emulator`, `java`, `docker`; `ANDROID_HOME` rỗng. `cd apps/customer-mobile && npx expo start --android` không chạy được. Toàn bộ kiểm thử ứng dụng dùng Metro Web. |
| Hoàn tiền tự động khi huỷ đơn đã thanh toán | Luồng Admin (`/admin/refunds`) đã kiểm; nhánh tạo RefundRequest ngay lúc khách huỷ chưa chạy thử. |
| Upload tệp chưa có test tự động | Đã kiểm thủ công: `POST /uploads` + `/admin/evidence` hoạt động sau khi sửa lỗi tham số. |
| Không có URL/deep link ở bản web của ứng dụng di động | Hệ quả ADR-07 (không dùng `expo-router`). Điều hướng bằng state. |
| Phiên bản web của ứng dụng lưu token ở `localStorage` | `expo-secure-store` không có bản web; xem `ponytail:` trong `src/storage.ts`. |

## Lệnh kiểm tra nhanh

```bash
node scripts/db.mjs up
pnpm db:migrate && pnpm db:seed
pnpm test           # 56 passed (9 tệp)
pnpm typecheck      # 6 gói sạch
pnpm build          # next build ×2 + tsc
```

## Đợt kiểm toán 122 mã P1 (2026-11-17)

| Hạng mục | Bằng chứng |
|---|---|
| 28 test tích hợp (thêm `test/05-p1-gaps.test.ts`: khoá tài khoản, throttle 429, upload MIME, certificate 404, recall chặn bán, ownership review/complaint, PTTT lạ 422) | `cd apps/api && pnpm test` → 5 files, 28 passed |
| 31 phép kiểm API sống cho các mã còn lại, in `PASS <mã> :: <số liệu>` | `node .audit/api-proof.mjs` → `31/31 pass` |
| Route inventory 19 trang khách + 24 trang admin + 105 endpoint | `docs/audit/ROUTE_INVENTORY.md` |
| Ma trận 122 mã PASS/BLOCKED kèm bằng chứng | `docs/audit/FEATURE_AUDIT.md` |
| Đo responsive + liệt kê khiếm khuyết giao diện đã sửa | `docs/audit/UI_AUDIT.md` |
| Số liệu trước/sau cho đơn, khuyến mãi, huỷ, kiểm nghiệm, tồn kho, thu hồi | `docs/audit/BUSINESS_LOGIC_TESTS.md` |
| Chỉ mục ảnh chụp | `docs/audit/SCREENSHOTS_INDEX.md` |
| Mã đơn/mã khiếu nại nguyên tử (bảng `code_sequences`) | `apps/api/migrations/002_code_sequences.sql`, `services/pricing.ts:257`, `routes/customer.ts:532` |
| Thu hồi phiên đúng thiết bị khi logout (`jti` + `session_revocations`) | `apps/api/migrations/003_session_revocations.sql`, `lib/auth.ts:30-42` |
| Trang sản phẩm: metadata riêng, JSON-LD, nút Tem trỏ token thật | `apps/customer-web/app/san-pham/[slug]/page.tsx` |

## Đợt nâng cấp UI/UX V3 (2026-11-17)

| Hạng mục | Bằng chứng |
|---|---|
| Cột `is_demo` cho 7 bảng dữ liệu sinh bởi seeder | `apps/api/migrations/007_demo_marker.sql` |
| Seeder đơn demo 5 trạng thái + đánh giá + khiếu nại + voucher `HUNGYEN10`, idempotent | `apps/api/src/scripts/seed-demo-orders.ts` (chạy 2 lần: `+5` rồi `+0`) |
| API trả `is_demo` (admin products/batches/orders, review) | `routes/admin.ts:176,582`, `routes/adminOps.ts:224,692`, `routes/public.ts:182` |
| Badge `DEMO` trên danh sách đơn/sản phẩm/lô/đánh giá admin | `components/admin-kit.tsx`, 4 trang `app/admin/*` |
| Ảnh danh mục 4/4 có `image` (Commons, CC BY-SA) | `curl /categories` → `rau-cu.jpg`, `trai-cay.jpg`, `gao-ngu-coc.jpg`, `dac-san.jpg` |
| Chip bộ lọc xoá được trên PLP | `apps/customer-web/app/san-pham/page.tsx:132-157` |
| `sitemap.xml` (danh mục + sản phẩm), `robots.txt` chặn trang riêng tư, favicon SVG cả hai web | `app/{sitemap,robots}.ts`, `app/icon.svg` ×2 → HTTP 200 |
| Chụp trước/sau 43 ảnh mỗi lượt, 0 overflow / 0 ảnh hỏng / 0 lỗi JS | `docs/screenshots/ui/{before,after}-*.png`, `docs/audit/UI_AUDIT.md` §4b |

Còn `BLOCKED`: toàn bộ hành vi native Android/iOS (camera, secure store, deep link) — máy không có `adb`/emulator.

## Đợt tái thiết kế thị giác V5 (2026-11-18, nhánh `feat/premium-visual-redesign-v5`)

| Hạng mục | Bằng chứng |
|---|---|
| Hệ token V5: canvas `#fafaf7`, khung ivory, `--radius-tile`/`--radius-panel`, `ink-500` → `#5b6b60` | `packages/ui/src/styles.css` |
| `ink-500` sửa ở token, không sửa từng tệp: 5.06:1 trên ivory, 5.65:1 trên trắng | `docs/design/DESIGN_SYSTEM_V5.md` |
| Header, hero, thẻ sản phẩm, footer viết lại; thẻ dùng stretched-link nên cả ô bấm được | `apps/customer-web/components/{site-header,home-hero,product-card,site-footer}.tsx` |
| Hero bỏ màn tối V4 vì ảnh mới đủ sáng (luminance 4 góc ≥ 217/255) | `docs/design/VISUAL_REFERENCES_V5.md` §2 |
| PLP/PDP/giỏ/thanh toán/hồ sơ tem chuyển sang `surface`, nút đề xuất 44px | `apps/customer-web/app/**` |
| Admin shell + dashboard chỉnh tối thiểu; biểu đồ giữ `data-testid="orders-bar"` (14 cột) | `apps/admin-web/components/admin-shell.tsx`, `app/admin/page.tsx` |
| Mobile đồng bộ token: `bg #FAFAF7`, `muted #5B6B60`, thêm `ivory`, `radius.pill` | `apps/customer-mobile/src/theme.ts` |
| Ảnh sản phẩm: 10 studio + 4 graded, ghi rõ từng tệp và phần còn thiếu | `docs/IMAGE_SOURCES.md` |
| 62 ảnh chụp 360→1440 cho 10 tuyến + contact sheet | `docs/screenshots/v5/**` |
| `pnpm -r typecheck` 6/6, `pnpm verify:local` 10/10, `pnpm e2e:local` 10/10 | `docs/FINAL_ACCEPTANCE_REPORT.md` §1 |
| 0 overflow, 0 ảnh hỏng, 0 lỗi WCAG AA trên toàn bộ tuyến đã đo | `docs/FINAL_ACCEPTANCE_REPORT.md` §2 |

Còn `BLOCKED` (không đổi so với các đợt trước):

- **Duyệt thị giác độc lập** — vision API trả `402` suốt phiên; kết luận "cao cấp" hiện dựa trên phép
  đo (luminance, tương phản, overflow, thứ tự DOM), chưa có người/mô hình xem ảnh.
- **Android/iOS native** — máy không có `adb`/emulator/Xcode. Expo Web export chỉ chứng minh bundle
  web, không phải app native.
- **4/14 ảnh sản phẩm vẫn là `graded`** (đu đủ, rau muống, gạo nếp, mật ong) — thư viện tự do không
  có ảnh nền trắng đúng chủ thể.

## Đợt tái thiết kế thị giác V6 — editorial organic market (2026-11-18)

Khác V5: V6 đổi **bố cục**, không chỉ token. Logic nghiệp vụ, route, API, schema, giá, phân bổ lô,
truy hồi và khiếu nại giữ nguyên.

| Hạng mục | Bằng chứng |
|---|---|
| Serif Fraunces tự host (subset latin + vietnamese), `--font-display`, utility `display` | `packages/ui/src/styles.css`, `apps/*/public/fonts/fraunces-*.woff2` |
| Token mới `mint-50/100/200`, `--radius-hero: 28px`, `eyebrow`, `.table-base`/`.kpi-value` viết lại | `packages/ui/src/styles.css` |
| Hero web: **một** thông điệp (bỏ 3 concept chuyển tab), panel mint, H1 serif 36/48/58px, 2 CTA, 3 số liệu chứng minh | `apps/customer-web/components/home-hero.tsx` |
| Trang chủ: hero → 4 thẻ tin cậy → danh mục ảnh tràn viền → nổi bật → khuyến mãi → dải truy xuất `brand-900` → mùa vụ → 3 lý do → vùng giao → mới nhất | `apps/customer-web/app/page.tsx`, `components/category-tile.tsx` |
| Thẻ sản phẩm: panel trắng, ảnh lồng khung 12px trên nền ivory, hover nhấc + bóng | `apps/customer-web/components/product-card.tsx` |
| PLP/PDP/giỏ/thanh toán/tài khoản/hộ chiếu tem: tiêu đề serif, panel `radius-panel`, buy box `radius-hero`, nav tài khoản dạng pill | `apps/customer-web/app/**`, `components/account-nav.tsx` |
| Header sticky mờ, search pill, footer `brand-900` | `components/site-header.tsx`, `site-footer.tsx` |
| Admin: nav active `brand-600` đặc, bảng 10.5px/0.06em, KPI 26px `tabular-nums`, thẻ `radius-panel` | `apps/admin-web/components/admin-shell.tsx`, `app/admin/**` |
| Mobile: một hero mint + serif (Fraunces TTF trong bundle), dải 4 tin cậy, tab bar 56px, wordmark serif | `apps/customer-mobile/src/home.tsx`, `App.tsx`, `src/theme.ts`, `assets/fonts/Fraunces-600.ttf` |
| 34 ảnh chụp 1440/390 (web 26, admin 8, tài khoản 6, mobile 2) — 0 overflow, 0 ảnh hỏng | `docs/screenshots/v6/**` |
| Đo lại sau render: H1 `Fraunces` 58px/600, hero 562px, 0 pageerror; mobile DOM 5 node serif | `docs/design/DESIGN_SYSTEM_V6.md` §4 |
| `pnpm -r typecheck` 6/6, `pnpm verify:local` 10/10, `pnpm e2e:local` 10/10 | phiên 2026-11-18 |

Còn `BLOCKED` — giữ nguyên như V5:

- **Duyệt thị giác độc lập**: vision API trả `402 Credits Required` cho mọi lượt đọc ảnh, nên phần
  "học bố cục từ ảnh tham chiếu" được làm bằng **đo số** (rail 1288px, hero 544px, tỉ lệ màu), và
  kết luận thẩm mỹ chưa có người xem. Cần người duyệt.
- **Android/iOS native**: máy không có `adb`/emulator/Xcode; chỉ chứng minh Expo Web bundle.
- **4/14 ảnh sản phẩm vẫn `graded`** (đu đủ, rau muống, gạo nếp, mật ong).

## Đợt nghiệm thu V7.2 (2026-11-18, nhánh `feat/premium-visual-redesign-v5`)

Không redesign, không reset DB, không merge `main`, không GitHub Actions.

| Hạng mục | Bằng chứng |
|---|---|
| `tuong-ban.jpg` thay ảnh Doenjang Hàn Quốc bằng ảnh chum ủ tương Bần, Hưng Yên (CC BY 3.0, Truyền hình Hưng Yên — HYTV; ảnh chính bài "Tương Bần" vi.wikipedia) | `apps/customer-web/public/images/products/tuong-ban.jpg`, `docs/IMAGE_SOURCES.md` |
| Mật ong hoa nhãn: **không có** ảnh đúng chủ thể trong thư viện tự do (đã dò Commons + Openverse); giữ ảnh mật ong trong hũ và ghi rõ giới hạn | `docs/IMAGE_SOURCES.md` §Ghi chú |
| **Sửa lỗi seeder**: `seed-demo-catalog.ts` chết vì `qr_codes_token_key` khi `seed.ts` đã giữ token `demo-<slug>` → 6 sản phẩm cuối chưa từng được tạo (44/50). Token riêng `demo-lo-<slug>`, tách khối "hàng trình bày" ra khỏi khối tạo lô, chạy lại idempotent | `apps/api/src/scripts/seed-demo-catalog.ts`, DB: 50 sản phẩm / 60 QR |
| **Cách ly DEMO**: dashboard và báo cáo doanh thu cộng cả `payments` của đơn `is_demo` (165.000₫ lọt vào số thật). Loại `NOT o.is_demo` khỏi doanh thu, hoàn tiền, đếm đơn, chuỗi 14 ngày, top sản phẩm, báo cáo doanh thu + vận hành | `apps/api/src/routes/admin.ts`, `routes/adminOps.ts` |
| Test hồi quy: đơn demo không làm thay đổi `gross`, dashboard khớp đúng tiền thật | `apps/api/test/11-demo-isolation.test.ts` |
| Contact sheet **50/50 sản phẩm** (10×5, nhãn SKU + tên), dựng từ API + ảnh thật của storefront | `docs/screenshots/v7.2/products-contact-sheet.jpg` |
| ảnh giao diện mới: Customer Web 11, Admin Web 9, Expo App 1 — tất cả HTTP 200, 0 overflow, 0 ảnh hỏng, 0 pageerror | `docs/screenshots/v7.2/**` |
| `pnpm -r typecheck` 6/6, `pnpm test` 59/59 (11 file), `pnpm verify:local` 10/10, `pnpm e2e:local` 10/10 | phiên 2026-11-18 |

Còn `BLOCKED`:

- **Kiểm duyệt ảnh**: vision API trả `402 Credits Required`; ảnh do ChatGPT kiểm trực tiếp theo yêu
  cầu. `products-contact-sheet.jpg` là bề mặt duyệt.
- **Android/iOS native**: không có `adb`/emulator/Xcode; Expo chỉ chứng minh bundle web.
