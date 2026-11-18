# Truy vết yêu cầu → mã nguồn → kiểm thử

Ký hiệu: **API** = route trong `apps/api/src/routes/*.ts`; **WEB** = route Next.js dưới `apps/web/app`; **APP** = màn hình trong `apps/customer-mobile/src`; **TEST** = `apps/api/test/*.test.ts`.

## A. Quản trị (ADM-01…13)

| Mã | Nội dung | API | WEB | TEST |
|---|---|---|---|---|
| ADM-01-01…04 | Dashboard: đếm đơn chờ/giao/doanh thu sau hoàn; đếm lô công khai/chờ kiểm/cận hạn/thu hồi; cảnh báo dẫn link; nút tải lại + lọc ngày | `GET /admin/dashboard` | `/admin` | — |
| ADM-02-01…04 | CRUD/ẩn danh mục, sản phẩm; cờ `requires_trace`; tồn khả dụng chỉ từ lô đủ điều kiện | `GET/POST/PATCH /admin/categories`, `/admin/products` | `/admin/danh-muc`, `/admin/san-pham`, `/admin/san-pham/[id]` | — |
| ADM-03-01…04 | Nhà cung cấp, nông trại, tệp hồ sơ (`/admin/evidence`), QR chỉ lộ tên + khu vực | `/admin/suppliers`, `/admin/farms`, `/admin/evidence` | `/admin/nha-cung-cap` | — |
| ADM-04-01…03 | Mùa vụ + nhật ký; phun thuốc bắt buộc `isolation_days`; chặn thu hoạch sớm | `/admin/seasons`, `/admin/seasons/:id/logs` | `/admin/mua-vu`, `/admin/mua-vu/[id]` | `TC02` |
| ADM-04-04…05 | Tạo lô từ mùa vụ; timeline sự kiện thật vs mốc dự kiến | `POST /admin/batches`, `GET /admin/batches/:id` | `/admin/lo-hang/[id]` | — |
| ADM-04-06 | Chỉ công khai khi đủ điều kiện; bản điều chỉnh có lý do | `POST /admin/batches/:id/publish`, `POST /admin/batches/:id/corrections` | `/admin/lo-hang/[id]` | `TC01`, `TC03` |
| ADM-04-07…08 | Thu hồi: khoá bán ngay, tách đơn chưa xuất/đã xuất, theo dõi liên hệ, biên bản kết thúc | `POST /admin/batches/:id/recalls`, `GET /admin/recalls`, `POST /admin/recalls/:id/close`, `POST /admin/recalls/:id/contacts/:contactId` | `/admin/thu-hoi`, `/admin/thu-hoi/[id]` | `#13`, `#14` |
| ADM-05-01…05 | Chứng nhận; phiếu kiểm nghiệm + chỉ tiêu; Không đạt → khoá bán; phiếu mới không ghi đè | `POST /admin/certificates`, `POST /admin/batches/:id/lab-tests`, `POST /admin/lab-tests/:id/confirm` | `/admin/lo-hang/[id]` | `TC01`, `TC03` |
| ADM-06-01…05 | Token QR ngẫu nhiên; tải ảnh tem; trang công khai; cảnh báo lô khoá/thu hồi; đếm lượt quét | `POST /admin/qr-codes/:id/regenerate`, `GET /admin/batches/:id/label.pdf`, `GET /t/:token`, `POST /public/trace/:token/scan` | `/admin/ma-qr`, `/t/[token]`, `/tim-kiem` | `TC04` |
| ADM-07-01…06 | Kho, nhập kho theo lô, on_hand/reserved/available, giữ chỗ tự động, phiếu điều chỉnh có lý do, chặn xuất lô không hợp lệ | `GET /admin/warehouses`, `/admin/inventory`, `POST /admin/stock/receipts`, `POST /admin/stock/adjustments`, `GET /admin/stock/movements` | `/admin/kho` | `#6`–`#9`, `#12` |
| ADM-08-01…07 | Đơn: snapshot địa chỉ/giá; phân bổ nguyên tử khi đặt; đổi lô trước xuất; phiếu xuất theo `shipped_qty`; máy trạng thái; COD + chuyển khoản thủ công; khách tự huỷ trước xuất | `GET/POST /admin/orders…`, `/admin/orders/:id/reallocate`, `/ship`, `/payment`, `/shipment`, `POST /me/orders/:id/cancel` | `/admin/don-hang/[id]`, `/tai-khoan/don-hang/[id]` | `#7`–`#12`, `#15` |
| ADM-09-01…03 | Khuyến mãi %, số tiền, hạn mức; server tính + snapshot; một chương trình mỗi đơn | `/admin/promotions`, `POST /checkout/preview` | `/admin/khuyen-mai` | `#19` (doanh thu/net) |
| ADM-10-01…04 | COD/chuyển khoản, UNPAID/PAID; xác nhận thu tiền thủ công; RefundRequest PENDING→APPROVED→COMPLETED/REJECTED; doanh thu trừ hoàn hoàn tất | `/admin/orders/:id/payment`, `/admin/refunds`, `/admin/refunds/:id/:action` | `/admin/thanh-toan`, `/admin/bao-cao` | `#19` |
| ADM-11-01…04 | Đánh giá một lần/order_line, Admin ẩn có lý do; khiếu nại từ đơn hoặc QR; máy trạng thái; lô hiển thị khiếu nại liên quan | `POST /admin/reviews/:id/hide`, `/admin/complaints…`, `POST /me/complaints` | `/admin/danh-gia`, `/admin/khieu-nai/[id]` | `#16`, `#17` |
| ADM-12-01…05 | Đăng nhập/đổi mật khẩu; danh sách + lịch sử khách; khoá/mở kèm lý do; kiểm tra `role=ADMIN` + ownership; băm mật khẩu + chống brute force | `POST /auth/login`, `POST /me/password`, `/admin/customers`, `POST /admin/customers/:id/status` | `/dang-nhap`, `/admin/khach-hang/[id]` | `authorisation` |
| ADM-13-01…05 | Báo cáo doanh thu ngày/tháng; đơn theo trạng thái + tồn; lô hiệu lực/cận hạn/hết hạn/khoá/thu hồi; lượt quét QR theo lô; chỉ Admin | `GET /admin/reports/revenue`, `/admin/reports/operations` | `/admin/bao-cao` | `#19` |

