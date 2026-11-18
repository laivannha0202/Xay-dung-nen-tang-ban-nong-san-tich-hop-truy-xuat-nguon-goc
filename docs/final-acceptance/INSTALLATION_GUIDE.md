# Hướng dẫn cài đặt

Đã kiểm trên Windows 10.0.26100, Node 26.12.0, pnpm 12.9.1. Lệnh tương đương Linux/macOS khi khác nhau.

## 0. Yêu cầu

| Thành phần | Phiên bản | Ghi chú |
|---|---|---|
| Node.js | ≥ 22 | đã chạy trên 26.12.0 |
| pnpm | 12.x | `packageManager: pnpm@12.9.1` |
| PostgreSQL | không cần cài | repo dùng PostgreSQL nhúng 18.6 (`embedded-postgres`), dữ liệu ở `infra/pgdata` |
| Trình duyệt | Chrome/Edge | không bắt buộc; chỉ cần cho `pnpm e2e:local` |

Cổng dùng: **5544** PostgreSQL, **4000** API, **3000** cửa hàng, **3001** Admin, **8081** Expo web.

## 1. Lấy mã và cài phụ thuộc

```bash
git clone <repo> && cd agrimarket
pnpm install
cp apps/api/.env.example apps/api/.env
# Windows: copy apps\api\.env.example apps\api\.env
```

`apps/api/.env` tối thiểu:

```ini
DATABASE_URL=postgres://agri:agri@127.0.0.1:5544/agrimarket
JWT_SECRET=<chuỗi ngẫu nhiên ≥ 24 ký tự>
PORT=4000
NODE_ENV=development
```

`.env` đã nằm trong `.gitignore` — không commit.

## 2. Bật cơ sở dữ liệu

```bash
pnpm db:up        # khởi động PostgreSQL nhúng, cổng 5544, tạo DB agrimarket nếu chưa có
```

Lần đầu script sẽ `initdb` vào `infra/pgdata` (khoảng 10 giây). Dừng bằng `pnpm db:down`
(**luôn dừng trước khi sao lưu** — xem `BACKUP_RESTORE_GUIDE.md`).

## 3. Tạo schema và dữ liệu

```bash
pnpm db:migrate   # áp 9 migration theo thứ tự, ghi schema_migrations
pnpm db:seed      # dữ liệu gốc: 4 tài khoản, danh mục, sản phẩm, kho, 104 phường/xã
```

Bổ sung dữ liệu demo phong phú (khuyến nghị cho demo/bảo vệ):

```bash
cd apps/api
npx tsx src/scripts/seed-demo-catalog.ts
npx tsx src/scripts/seed-demo-orders.ts
```

> Nếu `pnpm db:migrate` không báo lỗi rõ ràng trên Windows, chạy trực tiếp:
> `cd apps/api && npx tsx src/scripts/migrate.ts`

## 4. Chạy dịch vụ

Mở 4 terminal (hoặc dùng nhiều cửa sổ):

| Terminal | Lệnh | Địa chỉ |
|---|---|---|
| 1 | `pnpm api` | `http://127.0.0.1:4000/api/v1/health` |
| 2 | `pnpm shop` | `http://localhost:3000` |
| 3 | `pnpm admin` | `http://localhost:3001/admin` |
| 4 | `pnpm mobile` | Expo; nhấn `w` để mở bản web ở `http://localhost:8081` |

Kiểm nhanh:

```bash
curl http://127.0.0.1:4000/api/v1/health
curl -o /dev/null -w "%{http_code}\n" http://localhost:3000
curl -o /dev/null -w "%{http_code}\n" http://localhost:3001/admin
```

## 5. Tài khoản

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@agrimarket.vn` | `Admin@123456` |
| Khách 1 | `khach1@example.com` | `Khach@123456` |
| Khách 2 | `khach2@example.com` | `Khach@123456` |

## 6. Kiểm chứng cài đặt đúng

```bash
pnpm -r typecheck            # 6/6 package
cd apps/api && npx vitest run # 12 file / 62 test
cd ../.. && node scripts/acceptance-walk.mjs   # 38/38 bước
```

`pnpm verify:local` chạy tất cả cộng với build và quét bí mật, nhưng **phải tắt `next dev`** trước
(bước build xoá `.next`, làm hỏng dev server đang chạy).

## 7. Sự cố thường gặp

| Hiện tượng | Nguyên nhân | Xử lý |
|---|---|---|
| `ECONNREFUSED 5544` | PostgreSQL chưa chạy | `pnpm db:up` |
| `lock file "postmaster.pid" already exists` | Bản sao dữ liệu còn pid cũ | xoá `infra/pgdata/postmaster.pid` **chỉ khi không còn tiến trình postgres** |
| CORS khi mở `127.0.0.1:3000` | Cấu hình CORS chỉ cho `localhost` | dùng `http://localhost:3000` |
| Trang 500 sau khi chạy `verify:local` | `.next` bị xoá khi dev server đang chạy | dừng và chạy lại `pnpm shop` / `pnpm admin` |
| `permission denied` khi upload | thư mục `apps/api/uploads` chưa tồn tại | script upload tự tạo; nếu không, tạo thủ công |
