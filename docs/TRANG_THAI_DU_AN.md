# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

28/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 1 – Khởi tạo 4 ứng dụng
Tiến độ code thực tế: Backend + Customer Web + Admin Web foundation đã sẵn sàng; Mobile chưa khởi tạo
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-008 – Khởi tạo Admin Web**

Đã thiết lập:

- Next.js 16.3.3 App Router tại `apps/admin-web`;
- React 19.2.8;
- Ant Design 5.29.3 stable;
- `@ant-design/v5-patch-for-react-19` 1.0.3 để tương thích React 19;
- ProComponents 2.8.10 stable;
- `@ant-design/nextjs-registry` cho App Router SSR;
- TanStack Query;
- `ConfigProvider`;
- `QueryClientProvider`;
- `ProLayout`;
- mọi file import ProComponents là Client Component để tránh SWR react-server entry;
- sidebar placeholder;
- dashboard placeholder `/`;
- login placeholder `/dang-nhap`;
- route-level error boundary;
- TypeScript 6 không dùng `baseUrl`;
- `next-env.d.ts` do Next.js tự sinh và không commit.

Chưa làm Auth/RBAC thật và chưa tích hợp API.

## Phiên tiếp theo

**PHIEN-009 – Khởi tạo Mobile Expo**

Mục tiêu:

```text
Expo
Expo Router
gluestack-ui
UniWind
TanStack Query
Zustand
(auth)
(tabs)
Trang chủ / Khám phá / Quét QR / Đơn hàng / Tài khoản
```

Chỉ khởi tạo Mobile foundation.

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

Không có lỗi PHIEN-008.

Admin Web mới là foundation. Login hiện chỉ là placeholder, chưa có Auth/RBAC.
Dashboard chưa gọi Backend; luồng Swagger → Orval → API client thuộc PHIEN-010.

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
pnpm --filter @agrimarket/admin-web dev
pnpm --filter @agrimarket/admin-web build
pnpm --filter @agrimarket/admin-web start

docker compose up -d
docker compose ps
docker compose down
```

## Test hiện tại

PHIEN-008 đã chạy thành công:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
git diff --check
Admin Web next build: thành công
Admin Web production smoke: thành công
GET /: HTTP 200
GET /dang-nhap: HTTP 200
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