## B. Khách hàng (CUS-01…12)

| Mã | Nội dung | API | WEB | APP | TEST |
|---|---|---|---|---|---|
| CUS-01-01…05 | Đăng ký (role luôn CUSTOMER), đăng nhập nhiều thiết bị, băm mật khẩu ≥ 8 ký tự, tài khoản bị khoá không dùng được API, chuyển tới đăng nhập rồi quay lại | `POST /auth/customer/register`, `/auth/login`, `/auth/logout`, `GET /me` | `/dang-ky`, `/dang-nhap` | tab **Tài khoản** | `authorisation` |
| CUS-02-01…04 | Sửa hồ sơ; địa chỉ CRUD mềm, một mặc định; checkout chỉ dùng địa chỉ của mình + snapshot; sửa địa chỉ sau không đổi đơn cũ | `PATCH /me`, `/me/addresses` | `/tai-khoan` (`ProfileForm` + `AddressBook`), `/thanh-toan` | **Hồ sơ & địa chỉ** (`screens3.tsx`) | — |
| CUS-03-01…04 | Danh mục + sản phẩm ACTIVE; tìm/lọc giá/tồn/sắp xếp; nhãn còn/hết hàng từ lô đủ điều kiện; chỉ hiện đánh giá đã duyệt | `GET /categories`, `/products`, `/home` | `/`, `/san-pham`, `/danh-muc/[slug]`, `/tim-kiem` | tab **Trang chủ** | — |
| CUS-04-01…04 | Giá/đơn vị/ảnh/mô tả/bảo quản/hạn dùng; số lượng > 0; nhãn truy xuất trung tính; đánh giá công khai | `GET /products/:key` | `/san-pham/[slug]` | màn **Chi tiết sản phẩm** | — |
| CUS-05-01…04 | Giỏ thêm/sửa/xoá, cộng dồn theo product; dùng chung web↔app; giá chỉ tham khảo; giỏ khách lưu cục bộ trước đăng nhập, gộp vào giỏ server sau login và kiểm tra lại | `GET/PUT/DELETE /me/cart…` | `/gio-hang` (`cart-provider.tsx`: `agri.guest-cart.v1` + merge-on-login) | tab **Giỏ** | — |
| CUS-06-01…07 | Chỉ CUSTOMER ACTIVE; preview tính lại toàn bộ; chỉ COD/chuyển khoản; FIFO khi xác nhận + giữ chỗ nguyên tử; thiếu hàng → 409 `OUT_OF_STOCK`; bắt buộc `Idempotency-Key`; đổi giá → yêu cầu xem lại | `POST /checkout/preview`, `POST /orders` | `/thanh-toan` | màn **Thanh toán** | `#7`, `#10`, `#11`, `#6` |
| CUS-07-01…05 | Danh sách đơn của mình + lọc trạng thái/khoảng ngày; chi tiết đầy đủ; timeline trạng thái; mã lô thực xuất sau khi giao; cảnh báo lô thu hồi | `GET /me/orders?status&from&to`, `/me/orders/:id` | `/tai-khoan/don-hang`, `/[id]` | tab **Đơn hàng** + chip lọc | `#13`, `#14` |
| CUS-08-01…04 | Huỷ trước khi xuất; huỷ nhả `reserved` không tăng `on_hand`; thấy lý do; sau xuất ẩn nút huỷ | `POST /me/orders/:id/cancel` | `/tai-khoan/don-hang/[id]` | màn **Chi tiết đơn** | `#8` |
| CUS-09-01…06 | Xem QR không cần đăng nhập; đủ dữ liệu lô; mã sai → 404; lô HOLD/RECALLED/hết hạn cảnh báo nổi bật; báo cáo vấn đề (chưa login → giữ `next=/t/<token>`); từ chối quyền camera vẫn nhập mã | `GET /t/:token`, `GET /t/:token/pdf`, `POST /public/trace/:token/scan`, `POST /me/complaints` | `/t/[token]` (+ `components/complaint-from-trace.tsx`), `/tim-kiem` | tab **Quét QR** + `ComplaintFromTrace` | `TC04`, `#20` |
| CUS-10-01…04 | Đánh giá chỉ sau DELIVERED/COMPLETED, một lần/order_line; xem đánh giá mình đã gửi; Admin ẩn có lý do | `POST /me/reviews`, `GET /me/reviews`, `POST /admin/reviews/:id/hide` | `/tai-khoan/danh-gia` | **Đánh giá của tôi**, **Viết đánh giá** (`screens3.tsx`) | `#16` |
| CUS-11-01…06 | Khiếu nại từ QR không cần đơn; chọn lô khi một dòng nhiều lô; ảnh bằng chứng qua upload server; đọc trạng thái + phản hồi; không xoá lịch sử; lô recall hiện hướng dẫn | `POST /me/complaints`, `/me/complaints/:id/messages`, `POST /uploads` | `/tai-khoan/khieu-nai`, `/tai-khoan/khieu-nai/[id]` | **Khiếu nại** (`screens3.tsx`) | `#17` |
| CUS-12-01…05 | Loading/empty/error/retry; mã lỗi chuẩn 401/403/404/409/422/429/500; không tự phát lại tạo đơn với khoá mới; giá/tồn đổi phải xác nhận lại; điều hướng nhất quán sau lỗi phiên | `lib/errors.ts`, `Idempotency-Key`, `PRICE_CHANGED`/`OUT_OF_STOCK` | `error.tsx`/`not-found.tsx`/`loading.tsx`, `/thanh-toan` | `RefreshControl` (`Scroll reload`), `ErrorText` | `#10`, `#11` |
| CUS-12 (đơn P2 kèm) | FEFO khả dụng qua `settings.allocation_strategy`; giảm giá theo đúng khối lượng lô cận hạn; PDF truy xuất theo lô | `PATCH /admin/settings`, `buildQuote`, `GET /t/:token/pdf` | `/admin/cai-dat` | — | `P2`, `#20` |
| CUS-02-05 | Địa chỉ chỉ chọn trong 104 xã/phường Hưng Yên; tỉnh khoá, tên xã server resolve; địa chỉ cũ bị đánh dấu cần chọn lại | `GET /locations/service-area`, `/locations/wards`, `POST/PATCH /me/addresses` | `/tai-khoan` (`AddressBook` + `WardPicker`) | **Hồ sơ & địa chỉ** (`ward-picker.tsx`) | `07-service-area` |
| CUS-06-08 | Giao nội tỉnh: phí 20.000₫, miễn phí từ 500.000₫, chốt theo `address_status`; đặt hàng bị chặn nếu xã ngoài vùng/tắt trong lúc chờ | `POST /checkout/preview`, `POST /orders` | `/thanh-toan` | màn **Thanh toán** | `07-service-area` |
| ADM-09-04 | Bật/tắt xã/phường phục vụ, xem số địa chỉ và đơn chưa giao của xã đó, chặn tắt xã cuối cùng | `GET/PATCH /admin/service-area/wards/:code` | `/admin/cai-dat` (`service-area-console.tsx`) | — | `07-service-area` |

