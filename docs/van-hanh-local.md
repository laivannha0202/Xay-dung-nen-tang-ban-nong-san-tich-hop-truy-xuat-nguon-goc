# Vận hành local AgriMarket — chuẩn native + Expo LAN

## Nguyên tắc

Luồng phát triển local hiện tại **không dùng Docker** và **không dùng ADB/USB reverse**.

Hạ tầng bắt buộc:

| Thành phần | Địa chỉ |
|---|---|
| MySQL native | `127.0.0.1:3306` |
| Redis/Memurai native | `127.0.0.1:6379` |
| API | `http://127.0.0.1:3000` |
| Customer Web | `http://127.0.0.1:3001` |
| Admin Web | `http://127.0.0.1:3002` |
| Expo Metro | `:8081`, chế độ LAN |

Mobile dùng Expo Go qua cùng mạng LAN/Wi-Fi. Launcher tự phát hiện IPv4 của máy và inject:

```text
EXPO_PUBLIC_API_BASE_URL=http://<LAN_IP_CUA_MAY>:3000
```

Không dùng `127.0.0.1` trên điện thoại thật.

## Chuẩn bị lần đầu

```bash
pnpm install
```

Tạo `.env` từ `.env.example`, sau đó đảm bảo MySQL và Redis/Memurai native đang chạy.

### Database: dev/demo vs test

| Biến | Mục đích | Ví dụ |
|---|---|---|
| `DATABASE_URL` | Database **development/demo** (chạy app, seed demo) | `.../agrimarket` |
| `TEST_DATABASE_URL` | Database **riêng cho test** e2e/true-db + release gate | `.../agrimarket_test` |

Nguyên tắc bắt buộc:

- Test E2E/true-db **không bao giờ** được chạy trên `DATABASE_URL` dev.
- Thiếu `TEST_DATABASE_URL`, hoặc để trùng `DATABASE_URL` → test **fail-fast** (exit 2).
  Đây là hành vi cố ý để bảo vệ database demo đang dùng trình diễn.
- `pnpm setup:local` tự tạo database test và cấp quyền cho user `agrimarket`.

```cmd
pnpm --filter @agrimarket/api exec prisma migrate deploy --config prisma7.config.ts
```

> Lưu ý: `prisma7.config.ts` đọc `DATABASE_URL`. Khi migrate cho database test,
> hãy override `DATABASE_URL` trỏ sang database test cho đúng lệnh đó.

### Dọn fixture E2E sót lại trong DB dev

```cmd
pnpm cleanup:e2e-public                              # dry-run, chỉ báo cáo
set DEV_CLEANUP_CONFIRM=YES && pnpm cleanup:e2e-public -- --xac-nhan
```

Cleanup chạy ở tầng dữ liệu (không filter tên ở frontend), bảo vệ canonical demo seed,
và idempotent. Chi tiết cơ chế marker xem `apps/api/scripts/cleanup-e2e-public-fixtures.ts`.

Kiểm tra:

```bash
pnpm doctor
```

## Lệnh chạy

Toàn bộ API + Customer + Admin + Mobile:

```bash
pnpm dev
```

Chỉ web stack:

```bash
pnpm dev:web
```

API + Mobile:

```bash
pnpm dev:mobile
```

API + Expo foreground (có QR code để quét bằng Expo Go):

```bash
pnpm dev:mobile:go
```

> Vì sao `pnpm dev` không có QR? Launcher chạy mọi tiến trình với stdout qua pipe để ghi
> `logs/*.log`, nên Expo CLI thấy `process.stdout.isTTY === undefined` và bỏ qua Terminal UI
> (chỉ in `Waiting on http://localhost:8081`). `pnpm dev:mobile:go` giao terminal thật cho
> Expo nên QR hiện bình thường. Nếu chạy cả hai cùng lúc, port `8081` sẽ bị trùng — hãy
> chỉ chạy một trong hai.

Muốn **full stack + QR** thì tách 2 terminal:

```bash
# terminal 1: API + Customer + Admin (không giữ 8081)
pnpm dev:web
# terminal 2: Expo foreground, có QR
pnpm dev:mobile:go
```

Từng phần:

```bash
pnpm dev:api
pnpm dev:customer
pnpm dev:admin
```

Nếu máy có nhiều card mạng và Expo chọn sai IP:

```powershell
$env:AGRIMARKET_LAN_IP="192.168.1.10"
pnpm dev:mobile
```

## Smoke test

Khi toàn bộ stack đang chạy:

```bash
pnpm runtime:smoke
```

Nếu chỉ chạy web và không muốn kiểm tra Metro:

```powershell
$env:CHECK_MOBILE="0"
pnpm runtime:smoke
```
