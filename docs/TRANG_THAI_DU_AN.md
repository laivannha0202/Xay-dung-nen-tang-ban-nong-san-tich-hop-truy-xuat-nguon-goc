# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 3 – Quản lý nguồn cung
Tiến độ code thực tế: Foundation hoàn tất + Nhà cung cấp Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-017 – Nhà cung cấp**

Đã thiết lập:

- model MySQL/Prisma `nha_cung_cap`;
- mã duy nhất, tên, người đại diện, điện thoại, email, địa chỉ, ghi chú, trạng thái;
- CRUD Backend;
- search + pagination + status filter;
- 4 permission `nha_cung_cap.xem/tao/sua/khoa`;
- Nhân viên: xem/tạo/sửa;
- Admin: đủ 4 quyền;
- Khách hàng: không có quyền quản lý;
- Audit cho tạo/sửa/khóa-mở trong cùng transaction;
- duplicate mã trả 409;
- Swagger/OpenAPI + Orval;
- Admin login tối thiểu nối Auth/RBAC hiện có;
- access token Admin chỉ lưu sessionStorage;
- Admin menu Nhà cung cấp;
- ProTable + Detail + Create/Edit + khóa/mở theo permission.

## Phiên tiếp theo

**PHIEN-018 – Trang trại**

Mục tiêu:

```text
Backend + Admin Trang trại
GPS
Địa chỉ
Diện tích
Nhà cung cấp
Ảnh
Trạng thái
Customer public farm detail
```

PHIEN-018 mới tạo quan hệ Trang trại → Nhà cung cấp và sử dụng module file cho ảnh.

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

- [x] Nhà cung cấp
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

Không có lỗi source PHIEN-017.

Admin login PHIEN-017 chỉ tích hợp access token hiện có để vận hành module nguồn cung;
refresh/logout UX nâng cao có thể hoàn thiện ở phiên Admin/Auth chuyên biệt nếu cần.

Nhân viên được xem/tạo/sửa Nhà cung cấp nhưng không được khóa. Chỉ Admin có
`nha_cung_cap.khoa`.

PHIEN-018 tiếp theo là Trang trại.

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

PHIEN-017 đã chạy thành công:

```text
migration nha_cung_cap
4 permission Nhà cung cấp
7 role-permission mapping
KHACH_HANG GET -> 403
NHAN_VIEN tạo/xem/sửa -> thành công
NHAN_VIEN khóa -> 403
ADMIN khóa/mở -> thành công
duplicate mã -> 409
Audit tạo/sửa/đổi trạng thái
search + pagination
Swagger/OpenAPI operationId
Orval generated client
Admin login nối Auth/RBAC
Admin ProTable Nhà cung cấp
Admin Detail/Create/Edit
Admin khóa/mở theo permission
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
