# Kiến trúc AgriMarket

## 1. Tổng quan

```mermaid
graph TB
  subgraph Clients
    C["Next.js 15 · apps/customer-web<br/>localhost:3000 — cửa hàng"]
    A1["Next.js 15 · apps/admin-web<br/>localhost:3001 — quản trị /admin"]
    M["Expo React Native<br/>apps/customer-mobile"]
  end
  subgraph Shared["packages/ dùng chung"]
    CORE["@agrimarket/core<br/>types · format · api client"]
    UI["@agrimarket/ui<br/>tokens · primitives · icons"]
  end
  A["Fastify 5 API<br/>apps/api · :4000 · /api/v1"]
  P[("PostgreSQL 18<br/>cổng 5544")]
  PDF["PDFKit<br/>Roboto-Regular.ttf"]

  C --> CORE
  A1 --> CORE
  A1 --> UI
  C --> UI
  C -->|"cookie am_token<br/>+ x-agri-csrf"| A
  A1 -->|"cookie am_token<br/>+ x-agri-csrf"| A
  M -->|"Bearer token"| A
  A --> P
  A --> PDF
```

Hai website độc lập, một API, một cơ sở dữ liệu, hai gói dùng chung. `apps/api` là nơi duy nhất nói chuyện với cơ sở dữ liệu. Cả hai website dùng Server Components gọi API nội bộ kèm cookie phiên; ứng dụng di động dùng Bearer token. `packages/core` giữ hình dạng dữ liệu và client `fetch`, `packages/ui` giữ token Tailwind + component nguyên thuỷ, nên ba bề mặt không lệch nhau. Không GraphQL, không ORM client, không store toàn cục.

| Bề mặt | Thư mục | Cổng | Vai trò |
|---|---|---|---|
| Cửa hàng | `apps/customer-web` | 3000 | Mua hàng, tra cứu QR, tài khoản, khiếu nại |
| Quản trị | `apps/admin-web` | 3001 | Toàn bộ ADM-01…13 dưới `/admin/*` |
| API | `apps/api` | 4000 | Nghiệp vụ + phân quyền (nguồn chân lý) |
| Di động | `apps/customer-mobile` | 8081 | Expo, 5 tab, dùng chung `packages/core` |

Cookie phiên có phạm vi theo host chứ không theo cổng, nên đăng nhập ở `localhost:3000` cũng mở được `localhost:3001/admin`. Phân quyền vẫn do API quyết định: cookie khách hàng gọi `/admin/orders` trả `403`.

## 2. Tầng nghiệp vụ

| Nhóm | Vị trí | Trách nhiệm |
|---|---|---|
| Bất biến lô bán được | `apps/api/src/services/invariants.ts` | `SELLABLE_SQL`, `SHIPPABLE_SQL`, `TODAY`, `roundVnd`, `roundQty` — mọi truy vấn ghi/đọc đều nhúng các mảnh này, không viết lại inline. |
| Tính giá & phân bổ lô | `apps/api/src/services/pricing.ts` | Dựng báo giá (`buildQuote`), chọn lô theo FIFO/FEFO, áp khuyến mãi, sinh `version` (hash) để phát hiện đổi giá. |
| In PDF truy xuất | `apps/api/src/services/tracePdf.ts` | Nhúng font tĩnh Roboto-Regular (font biến thiên bị lỗi glyph), dựng hồ sơ A4. |
| Xác thực | `apps/api/src/lib/auth.ts`, `password.ts` | JWT (jose HS256) trong cookie hoặc Bearer; mật khẩu băm bằng `node:crypto` scrypt dạng `scrypt$N$salt$hash`. |

`pricing.ts` là điểm duy nhất quyết định "đơn này lấy hàng ở lô nào". Nó trả về báo giá có `version`; `POST /orders` bắt buộc gửi lại `quote_version`, lệch → `409 PRICE_CHANGED` kèm báo giá mới. Nhờ vậy khách luôn thấy đúng số tiền và đúng lô trước khi tồn kho bị giữ.

## 3. Bất biến tồn kho

Không có cột "available". Tồn khả dụng là biểu thức:

```
on_hand_qty - reserved_qty   -- của các lô thoả SELLABLE_SQL
```

`reserved_qty` tăng khi đặt hàng, giảm khi huỷ hoặc khi xuất kho; `on_hand_qty` chỉ giảm khi thực xuất. Chống bán quá tồn dựa hoàn toàn vào cơ sở dữ liệu:

```sql
UPDATE inventory SET reserved_qty = reserved_qty + $3
 WHERE batch_id = $1 AND warehouse_id = $2
   AND on_hand_qty - reserved_qty >= $3
RETURNING id
```

Không có `RETURNING` nghĩa là thua cuộc đua — transaction huỷ, khách nhận `OUT_OF_STOCK`. Không cần khoá bi quan, không cần kiểm tra ở tầng ứng dụng.

## 4. Luồng đặt hàng

```mermaid
sequenceDiagram
  participant K as Khách (web/app)
  participant A as API
  participant D as PostgreSQL

  K->>A: POST /checkout/preview
  A->>D: SELECT lô thoả SELLABLE_SQL ORDER BY ngày nhập (FIFO)
  A-->>K: Quote{lines[].allocations[], total_vnd, version}
  K->>A: POST /orders + Idempotency-Key + quote_version
  A->>D: BEGIN
  A->>D: UPDATE inventory … WHERE on_hand-reserved >= qty RETURNING
  A->>D: INSERT orders, order_lines, order_line_allocations, idempotency_records
  A->>D: COMMIT
  A-->>K: 201 {order_id, code}
```

