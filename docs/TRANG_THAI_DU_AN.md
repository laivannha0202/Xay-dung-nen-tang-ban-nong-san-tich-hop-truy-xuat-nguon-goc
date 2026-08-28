# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

28/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 1 – Khởi tạo 4 ứng dụng
Tiến độ code thực tế: Backend NestJS + Prisma/MySQL và Customer Web foundation đã sẵn sàng; Admin Web/Mobile chưa khởi tạo
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-007 – Khởi tạo Customer Web**

Đã thiết lập:

- Next.js 16.3.3 App Router tại `apps/customer-web`;
- React 19.2.8;
- Mantine 9.5.2 Core + Hooks;
- TanStack Query;
- Zustand;
- `MantineProvider`;
- `QueryClientProvider`;
- theme cơ bản;
- AppShell responsive;
- Zustand store cho trạng thái giao diện;
- route-level error boundary;
- trang `/` hiển thị AgriMarket;
- UI foundation chủ yếu dùng Mantine component, không thêm CSS viết tay.
- TypeScript 6 không dùng `baseUrl`; alias `@/*` trỏ trực tiếp `./src/*`.
- `next-env.d.ts` do Next.js tự sinh bằng `next typegen`/build/dev và không commit.
- Giữ thay đổi `minimumReleaseAgeExclude` do pnpm supply-chain policy tự quản lý nếu phát sinh.

Chưa tích hợp API; Swagger → Orval thuộc PHIEN-010.

## Phiên tiếp theo

**PHIEN-008 – Khởi tạo Admin Web**

Mục tiêu:

```text
Next.js
Ant Design
ProComponents
TanStack Query
Login placeholder
ProLayout
Sidebar placeholder
Dashboard placeholder
```

Chỉ khởi tạo Admin Web foundation.

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

Không có lỗi PHIEN-007.

Customer Web mới là UI foundation, chưa gọi Backend và chưa có nghiệp vụ thật.
Luồng Swagger → Orval → generated API client sẽ được thiết lập ở PHIEN-010.

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
pnpm --filter @agrimarket/customer-web dev
pnpm --filter @agrimarket/customer-web build
pnpm --filter @agrimarket/customer-web start

docker compose up -d
docker compose ps
docker compose down
```

## Test hiện tại

PHIEN-007 đã chạy thành công:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
git diff --check
Customer Web next build: thành công
Customer Web production smoke: thành công
GET /: HTTP 200
HTML trang chủ có AgriMarket
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
