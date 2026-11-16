# AgriMarket — bán nông sản theo lô, truy xuất nguồn gốc

Một hệ thống, ba bề mặt giao diện, một cơ sở dữ liệu thật:

| Thành phần | Thư mục | Cổng | Vai trò |
|---|---|---|---|
| Website khách hàng (`/`) + quản trị (`/admin`) | `apps/web` | 3000 | Next.js 15 (App Router, Server Components) |
| Ứng dụng khách hàng (React Native / Expo) | `apps/customer-mobile` | 8081 (web) | Expo SDK 58, quét QR bằng camera |
| API | `apps/api` | 4000 | Fastify 5 + PostgreSQL 18, SQL thuần |

Không ORM, không mock. Toàn bộ dữ liệu demo sinh từ `apps/api/src/scripts/seed.ts`.

## Chạy nhanh

```bash
pnpm install

# 1. PostgreSQL nhúng (không cần Docker), cổng 5544
node scripts/db.mjs up

# 2. Bảng + dữ liệu mẫu
pnpm db:migrate
pnpm db:seed

# 3. API
pnpm api            # http://localhost:4000/api/v1  (Swagger: /docs)

# 4. Website
pnpm web            # http://localhost:3000

# 5. Ứng dụng di động
pnpm mobile         # Expo: quét QR bằng Expo Go, hoặc bấm w để chạy bản web
```

Sao chép `apps/api/.env.example` → `apps/api/.env` và `apps/web/.env.example` → `apps/web/.env.local` trước khi chạy.

> Dùng `http://localhost:3000`, **không** dùng `http://127.0.0.1:3000`: danh sách `CORS_ORIGINS` chứa `localhost`, nên mọi thao tác ghi từ origin `127.0.0.1` sẽ hỏng preflight.

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị | `admin@agrimarket.vn` | `Admin@123456` |
| Khách hàng | `khach1@example.com` | `Khach@123456` |
| Khách hàng | `khach2@example.com` | `Khach@123456` |

Mã QR demo (nhập vào `/tim-kiem` hoặc tab **Quét QR**): `demo-ca-chua-lo-0001`, `demo-ca-chua-lo-0002`, `demo-ca-chua-het-han`, `demo-xoai-lo-0005`, `demo-rau-muong`, `demo-buoi-da-xanh`, `demo-gao-st25`, `demo-mat-ong-rung`.

## Kiểm thử

```bash
pnpm test          # 20 test tích hợp, chạy trên agrimarket_test
pnpm typecheck     # tsc --noEmit cho cả ba gói
pnpm build         # next build + tsc
```

## Tài liệu

- `docs/architecture.md` — kiến trúc, luồng dữ liệu, quyết định thiết kế.
- `docs/ERD.md` — lược đồ quan hệ (Mermaid).
- `docs/use-cases.md` — ca sử dụng theo vai trò.
- `docs/state-machines.md` — vòng đời đơn hàng, lô hàng, thu hồi.
- `docs/ADR.md` — nhật ký quyết định kiến trúc.
- `docs/requirements-traceability.md` — ADM-01…13, APP-01…12, CUS-* → mã nguồn + test.
- `docs/test-report.md` — kết quả 20 test và phạm vi phủ.
- `docs/demo-script.md` — kịch bản demo 10 bước.
- `docs/IMPLEMENTATION_STATUS.md` — việc đã xong / còn thiếu.
- `docs/IMAGE_SOURCES.md` — nguồn ảnh sản phẩm.

## Nguyên tắc dữ liệu

- Tiền là số nguyên VND; khối lượng `numeric(12,3)`; thời gian lưu UTC, hiển thị `Asia/Ho_Chi_Minh`.
- Tồn khả dụng **không bao giờ được lưu**; tính bằng `SELLABLE_SQL` trong `apps/api/src/services/invariants.ts`.
- Bất biến chống bán quá tồn nằm ở câu `UPDATE … WHERE on_hand_qty - reserved_qty >= $n RETURNING` bên trong transaction đặt hàng.
- Phân bổ lô mặc định FIFO theo ngày nhập kho; FEFO bật được ở `/admin/cai-dat` (`settings.allocation_strategy`).
