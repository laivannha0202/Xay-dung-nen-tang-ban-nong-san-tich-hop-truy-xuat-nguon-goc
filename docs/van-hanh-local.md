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