## B1. Lỗ hổng đã lấp trong đợt nghiệm thu cuối

| Lỗ hổng | Sửa ở đâu |
|---|---|
| Mốc ngày báo cáo dùng UTC, sai trước 07:00 giờ Việt Nam | `todayVN()` trong `apps/api/src/services/invariants.ts`; áp cho `reports/revenue` + `reports/operations` |
| `POST /admin/evidence` bind 8 tham số cho 7 placeholder → 500 | `apps/api/src/routes/uploads.ts` |
| Không xem lại được tệp hồ sơ đã tải | `GET /admin/evidence?owner_type=&owner_id=` + cột `Hồ sơ` ở `/admin/nha-cung-cap` |
| Không quản lý ảnh sản phẩm | `components/product-images.tsx` trên `/admin/san-pham/[id]` |
| Không lọc được đơn của khách theo thời gian | `GET /me/orders?from&to` + form ngày ở `/tai-khoan/don-hang` + chip trạng thái trong app |
| Không lọc giá ở danh sách sản phẩm | `min_price`/`max_price` + ô `Giá từ/Đến` ở `/san-pham` |
| Không gửi được khiếu nại từ trang tem QR | `components/complaint-from-trace.tsx` trên `/t/[token]` (dùng `trace.batch.id`) |
| `/uploads/:name` phục vụ mọi tệp cho bất kỳ ai biết URL (IDOR ảnh khiếu nại) | `routes/uploads.ts`: phân loại theo `evidence_files.owner_type`, cache-control riêng tư trừ khi thật sự công khai; `POST /admin/uploads` cho ảnh catalogue |
| Logout trên app không thu hồi token phía server | `POST /auth/logout` + `session_revocations`; xoá token cục bộ trong `finally` |
| Không thấy khiếu nại trên chi tiết lô, không nhảy được sang thu hồi | `complaints` hiển thị ở `/admin/lo-hang/[id]`; `recall_id` trong `GET /admin/complaints/:id` → link `Đợt thu hồi` |

