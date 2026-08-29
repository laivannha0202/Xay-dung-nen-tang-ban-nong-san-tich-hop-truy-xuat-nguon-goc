# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 2 – Database và nền tảng Backend
Tiến độ code thực tế: 4 ứng dụng foundation + FE client + Prisma schema nền tảng đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-011 – Thiết kế Prisma schema nền tảng**

Đã thiết lập:

- 8 bảng: `nguoi_dung`, `khach_hang`, `nhan_vien`, `vai_tro`, `quyen`,
  `vai_tro_quyen`, `nguoi_dung_vai_tro`, `dia_chi`;
- UUIDv7 lưu `CHAR(36)`;
- `created_at`, `updated_at`, `trang_thai` cho mọi bảng;
- unique index cho email/điện thoại/mã nhân viên/role/permission và bảng nối;
- 7 foreign key nền tảng;
- mapping Prisma camelCase ↔ MySQL snake_case;
- ERD tại `docs/ERD_NEN_TANG.md`;
- migration Prisma `phien011_nen_tang`;
- migration được validate trên database tạm độc lập trước khi deploy local;
- e2e test kiểm tra bảng, UUID, timestamp, status, unique index và foreign key.

## Phiên tiếp theo

**PHIEN-012 – Module xác thực**

Mục tiêu:

```text
Đăng ký khách hàng
Đăng nhập
Refresh token
Đăng xuất
Quên mật khẩu
Đổi mật khẩu
Argon2
JWT
rate limit
```

PHIEN-012 dùng trực tiếp `nguoi_dung` + `khach_hang` từ PHIEN-011.

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

Không có lỗi source PHIEN-011.

Migration PHIEN-011 đã được kiểm thử trên database tạm riêng và deploy vào
MySQL local `agrimarket`. Chưa seed Role/Permission; PHIEN-013 mới triển khai
RBAC nghiệp vụ.

`mat_khau_hash` mới là cột schema; PHIEN-012 mới chịu trách nhiệm Argon2,
JWT, refresh token và toàn bộ luồng xác thực.

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

PHIEN-011 đã chạy thành công:

```text
prisma format
prisma validate
prisma generate
prisma migrate dev --create-only (database validation riêng)
prisma migrate deploy (database validation riêng)
8/8 bảng nền tảng tồn tại
UUID id = CHAR(36)
mọi bảng có trang_thai + created_at + updated_at
9 unique indexes nền tảng
7 foreign keys nền tảng
schema e2e test
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
