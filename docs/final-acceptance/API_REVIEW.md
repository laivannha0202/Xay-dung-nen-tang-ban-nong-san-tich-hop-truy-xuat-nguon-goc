# Rà soát API

Ngày 2026-11-18. Đếm trực tiếp từ mã nguồn `apps/api/src/routes/*.ts`.

## 1. Quy mô

| Tệp | Dòng | Route |
|---|---|---|
| `routes/admin.ts` | 959 | 27 |
| `routes/adminOps.ts` | 1195 | 42 |
| `routes/customer.ts` | 669 | 19 |
| `routes/public.ts` | 408 | 11 |
| `routes/auth.ts` | 169 | 6 |
| `routes/uploads.ts` | 172 | 6 |
| **Tổng** | **4445** (gồm cả tệp hỗ trợ) | **111 route** |

Dịch vụ tách riêng: `services/pricing.ts` (368 dòng, tính giá/khuyến mãi/phí), `services/tracePdf.ts`
(195, sinh PDF tem/truy xuất), `services/invariants.ts` (43, kiểm bất biến kho),
`services/serviceArea.ts` (76, địa chỉ giao hàng theo phường/xã).
Thư viện: `lib/auth.ts` (116, JWT + thu hồi + CSRF), `lib/password.ts` (22, scrypt), `lib/validate.ts`
(25, zod + ngày), `lib/errors.ts` (28, `AppError` + mã lỗi).

## 2. Mẫu thiết kế dùng xuyên suốt

- **Một handler một route**, không có lớp controller/service trung gian cho CRUD đơn giản; logic
  phức tạp (đặt đơn, phân bổ, xuất kho, hoàn tiền) nằm trong transaction rõ ràng.
- **Xác thực ở đầu handler**: `requireAuth(req)` / `requireAdmin(req)`; route `/me/*` luôn lọc theo
  `req.user.id`. Không có route nào tin tham số client cho `user_id`/`role`.
- **Validate bằng zod** (`parse(z.object({...}), req.body)`), trả 422 `INVALID_DATA` kèm thông điệp
  tiếng Việt.
- **Lỗi có mã**: `errors.notFound('đơn hàng')` → 404; `409 OUT_OF_STOCK`; `409 QUOTE_CHANGED`;
  `422 INVALID_DATA`; `429` do rate limit; 500 kèm `trace_id`.
- **Số tiền luôn tính ở server** (`services/pricing.ts`): client gửi bao nhiêu cũng bị ghi đè; bản
  `quote_version` chống đổi giá sau preview.
- **Idempotency** cho `POST /orders` qua `idempotency_records`, phát lại trả cùng `order_id`.
- **Transaction + khoá hàng** khi phân bổ tồn để tránh oversell:
  `SELECT ... FOR UPDATE` trên `inventory`, rồi `UPDATE reserved_qty`.
- **Phân trang thống nhất**: `?page&pageSize` → `{ data, page, pageSize, total }`.
- **Tệp do server cấp URL**, client không được gửi URL tùy ý (xem `uploads.ts`).

## 3. Nhóm endpoint chính

| Nhóm | Tiền tố | Ví dụ đã kiểm |
|---|---|---|
| Xác thực | `/auth/*` | `login`, `logout`, `customer/register` |
| Công khai | `/categories`, `/products`, `/home`, `/t/:token`, `/t/:token/pdf` | truy xuất không cần đăng nhập |
| Khách | `/me`, `/me/addresses`, `/me/cart`, `/me/orders`, `/me/reviews`, `/me/complaints` | đủ vòng đời |
| Đặt hàng | `/checkout/preview`, `/orders` | tính lại giá, idempotency, `OUT_OF_STOCK` |
| Admin danh mục | `/admin/categories`, `/admin/products`, `/admin/product-images` | CRUD |
| Admin chuỗi cung | `/admin/suppliers`, `/admin/farms`, `/admin/seasons`, `/admin/batches` | tạo lô, nhật ký, công khai |
| Admin chất lượng | `/admin/lab-tests`, `/admin/certificates`, `/admin/evidence` | khoá bán khi Không đạt |
| Admin kho | `/admin/warehouses`, `/admin/inventory`, `/admin/stock/receipts`, `/admin/stock/adjustments`, `/admin/stock/movements` | phiếu có lý do |
| Admin đơn | `/admin/orders/...` (`confirm`, `prepare`, `ship`, `deliver`, `complete`, `delivery_failed`, `reallocate`, `payment`, `shipment`) | máy trạng thái |
| Admin hoàn tiền | `/admin/refunds`, `/admin/refunds/:id/:action` | PENDING→APPROVED→COMPLETED/REJECTED |
| Admin thu hồi | `/admin/recalls`, `/admin/recalls/:id/close`, `/admin/recalls/:id/contacts/:contactId` | biên bản |
| Admin báo cáo | `/admin/reports/revenue`, `/admin/reports/operations`, `/admin/dashboard` | có lọc ngày |
| Tải tệp | `/uploads`, `/admin/uploads`, `/admin/evidence` | riêng tư/công khai theo ngữ cảnh |

## 4. Nhận xét chất lượng

Điểm tốt:
- Không có route báo cáo công khai; `requireAdmin` áp cho mọi `/admin/reports/*` (đã kiểm P1/P2).
- Không có chỗ nào nội suy chuỗi SQL từ input; toàn bộ dùng tham số `$1..$n` (đã thử SQLi P5).
- Lỗi 500 không lộ stack/SQL; mọi lỗi trả `trace_id` để tra log.
- Truy vấn nặng (dashboard, reports, danh sách đơn) dùng một câu SQL có `jsonb_agg` thay vì N+1.

Điểm cần lưu ý:
| # | Nội dung | Mức |
|---|---|---|
| A1 | `public.ts` chứa `/home` trả nhiều khối trong một request; nếu dữ liệu lớn cần cache | Thấp |
| A2 | `adminOps.ts` 1195 dòng — nên tách theo miền (order/stock/recall) khi mở rộng | Thấp |
| A3 | Chưa có versioning `/api/v2`; hiện cố định `/api/v1` | Chấp nhận cho P1 |

## 5. Tương thích với client

Ba client dùng chung một API, không có endpoint riêng:
- `apps/customer-web` gọi qua `lib/api.ts` (server component + cookie).
- `apps/customer-mobile` gọi qua `src/api.ts` (token Bearer, `x-agri-csrf`).
- `apps/admin-web` gọi qua `lib/api.ts` + `admin-kit.tsx`.

Đã kiểm chéo: cùng một tài khoản, giỏ hàng và đơn nhìn thấy như nhau ở web và app (endpoint
`/me/cart`, `/me/orders`).