## B2. Hạ tầng nghiệm thu thay CI

| Yêu cầu | Hiện thực | Kiểm chứng |
|---|---|---|
| Không dùng GitHub Actions CI/CD | Xoá `.github/workflows/ci.yml`, không còn workflow nào | `git ls-files .github` → rỗng |
| Một lệnh kiểm tra local đầy đủ | `pnpm verify:local` (môi trường, PostgreSQL, CSDL test, typecheck 6 gói, API tests, build 2 web, typecheck + export Expo Web, quét bí mật) | `apps/api/scripts/verify-local.mjs` → `10/10 checks passed` |
| E2E trên API thật | `pnpm e2e:local` (Playwright, tự dò Chromium) | `apps/api/scripts/e2e-local.mjs` → `9/9 steps passed` |
| Migration 5 mã xã an toàn | `004` bỏ khối đổi mã, `005_reconcile_ward_codes.sql` xử lý mới/cũ/sửa tay/cả hai | `test/09-ward-reconcile.test.ts` (3 test, CSDL nháp riêng) |


## B3. Bổ sung đợt UI/UX (2026-11-17)

| Yêu cầu | Hiện thực | Kiểm chứng |
|---|---|---|
| Ảnh hợp pháp, lưu cục bộ, ghi nguồn | 14 ảnh CC trong `apps/customer-web/public/images/{products,categories,banners}`, ảnh gạo nếp bổ sung sau | `docs/IMAGE_SOURCES.md` (giấy phép + tác giả + trang gốc) |
| Danh mục có ảnh, không phụ thuộc tồn kho sản phẩm | `categories.image_url` (migration `006`), `COALESCE` fallback sang ảnh sản phẩm | `apps/api/src/routes/public.ts` (`/home`) |
| Thêm dữ liệu không phá CSDL dev đang có đơn thật | Script upsert idempotent, không `TRUNCATE` | `apps/api/src/scripts/seed-demo-catalog.ts` → `8 sản phẩm mới, 8 sản phẩm demo có lô công khai` |
| Giao diện khách: hero, danh mục, khối truy xuất, giao hàng Hưng Yên | — | `apps/customer-web/app/page.tsx`, ảnh `docs/screenshots/ui/home-{1440,390}.png` |
| PDP có khối sản phẩm cùng nhóm | Tải song song danh sách + chi tiết, lọc cùng `category_slug`, còn hàng, ≤4 | `apps/customer-web/app/san-pham/[slug]/page.tsx` |
| Tab tài khoản phản ánh trang đang xem | `usePathname` + `aria-current` | `apps/customer-web/components/account-nav.tsx` |
| Ứng dụng di động: tab icon, thẻ sản phẩm, ô danh mục, KPI truy xuất | — | `apps/customer-mobile/App.tsx`, `src/screens.tsx` (tsc exit 0, Expo Web 390px không tràn ngang) |
| Không tràn ngang & không ảnh hỏng 360…1440 | Playwright DOM-eval trên 8 trang khách | `scrollWidth-clientWidth = 0`, `naturalWidth` hỏng `0` |
| Hồi quy nghiệp vụ sau thay đổi giao diện | `pnpm test`, `pnpm verify:local`, `pnpm e2e:local` | 62/62, 10/10, 10/10 |

## B4. Nghiệm thu cuối 2026-11-18

| Hạng mục | Hiện thực | Kiểm chứng |
|---|---|---|
| 122 yêu cầu P1 | toàn bộ Admin/Customer Web + API | `docs/AGRIMARKET_MOI_MA_TRAN_NGHIEM_THU_122_P1.md` — 120 PASS / 2 PARTIAL / 0 FAIL |
| Chuỗi nghiệp vụ đầu-cuối | `scripts/acceptance-walk.mjs` | 38/38 bước |
| Hồ sơ nghiệm thu | `docs/final-acceptance/` (12 tệp) | kiểm toán, ma trận, chức năng, bảo mật, DB, API, native, demo, cài đặt, sao lưu, tồn đọng, checklist |
| Lỗi đã sửa trong đợt | mã chứng từ trùng (migration 010), tồn/tiền demo, `qr_token` trên đơn, migration 008 idempotent | `test/12-audit-fixes.test.ts` |

## C. Phạm vi P1 không làm (đúng đặc tả)

Thanh toán VNPay/MoMo, API hãng vận chuyển, blockchain, nhiều kho liên thông, 2FA, email/SMS tự động, đăng nhập nông dân/nhà cung cấp/QC. Không có endpoint nào cho các mục này.
