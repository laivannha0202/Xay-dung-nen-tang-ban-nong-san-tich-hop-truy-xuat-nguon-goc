# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

28/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 1 – Khởi tạo 4 ứng dụng
Tiến độ code thực tế: Backend NestJS + Prisma/MySQL foundation đã sẵn sàng; Customer Web/Admin Web/Mobile chưa khởi tạo
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-006 – Kết nối Prisma + MySQL**

Đã thiết lập:

- Prisma 7.10.0 với MySQL;
- `prisma7.config.ts`;
- `prisma/schema.prisma` foundation chưa có model nghiệp vụ;
- generated Prisma Client dùng `prisma-client`, output riêng, CommonJS;
- generated relative import không có extension để tương thích NestJS/Jest hiện tại;
- Jest 29 chạy với `NODE_OPTIONS=--experimental-vm-modules` vì Prisma 7 query compiler tải WASM runtime bằng dynamic import;
- `@prisma/adapter-mariadb` cho Prisma 7 runtime;
- `PrismaModule` + `PrismaService`;
- `DATABASE_URL` local `127.0.0.1:3307`;
- shadow database riêng cho `prisma migrate dev`;
- migration foundation đầu tiên;
- kiểm tra kết nối thật `SELECT 1`;
- `prisma validate`, `prisma generate`, `prisma migrate status`.

Chưa tạo bảng nghiệp vụ.

## Phiên tiếp theo

**PHIEN-007 – Khởi tạo Customer Web**

Mục tiêu:

```text
Next.js
Mantine
Mantine UI
TanStack Query
Zustand
AppShell
Theme
QueryClient
Error boundary cơ bản
Trang /
```

Không thay đổi Backend ngoài sửa lỗi bắt buộc nếu phát hiện.

## Đã hoàn thành

### Phân tích

- [x] Tên đề tài
- [x] 3 Actor
- [x] Yêu cầu chức năng
- [x] Yêu cầu phi chức năng
- [x] UML
- [x] Thiết kế Android
- [x] Thiết kế Customer Web
- [x] Thiết kế Admin Web
- [x] Stack công nghệ
- [x] Quy ước code tiếng Việt

### Repository

- [x] GitHub repository
- [x] `.gitignore`
- [x] Script cập nhật GitHub
- [x] Script tạo bối cảnh cho GPT
- [x] `docs/BOI_CANH_DU_AN_CHO_GPT.md`
- [x] Bộ tài liệu điều phối AI
- [x] Skeleton Monorepo
- [x] pnpm workspace

## Chưa làm

### Foundation

- [x] Monorepo đã xác nhận bằng `pnpm install`
- [x] ESLint chung
- [x] Prettier chung
- [x] TypeScript config chung
- [x] Docker Compose

### Applications

- [x] NestJS Backend
- [ ] Customer Web
- [ ] Admin Web
- [ ] Mobile Expo

### Backend

- [x] Prisma
- [ ] MySQL schema
- [x] Swagger
- [ ] Auth
- [ ] RBAC
- [ ] Audit
- [ ] File upload
- [ ] Redis/BullMQ

### Nghiệp vụ

- [ ] Nhà cung cấp
- [ ] Trang trại
- [ ] Chứng nhận
- [ ] Mùa vụ
- [ ] Thu hoạch
- [ ] Lô
- [ ] Kiểm định
- [ ] QR
- [ ] Truy xuất
- [ ] Sản phẩm
- [ ] Kho
- [ ] Tồn kho
- [ ] FEFO
- [ ] Giỏ hàng
- [ ] Checkout
- [ ] Đơn hàng
- [ ] Thanh toán
- [ ] Giao hàng
- [ ] Đánh giá
- [ ] Khiếu nại
- [ ] Hoàn tiền

## Stack hiện tại

```text
Node.js 24 LTS
pnpm
TypeScript

Backend:
NestJS + Prisma + MySQL

Customer Web:
Next.js + Mantine

Admin:
Next.js + Ant Design ProComponents

Mobile:
Expo + React Native + gluestack-ui

API:
REST + Swagger/OpenAPI

FE API:
Orval + TanStack Query
```

## Quyết định phải giữ

- Chỉ 3 Actor.
- Modular Monolith.
- MySQL.
- Prisma.
- REST.
- Swagger/OpenAPI.
- Customer Web dùng Mantine.
- Admin dùng Ant Design ProComponents.
- Mobile dùng gluestack-ui.
- TypeScript strict.
- Code nghiệp vụ tiếng Việt không dấu.
- Backend là nguồn sự thật của giá/tồn/FEFO/thanh toán.

## Lỗi/tồn đọng hiện tại

Không có lỗi PHIEN-006.

Prisma foundation đã kết nối MySQL local thật. Migration đầu tiên chỉ thiết lập
lịch sử migration, chưa tạo model/bảng nghiệp vụ.

MySQL local của AgriMarket dùng `127.0.0.1:3307`; shadow database
`agrimarket_shadow` chỉ phục vụ `prisma migrate dev` trong môi trường local.

## Lệnh chạy hiện tại

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
pnpm format:check

pnpm --filter @agrimarket/api start:dev
pnpm --filter @agrimarket/api build
pnpm --filter @agrimarket/api test:e2e
pnpm --filter @agrimarket/api prisma:validate
pnpm --filter @agrimarket/api prisma:generate
pnpm --filter @agrimarket/api prisma:migrate:dev
pnpm --filter @agrimarket/api prisma:migrate:status

docker compose up -d
docker compose ps
docker compose down
```

## Test hiện tại

PHIEN-006 đã chạy thành công:

```text
MySQL Docker: healthy
prisma validate: thành công
prisma migrate dev --create-only --name khoi-tao: thành công
prisma generate: thành công
Jest + Supertest: thành công
PrismaService SELECT 1: thành công
production runtime smoke: thành công
prisma migrate dev: thành công
prisma migrate status: database schema up to date
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
git diff --check
```

## Quy tắc cập nhật file này

Sau mỗi phiên phải sửa:

```text
Phiên vừa hoàn thành
Phiên tiếp theo
Danh sách hoàn thành
Chưa làm
Lỗi tồn đọng
Lệnh chạy
Test
```
