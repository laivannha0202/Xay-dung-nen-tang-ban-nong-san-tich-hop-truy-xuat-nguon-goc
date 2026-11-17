# ROUTE INVENTORY — AgriMarket (branch `feat/split-admin-customer-web`)

Kiểm kê thực tế từ mã nguồn + xác nhận HTTP khi chạy (2026-11-17). Mọi route dưới đây được gọi thật bằng Playwright hoặc `fetch`, không suy đoán.

## 1. Dịch vụ và cổng

| Dịch vụ | Lệnh | Cổng | Trạng thái |
|---|---|---|---|
| API (Fastify, tsx) | `apps/api` `pnpm dev` | 4000 | UP |
| Customer Web (Next standalone) | `apps/customer-web` `pnpm start` | 3000 | UP |
| Admin Web | `apps/admin-web` `pnpm start` | 3001 | UP |
| Mobile (Expo web) | `apps/customer-mobile` `pnpm web` | 8081 | UP |
| PostgreSQL nhúng | `scripts/db.mjs up` | 5544 | UP (`agri/agri`, `agrimarket`) |

## 2. Customer Web — 19 trang

| Route | File | Trạng thái | Ghi chú |
|---|---|---|---|
| `/` | `app/page.tsx` | 200 | hero + danh mục + sản phẩm nổi bật |
| `/san-pham` | `app/san-pham/page.tsx` | 200 | lọc danh mục/giá/từ khoá/sắp xếp |
| `/san-pham/:slug` | `app/san-pham/[slug]/page.tsx` | 200 | buy box sticky, lô công khai + link tem thật, JSON-LD, `generateMetadata` |
| `/danh-muc/:slug` | `app/danh-muc/[slug]/page.tsx` | 200 | |
| `/gio-hang` | `app/gio-hang/page.tsx` | 200 | khách chưa đăng nhập dùng giỏ localStorage |
| `/thanh-toan` | `app/thanh-toan/page.tsx` | 200 | yêu cầu đăng nhập; địa chỉ + PTTT + mã KM + preview quote |
| `/dat-hang-thanh-cong/:id` | `app/dat-hang-thanh-cong/[id]/page.tsx` | 200 | |
| `/dang-nhap` | `app/dang-nhap/page.tsx` | 200 | |
| `/dang-ky` | `app/dang-ky/page.tsx` | 200 | |
| `/doi-mat-khau` | `app/doi-mat-khau/page.tsx` | 200 | |
| `/tai-khoan` | `app/tai-khoan/page.tsx` | 200 (CUSTOMER) | ADMIN → hiển thị như khách |
| `/tai-khoan/don-hang` | `app/tai-khoan/don-hang/page.tsx` | 200 | |
| `/tai-khoan/don-hang/:id` | `app/tai-khoan/don-hang/[id]/page.tsx` | 200 | timeline, lô, vận đơn, hủy/đánh giá/khiếu nại |
| `/tai-khoan/danh-gia` | `app/tai-khoan/danh-gia/page.tsx` | 200 | |
| `/tai-khoan/khieu-nai` | `app/tai-khoan/khieu-nai/page.tsx` | 200 | |
| `/tai-khoan/khieu-nai/:id` | `app/tai-khoan/khieu-nai/[id]/page.tsx` | 200 | hội thoại + tệp bằng chứng |
| `/tim-kiem` | `app/tim-kiem/page.tsx` | 200 | tra cứu theo mã tem/mã lô |
| `/t` | `app/t/page.tsx` | 200 | nhập token |
| `/t/:token` | `app/t/[token]/page.tsx` | 200 / 404 | công khai, không đăng nhập |
| `/chinh-sach/:slug` | `app/chinh-sach/[slug]/page.tsx` | 200 | phí giao 20.000₫ khớp `BASE_SHIP_FEE` |

## 3. Admin Web — 24 trang

`/admin` (dashboard), `/admin/don-hang`, `/admin/don-hang/:id`, `/admin/kho`, `/admin/lo-hang`, `/admin/lo-hang/:id`, `/admin/ma-qr`, `/admin/ma-qr/:id`(qua chi tiết lô), `/admin/thu-hoi`, `/admin/thu-hoi/:id`, `/admin/thanh-toan`, `/admin/khuyen-mai`, `/admin/danh-gia`, `/admin/khieu-nai`, `/admin/khieu-nai/:id`, `/admin/khach-hang`, `/admin/khach-hang/:id`, `/admin/nha-cung-cap`, `/admin/mua-vu`, `/admin/mua-vu/:id`, `/admin/san-pham`, `/admin/san-pham/:id`, `/admin/danh-muc`, `/admin/bao-cao`, `/admin/cai-dat`, `/dang-nhap`, `/khong-co-quyen`.

Tất cả trả 200 khi đăng nhập `admin@agrimarket.vn`; `/khong-co-quyen` là trang chặn khi thiếu quyền.

## 4. API — 105 endpoint (đếm `app.<verb>(` theo file)

| File | Số route | Nhóm |
|---|---|---|
| `routes/public.ts` | 8 | catalog, trace công khai, PDF, scan |
| `routes/auth.ts` | 6 | register/login/logout/me/đổi mật khẩu |
| `routes/customer.ts` | 19 | giỏ, checkout preview, đơn, hủy, đánh giá, khiếu nại |
| `routes/admin.ts` | 27 | catalog, mùa vụ, lô, kiểm nghiệm, chứng nhận, publish/QR |
| `routes/adminOps.ts` | 40 | kho, đơn, thu hồi, khuyến mãi, đánh giá, khiếu nại, khách, báo cáo, cấu hình |
| `routes/uploads.ts` | 5 | upload MIME-sniff, phục vụ tệp, evidence |

Route tiêu biểu đã kiểm chứng bằng dữ liệu thật:

- `GET /t/:token` — trang truy xuất công khai; tăng `qr_scans`.
- `POST /me/complaints` — nhận `batch_id` từ luồng QR (CUS-11-01).
- `POST /admin/batches/:id/lab-tests` — FAIL ⇒ `quality_status=FAIL`, `safety_status=HOLD`.
- `POST /admin/batches/:id/publish` — chặn khi thiếu phiếu Đạt / đang HOLD / thu hồi.
- `POST /admin/stock/adjustments` — ghi `stock_movements` + audit, chặn tồn âm.
- `POST /admin/complaints/:id/status` — đổi trạng thái + lưu `resolution`.
- `POST /admin/reviews/:id/hide` — lưu `hidden_reason`.
- `POST /admin/refunds/:id/:action` — approve/complete/reject, cập nhật `payment_status`.
- `GET /admin/reports/revenue|operations` — doanh thu trừ hoàn tiền, tồn kho theo lô.
- `PATCH /admin/settings` — `allocation_strategy` FIFO/FEFO.

## 5. Không tồn tại (đã kiểm tra, không phải thiếu sót)

- Không có endpoint xuất CSV/Excel: đặc tả 122 mã P1 không yêu cầu, màn hình báo cáo hiển thị trực tiếp.
- Không có `/health` riêng ngoài `GET /health` trong `uploads.ts` (đã trả `status: ok`).