`Idempotency-Key` ghi vào bảng `idempotency_records` trong cùng transaction, nên gửi lại cùng khoá trả về đúng đơn cũ thay vì tạo đơn thứ hai.

## 5. Truy xuất nguồn gốc

Chuỗi dữ liệu: `suppliers → farms → crop_seasons → cultivation_logs → batches → lab_tests/certificates → qr_codes → qr_scans`.

Điều kiện công bố (Admin V3.0 §6.3) được kiểm ở đúng một chỗ — route `POST /admin/batches/:id/publish`:

1. Lô có phiếu kiểm nghiệm `overall_result = 'PASS'` và `is_effective = true`.
2. Không còn thời gian cách ly thuốc BVTV: `harvest_date >= activity_at + isolation_days`.
3. `quality_status = 'PASS'`, `safety_status = 'NORMAL'`.

`GET /t/:token` chỉ trả lô đã `PUBLISHED`; lô nháp hoặc bị thu hồi trả 404/thông báo thu hồi. Toàn bộ payload không chứa email hay số điện thoại khách hàng — test `#20` xác nhận điều này sau khi giải nén các luồng Flate của PDF.

## 6. Xác thực và phân quyền

- Cookie `am_token` (httpOnly, SameSite=Lax) cho web; Bearer cho ứng dụng di động.
- Mọi mutation bằng cookie phải kèm header `x-agri-csrf: 1`; Bearer miễn.
- `requireUser` / `requireCustomer` / `requireAdmin` chặn ở tầng route; test `authorisation` xác nhận khách không gọi được endpoint quản trị và không đọc được đơn của người khác.
- Đăng nhập sai 5 lần → khoá tạm thời, ghi `login_attempts`.

## 7. Cơ sở dữ liệu nhúng

`scripts/db.mjs` dùng `embedded-postgres` (18.6) với `initdbFlags: ['--encoding=UTF8', '--locale=C']`, dữ liệu ở `infra/pgdata`, cổng 5544. Không cần Docker, không cần cài PostgreSQL hệ thống. `postgres.exe` giữ DLL trong `node_modules` — không xoá `node_modules` khi tiến trình còn chạy.

## 8. Giao diện

- Chuỗi CSS một chiều: `@import 'tailwindcss'` → `@import '@agrimarket/ui/styles.css'` → `@source` ba thư mục. **`@import 'tailwindcss'` phải nằm trong `app/globals.css` của từng app**, không được đặt trong package liên kết tượng trưng: Tailwind v4 không dò được nội dung tương đối với symlink và xuất stylesheet rỗng (triệu chứng: trang không style, cao 38 000 px).
- Token thương hiệu: `brand` (xanh nông nghiệp) thay `leaf`, `sand` thay `clay`, `ink` cho chữ. Bí danh `--color-leaf-*`/`--color-clay-*` được khai báo trong `packages/ui/src/styles.css` nên các trang quản trị cũ vẫn đúng màu.
- Lớp tiện ích dùng chung: `.btn-primary/.btn-secondary/.btn-ghost/.btn-danger`, `.card`, `.input`, `.label`, `.badge`, `.chip`, `.table-base`, `.kpi-value`, `.skeleton`.
- Cửa hàng (20 route): hero + danh mục + khuyến mãi, danh sách có bộ lọc phía máy chủ, chi tiết có thư viện ảnh và hộp mua dính, trang tra cứu QR, tài khoản/đơn hàng/thanh toán.
- Quản trị (18 route dưới `/admin`): shell cố định có nhóm điều hướng, bảng cuộn ngang, phân trang phía máy chủ, hộp thoại nhập lý do thay `window.prompt` để kiểm thử tự động chạy được.
- Ảnh: thẻ `<img>` thường + `mediaUrl()` trỏ về origin API (`/uploads/...`); không dùng `next/image` vì tài nguyên nằm ngoài app.

## 9. Gói dùng chung

| Gói | Nội dung | Ai dùng |
|---|---|---|
| `@agrimarket/core` | `types.ts` (hình dạng dữ liệu), `format.ts` (tiền/số lượng/ngày + nhãn trạng thái), `client.ts` (`configureApi`, `api`, `serverFetch`), `api-error.ts`, `status.ts` | `admin-web`, `customer-web`, `customer-mobile` |
| `@agrimarket/ui` | `styles.css` (token + lớp), `icons.tsx`, `primitives.tsx`, `interactive.tsx` | hai website (di động dùng `theme.ts` tương đương) |

Mỗi app giữ shim mỏng `lib/api.ts`, `lib/format.ts`, `lib/config.ts`, `lib/session.ts` để đường dẫn import cũ không phải viết lại. Di động khai báo `"@agrimarket/core": "workspace:*"` và `metro.config.js` thêm `watchFolders` trỏ `packages/`.

- Di động: một `App.tsx` giữ tab + stack cục bộ (`useState`), không dùng `expo-router` (peer graph kéo theo reanimated, worklets, `@expo/ui` — quá nặng cho 5 tab). `src/format.ts` và `src/types.ts` chỉ re-export từ `@agrimarket/core`.
