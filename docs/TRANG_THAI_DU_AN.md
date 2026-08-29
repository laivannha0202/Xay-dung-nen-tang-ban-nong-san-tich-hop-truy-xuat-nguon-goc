# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

28/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 2 – Database và nền tảng Backend
Tiến độ code thực tế: 4 ứng dụng foundation + Swagger/Orval/generated FE client đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-010 – Swagger → Orval → FE client**

Đã thiết lập:

- Swagger operationId ổn định `layTrangThaiSucKhoe`;
- e2e test khóa operationId của endpoint sức khỏe;
- OpenAPI snapshot tại `packages/api-client/openapi/agrimarket.json`;
- Orval 8.26.0;
- generated client `react-query` + Fetch;
- Orval 8.26.0 giữ `includeHttpResponseReturnType=true` + `forceSuccessResponse=true` để tránh bug missing `*Success` type;
- không dùng Axios;
- runtime API base URL dùng chung;
- `layTrangThaiSucKhoe`;
- `useLayTrangThaiSucKhoe`;
- Customer Web dùng generated health hook;
- Admin Web dùng generated health hook;
- Mobile `src/app` dùng generated health hook;
- Backend CORS local cho Customer/Admin;
- Customer dev port 3001;
- Admin dev port 3002;
- generated client không commit; `ensure` tự sinh lại từ OpenAPI snapshot khi app cần;
- generated client smoke test gọi Backend thật thành công.

## Phiên tiếp theo

**PHIEN-011 – Thiết kế Prisma schema nền tảng**

Mục tiêu tạo schema nền tảng:

```text
nguoi_dung
khach_hang
nhan_vien
vai_tro
quyen
vai_tro_quyen
nguoi_dung_vai_tro
dia_chi
```

Yêu cầu: UUID, createdAt, updatedAt, status, unique index và foreign key.

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

Không có lỗi PHIEN-010.

Generated source trong `packages/api-client/generated/` không commit; package `ensure` sinh lại khi thiếu.
Source of truth cho FE codegen là OpenAPI snapshot đã commit; dùng lệnh snapshot
khi Backend Swagger contract thay đổi, sau đó generate lại.

Mobile trên thiết bị thật cần đặt `EXPO_PUBLIC_API_BASE_URL` thành LAN IP của máy
chạy Backend, không dùng `127.0.0.1` của điện thoại.

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

PHIEN-010 đã chạy thành công:

```text
OpenAPI GET /api/v1/suc-khoe có operationId ổn định
Orval generate thành công
Generated fetch function: layTrangThaiSucKhoe
Generated React Query hook: useLayTrangThaiSucKhoe
Generated client gọi Backend thật: thành công
CORS Customer Web local: thành công
Customer Web typecheck/build: thành công
Admin Web typecheck/build: thành công
Mobile typecheck: thành công
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
