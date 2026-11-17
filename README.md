# AgriMarket — bán nông sản theo lô, truy xuất nguồn gốc

Một API, một cơ sở dữ liệu, **hai website độc lập** cộng một ứng dụng di động:

| Thành phần | Thư mục | Cổng | Vai trò |
|---|---|---|---|
| Cửa hàng | `apps/customer-web` | 3000 | Next.js 15 (App Router, Server Components) |
| Quản trị | `apps/admin-web` | 3001 | Dashboard SaaS, toàn bộ `/admin/*` |
| Ứng dụng khách hàng (Expo) | `apps/customer-mobile` | 8081 (web) | Expo SDK 58, quét QR bằng camera |
| API | `apps/api` | 4000 | Fastify 5 + PostgreSQL 18, SQL thuần |
| Gói dùng chung | `packages/core`, `packages/ui` | — | Kiểu dữ liệu + client, token CSS + component |

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

# 4. Hai website (mỗi lệnh một tiến trình)
pnpm shop           # http://localhost:3000  cửa hàng
pnpm admin          # http://localhost:3001  quản trị

# 5. Ứng dụng di động
pnpm mobile         # Expo: quét QR bằng Expo Go, hoặc bấm w để chạy bản web
```

Sao chép `.env.example` → `.env.local` trong `apps/api`, `apps/customer-web` và `apps/admin-web` trước khi chạy.

> Dùng `http://localhost:3000` và `http://localhost:3001`, **không** dùng `127.0.0.1`: `CORS_ORIGINS` chỉ chứa `localhost`, nên mọi thao tác ghi từ origin `127.0.0.1` sẽ hỏng preflight.

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị | `admin@agrimarket.vn` | `Admin@123456` |
| Khách hàng | `khach1@example.com` | `Khach@123456` |
| Khách hàng | `khach2@example.com` | `Khach@123456` |

Mã QR demo (nhập vào `/tim-kiem` hoặc tab **Quét QR**): `demo-ca-chua-lo-0001`, `demo-ca-chua-lo-0002`, `demo-ca-chua-het-han`, `demo-xoai-lo-0005`, `demo-rau-muong`, `demo-buoi-da-xanh`, `demo-gao-st25`, `demo-mat-ong-rung`.

## Kiểm thử

```bash
pnpm test          # 51 test tích hợp (8 tệp), chạy trên agrimarket_test
pnpm typecheck     # tsc --noEmit cho cả sáu gói
pnpm build         # next build + tsc
```

## Tài liệu

- `docs/architecture.md` — kiến trúc hai website, gói dùng chung, luồng dữ liệu.
- `docs/ERD.md` — lược đồ quan hệ (Mermaid).
- `docs/use-cases.md` — ca sử dụng theo vai trò.
- `docs/state-machines.md` — vòng đời đơn hàng, lô hàng, thu hồi.
- `docs/ADR.md` — nhật ký quyết định kiến trúc.
- `docs/requirements-traceability.md` — ADM-01…13, APP-01…12, CUS-* → mã nguồn + test.
- `docs/test-report.md` — kết quả 51 test và phạm vi phủ.
- `docs/ADDRESS_SERVICE_AREA_HUNG_YEN.md` — 104 xã/phường Hưng Yên, chọn địa chỉ, phí giao, vận hành bật/tắt xã.
- `docs/demo-script.md` — kịch bản demo 10 bước.
- `docs/IMPLEMENTATION_STATUS.md` — việc đã xong / còn thiếu.
- `docs/IMAGE_SOURCES.md` — nguồn ảnh sản phẩm.

## Nguyên tắc dữ liệu

- Tiền là số nguyên VND; khối lượng `numeric(12,3)`; thời gian lưu UTC, hiển thị `Asia/Ho_Chi_Minh`.
- Tồn khả dụng **không bao giờ được lưu**; tính bằng `SELLABLE_SQL` trong `apps/api/src/services/invariants.ts`.
- Bất biến chống bán quá tồn nằm ở câu `UPDATE … WHERE on_hand_qty - reserved_qty >= $n RETURNING` bên trong transaction đặt hàng.
- Phân bổ lô mặc định FIFO theo ngày nhập kho; FEFO bật được ở `/admin/cai-dat` (`settings.allocation_strategy`).
- Giao hàng **chỉ trong tỉnh Hưng Yên**: địa chỉ lưu bằng mã xã/phường (`wards.code`), server kiểm lại vùng giao trong transaction đặt hàng. Phí 20.000₫, miễn phí từ 500.000₫.

## Vận hành an toàn

- `pnpm db:seed` chỉ chạy được khi `NODE_ENV=test`/`demo` hoặc đặt `ALLOW_DESTRUCTIVE_SEED=yes`; lệnh này `TRUNCATE` toàn bộ dữ liệu.
- `/api/v1/uploads/:name` trả ảnh catalogue công khai; ảnh khách gửi và hồ sơ lô chỉ mở cho chủ sở hữu/admin, hồ sơ lô chỉ khi lô đã công bố.
- Chạy Expo trên điện thoại thật: đặt LAN IP vào `.env` của `apps/customer-mobile` (`EXPO_PUBLIC_API_BASE=http://<IP>:4000/api/v1`), API phải có IP đó trong `CORS_ORIGINS`.
- CI: `.github/workflows/ci.yml` chạy typecheck → build → vitest trên PostgreSQL 18 + quét secret.
