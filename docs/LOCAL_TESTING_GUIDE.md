# Hướng dẫn kiểm thử local — AgriMarket

Toàn bộ nghiệm thu chạy trên máy cá nhân với PostgreSQL, API và web thật. GitHub chỉ lưu mã nguồn:
**không có GitHub Actions CI** — bằng chứng nghiệm thu là kết quả `pnpm verify:local` + E2E local.

## 0. Yêu cầu

| Thành phần | Phiên bản |
|---|---|
| Node.js | ≥ 22 (đã kiểm trên 26) |
| pnpm | 12.x (`packageManager: pnpm@12.9.1`) |
| Windows | PowerShell hoặc CMD (script không dùng Bash) |
| Trình duyệt | Chrome/Edge/Chromium cho E2E (tự dò, không cần tải thêm) |

## 1. Cài đặt

```bash
pnpm install
cp apps/api/.env.example apps/api/.env      # Windows: copy apps\api\.env.example apps\api\.env
```

`apps/api/.env` cần `DATABASE_URL` và `JWT_SECRET` (≥ 24 ký tự). File `.env` bị `.gitignore` chặn — không commit.

## 2. Khởi động PostgreSQL

```bash
pnpm db:up      # PostgreSQL nhúng 18.6, cổng 5544, dữ liệu ở infra/pgdata
pnpm db:down    # dừng
```

CSDL `agrimarket` do script tạo; CSDL `agrimarket_test` dùng riêng cho kiểm thử tích hợp
(`apps/api/vitest.config.ts` trỏ cứng vào `agrimarket_test`).

## 3. Chạy migration

```bash
pnpm db:migrate     # áp mọi file trong apps/api/migrations theo thứ tự, ghi schema_migrations
```

Migration hiện có:

| File | Nội dung |
|---|---|
| `001_init.sql` | 41 bảng nghiệp vụ |
| `002_code_sequences.sql` | cấp mã đơn/khiếu nại nguyên tử |
| `003_session_revocations.sql` | thu hồi phiên theo `jti` |
| `004_service_area.sql` | 104 xã/phường Hưng Yên + cột `addresses.ward_code` |
| `005_reconcile_ward_codes.sql` | đối soát 5 mã xã theo Phụ lục II QĐ 19/2025 |

`004` chèn thẳng mã chuẩn (11986, 12052, 12220, 12478, 12841) và **không** đổi mã, nên nó
idempotent trên CSDL mới lẫn CSDL đã áp bản cũ. `005` xử lý phần dữ liệu còn sót:
bản cũ đang dùng mã legacy, bản đã sửa tay, và bản có cả hai dòng. Chạy lại nhiều lần không đổi kết quả.
Snapshot địa chỉ trong `orders.address_snapshot` là dữ liệu lịch sử — không bị sửa.

Kiểm thử riêng cho `005` tạo/drop CSDL nháp (`agrimarket_ward_check_0..2`):

```bash
cd apps/api && pnpm exec vitest run test/09-ward-reconcile.test.ts
```

## 4. Seed dữ liệu demo

```bash
pnpm db:seed    # chỉ chạy khi NODE_ENV=test|demo hoặc ALLOW_DESTRUCTIVE_SEED=yes; TRUNCATE toàn bộ
```

## 5. Khởi động các dịch vụ

```bash
pnpm api      # API      http://localhost:4000  (+ /docs Swagger)
pnpm shop     # Customer http://localhost:3000
pnpm admin    # Admin    http://localhost:3001
pnpm mobile   # Expo     http://localhost:8081
```

Kiểm tra API: `curl http://127.0.0.1:4000/api/v1/health` → `{"status":"ok"}`.

## 6. Expo

- Web: `pnpm mobile` rồi mở `http://localhost:8081` (hoặc `cd apps/customer-mobile && npx expo start --web`).
- Điện thoại thật qua Expo Go: đặt LAN IP của máy vào `apps/customer-mobile/.env`
  (`EXPO_PUBLIC_API_BASE=http://<IP>:4000/api/v1`) và thêm `http://<IP>:8081` vào `CORS_ORIGINS` của API.
- Native Android/iOS (camera, SecureStore, deep link) **BLOCKED** trên máy không có adb/emulator;
  kết quả Expo Web không thay thế nghiệm thu native.

## 7. Kiểm thử local

```bash
pnpm verify:local          # 10 bước, exit 1 nếu bất kỳ bước nào fail
pnpm verify:local --skip-admin --skip-customer --skip-expo   # bỏ bước nặng khi cần
```

Các bước: cấu hình `.env` → PostgreSQL → CSDL test → `pnpm -r typecheck` → 56 API tests →
build Admin Web → build Customer Web → typecheck Expo → `expo export --platform web` → quét bí mật
(`git ls-files -co`). Kết quả in bảng PASS/FAIL cuối cùng.

Kiểm bí mật độc lập trước khi push:

```bash
git ls-files -co --exclude-standard | xargs grep -nE "(BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|sk_live_)"
```

E2E Playwright (cần API + shop + admin đang chạy):

```bash
pnpm e2e:local     # 9 bước: trang chủ, login khách, giỏ, địa chỉ Như Quỳnh, đặt đơn, login admin, hộp vùng giao
```

API proof 31 kịch bản trên API đang chạy (script lịch sử, không nằm trong repo):

```bash
node .audit/api-proof.mjs
```

## 8. Xử lý lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| `ECONNREFUSED 127.0.0.1:5544` | `pnpm db:up`, đợi dòng `postgres up on 5544` |
| `database "agrimarket_test" does not exist` | `pnpm db:up` tạo lại CSDL test; nếu vẫn thiếu: `psql -p 5544 -U agri -d postgres -c 'CREATE DATABASE agrimarket_test'` |
| Test treo ở `seeding…` | Có tiến trình khác giữ CSDL test; đóng `pnpm test` cũ rồi chạy lại |
| Next build lỗi `Failed to fetch`/port bận | Tắt `next dev` đang giữ 3000/3001 trước khi build |
| `expo export` fail | Chạy `cd apps/customer-mobile && npx expo export --platform web --output-dir ../../.verify/expo-web` để xem log đầy đủ |
| Playwright: `Executable doesn't exist` | Đặt `PLAYWRIGHT_CHROMIUM=C:\...\chrome.exe`; script cũng tự dò bản chromium trong `%LOCALAPPDATA%\ms-playwright` |
| Migration 004 báo lỗi khóa ngoại | CSDL đã áp bản 004 cũ: chỉ cần `pnpm db:migrate` để chạy `005` |

## 9. Trước khi push GitHub

```bash
git status                       # không có .env, node_modules, infra/pgdata, .next
pnpm verify:local                # phải PASS toàn bộ
pnpm e2e:local                   # E2E trên stack đang chạy
git diff --stat                  # rà lại phạm vi thay đổi
```

Chỉ push lên nhánh làm việc; `main` giữ nguyên cho tới khi được yêu cầu hợp nhất. Không force push.
