# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

28/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 1 – Khởi tạo 4 ứng dụng
Tiến độ code thực tế: Backend NestJS foundation đã khởi tạo; Customer Web/Admin Web/Mobile chưa khởi tạo
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-005 – Khởi tạo Backend NestJS**

Đã thiết lập:

- NestJS Backend tại `apps/api`;
- ConfigModule;
- ValidationPipe toàn cục;
- Helmet;
- ThrottlerGuard toàn cục;
- Swagger UI `/docs`;
- OpenAPI JSON `/openapi-json`;
- endpoint `GET /api/v1/suc-khoe`;
- Jest + Supertest e2e;
- Prisma package 7.10.0 được cài nhưng chưa init/schema/migration.
- pnpm `allowBuilds` được cấu hình rõ: chặn `@scarf/scarf`, chỉ cho phép build package cần thiết.

Không kết nối database và chưa code nghiệp vụ.

## Phiên tiếp theo

**PHIEN-006 – Kết nối Prisma + MySQL**

Mục tiêu:

```text
prisma init
DATABASE_URL dùng MySQL AgriMarket local 127.0.0.1:3307
PrismaService
PrismaModule
prisma generate
migration foundation nếu phù hợp
```

Chưa làm Auth/RBAC hoặc schema nghiệp vụ ngoài phạm vi PHIEN-006.

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

- [ ] Prisma
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

Không có lỗi PHIEN-005.

Prisma package đã được cài để đúng kế hoạch nhưng chưa được khởi tạo hoặc kết
nối MySQL; phần đó thuộc PHIEN-006.

pnpm workspace giữ `strictDepBuilds` và `allowBuilds` rõ ràng để dependency có
postinstall mới không được chạy âm thầm.

MySQL AgriMarket local hiện publish ở `127.0.0.1:3307`, Redis ở
`127.0.0.1:6380` để không xung đột service hệ thống trên máy phát triển.

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
pnpm --filter @agrimarket/api start:prod
pnpm --filter @agrimarket/api test:e2e

docker compose up -d
docker compose ps
docker compose down
```

## Test hiện tại

PHIEN-005 đã chạy thành công:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
git diff --check
Jest + Supertest e2e
GET /api/v1/suc-khoe: HTTP 200
GET /docs: HTTP 200
GET /openapi-json: HTTP 200 và có /api/v1/suc-khoe
production build smoke test: thành công
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
