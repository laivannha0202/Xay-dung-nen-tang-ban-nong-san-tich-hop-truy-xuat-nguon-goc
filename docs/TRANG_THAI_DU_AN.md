# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 2 – Database và nền tảng Backend
Tiến độ code thực tế: 4 ứng dụng foundation + FE client + Prisma + Auth + RBAC đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-013 – RBAC**

Đã thiết lập:

- seed đúng 3 role `KHACH_HANG`, `NHAN_VIEN`, `ADMIN`;
- seed permission nền tảng:
  `phan_quyen.quan_ly`, `san_pham.xem`, `san_pham.tao`,
  `don_hang.xu_ly`, `ton_kho.dieu_chinh`;
- mapping role → permission bằng `vai_tro_quyen`;
- đăng ký khách hàng tự gán role `KHACH_HANG`;
- decorator `@YeuCauQuyen(...)`;
- `QuyenGuard`;
- endpoint xem role/quyền hiện hành của tài khoản;
- endpoint gán role được bảo vệ bởi `phan_quyen.quan_ly`;
- quyền được đọc từ DB trên từng request, không nhét permission vào JWT;
- thay đổi quyền có hiệu lực ngay với access token đang còn hạn;
- e2e kiểm tra 403 khi thiếu quyền;
- Swagger/OpenAPI + Orval đã cập nhật RBAC.

## Phiên tiếp theo

**PHIEN-014 – Audit Log**

Mục tiêu:

```text
actor
action
entity
before
after
metadata
timestamp
```

PHIEN-014 ghi lại các thay đổi nhạy cảm như phân quyền, tồn kho,
đơn hàng và các thao tác quản trị.

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

Không có lỗi source PHIEN-013.

RBAC hiện đọc quyền từ MySQL trên từng request để thay đổi quyền có hiệu lực
ngay và không tạo JWT chứa permission bị stale. Chưa có cache Redis cho permission;
chỉ cân nhắc cache khi có số liệu hiệu năng thực tế.

PHIEN-013 không tạo actor mới. Hệ thống vẫn chỉ có Khách hàng, Nhân viên,
Admin. PHIEN-014 mới triển khai Audit Log.

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

PHIEN-013 đã chạy thành công:

```text
3 role hệ thống được seed
5 permission nền tảng được seed
đăng ký tự gán KHACH_HANG
KHACH_HANG xem được quyền của mình
KHACH_HANG gán role -> 403
gán ADMIN trong DB
cùng access token cũ có quyền quản lý ngay
ADMIN gán NHAN_VIEN thành công
NHAN_VIEN có don_hang.xu_ly
NHAN_VIEN không có phan_quyen.quan_ly
thu hồi ADMIN -> cùng access token cũ nhận 403
OpenAPI RBAC contract
Orval generated RBAC client
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
