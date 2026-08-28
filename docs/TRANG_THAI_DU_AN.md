# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

28/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Foundation hoàn thành đến Docker local
Tiến độ code thực tế: Monorepo + tooling + Docker local đã sẵn sàng, chưa khởi tạo 4 application framework
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-004 – Docker môi trường local**

Đã thiết lập:

- `docker-compose.yml`;
- `.env.example`;
- MySQL 8.4.11;
- Redis 8.10.0 Alpine;
- MinIO Community được ghim cho local;
- Mailpit 1.31.0;
- MySQL host port `3307` để không xung đột MySQL hệ thống ở `3306`;
- Redis host port `6380` để không xung đột Redis hệ thống ở `6379`;
- healthcheck MySQL/Redis;
- kiểm tra endpoint MinIO và Mailpit;
- root scripts `docker:up`, `docker:down`, `docker:ps`, `docker:logs`.

Không khởi tạo NestJS, Next.js, Expo, Prisma schema hoặc code nghiệp vụ.

## Phiên tiếp theo

**PHIEN-005 – Khởi tạo Backend NestJS**

Mục tiêu:

```text
apps/api
NestJS
Swagger
Config
Validation
Helmet
Throttler
Prisma package
GET /api/v1/suc-khoe
/docs
/openapi-json
```

Chỉ khởi tạo Backend theo PHIEN-005; chưa làm schema nghiệp vụ.

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

- [ ] NestJS Backend
- [ ] Customer Web
- [ ] Admin Web
- [ ] Mobile Expo

### Backend

- [ ] Prisma
- [ ] MySQL schema
- [ ] Swagger
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

Không có lỗi foundation sau PHIEN-004.

MinIO Community dùng cho local được ghim bản Community cuối để giữ đúng quyết
định kiến trúc hiện tại. Production vẫn dùng S3-compatible storage theo ADR.

## Lệnh chạy hiện tại

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
pnpm format:check

docker compose up -d
docker compose ps
docker compose logs -f
docker compose down
```

## Test hiện tại

PHIEN-004 đã chạy thành công:

```text
docker compose config
docker compose pull
docker compose up -d
MySQL healthcheck: healthy
Redis healthcheck: healthy
MinIO /minio/health/live: OK
Mailpit Web: OK
Mailpit SMTP: TCP OK
docker compose ps
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
