# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 2 – Database và nền tảng Backend
Tiến độ code thực tế: 4 ứng dụng foundation + FE client + Prisma + Auth + RBAC + Audit + File/MinIO + Redis/BullMQ đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-016 – Redis + BullMQ nền tảng**

Đã thiết lập:

- data-repair migration chạy sau PHIEN-013 để khôi phục `ADMIN → audit.xem` trên fresh DB;
- `RedisService` dùng Redis thật, namespace cache riêng;
- JSON cache helper + TTL;
- BullMQ dùng Redis connection config tập trung;
- queue `email`;
- queue `notification`;
- queue `system-job`;
- producer `HangDoiService`;
- worker foundation cho cả 3 queue;
- retry mặc định 3 lần + exponential backoff;
- retention giới hạn completed/failed jobs;
- email test job gửi thật tới Mailpit;
- notification/system-job test job được worker xử lý;
- không tạo debug/public API endpoint;
- chưa chuyển Auth email hoặc nghiệp vụ khác sang queue.

## Phiên tiếp theo

**PHIEN-017 – Nhà cung cấp**

Mục tiêu bắt đầu Giai đoạn 3 – Quản lý nguồn cung:

```text
Backend CRUD nhà-cung-cap
permission nhà cung cấp
Admin ProTable
Detail
Create/Edit
trạng thái
```

PHIEN-017 mới bắt đầu module nghiệp vụ nguồn cung.

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
- [x] Customer Web
- [x] Admin Web
- [x] Mobile Expo

### Backend

- [x] Prisma
- [x] MySQL schema
- [x] Swagger
- [x] Auth
- [x] RBAC
- [x] Audit
- [x] File upload
- [x] Redis/BullMQ

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

Không có lỗi source PHIEN-016.

Redis cache và BullMQ dùng cùng Redis service local nhưng BullMQ tự quản lý
các connection queue/worker của nó; không ép tất cả worker dùng chung một socket.

PHIEN-016 chỉ dựng foundation. Auth email vẫn chạy đồng bộ như PHIEN-012.
Các module tương lai sẽ đưa email/notification/system-job thật vào queue khi có
nghiệp vụ tương ứng.

PHIEN-017 bắt đầu Giai đoạn 3 – Nhà cung cấp.

## Lệnh chạy hiện tại

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
pnpm format:check

# Backend
pnpm --filter @agrimarket/api start:dev

# Refresh OpenAPI snapshot (Backend phải đang chạy ở :3000)
pnpm api-client:snapshot

# Generate/ensure FE client
pnpm api-client:generate
pnpm api-client:ensure

# Frontend
pnpm --filter @agrimarket/customer-web dev   # :3001
pnpm --filter @agrimarket/admin-web dev      # :3002
pnpm --filter @agrimarket/mobile start
```

## Test hiện tại

PHIEN-016 đã chạy thành công:

```text
fresh DB có ADMIN -> audit.xem
Redis docker healthy
redis-cli ping -> PONG
RedisService ping -> PONG
JSON cache set/get/delete
cache TTL
queue email registered
queue notification registered
queue system-job registered
default attempts = 3
exponential backoff
email worker -> Mailpit thật
notification worker completed + returnvalue persisted
system-job worker completed + returnvalue persisted
full Backend regression e2e
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
