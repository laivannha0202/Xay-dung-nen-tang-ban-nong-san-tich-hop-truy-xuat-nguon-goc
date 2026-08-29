# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 2 – Database và nền tảng Backend
Tiến độ code thực tế: 4 ứng dụng foundation + FE client + Prisma + Auth đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-012 – Module xác thực**

Đã thiết lập:

- đăng ký khách hàng;
- đăng nhập;
- access JWT;
- refresh token rotation;
- Web refresh token qua HttpOnly cookie;
- Mobile nhận refresh token để lưu SecureStore ở lớp client;
- đăng xuất/thu hồi session;
- đổi mật khẩu và thu hồi toàn bộ session cũ;
- quên mật khẩu gửi qua Mailpit SMTP;
- reset token opaque một lần, DB chỉ lưu Argon2 hash;
- Argon2id cho mật khẩu và refresh/reset token;
- bảng `phien_dang_nhap`;
- bảng `yeu_cau_dat_lai_mat_khau`;
- rate limit riêng cho endpoint nhạy cảm;
- Swagger/OpenAPI + Orval snapshot được cập nhật;
- e2e test MySQL thật + Mailpit thật.

## Phiên tiếp theo

**PHIEN-013 – RBAC**

Mục tiêu:

```text
Role
Permission
Gán Role
PermissionGuard
Decorator
403 khi thiếu quyền
```

PHIEN-013 dùng trực tiếp `vai_tro`, `quyen`, `vai_tro_quyen`,
`nguoi_dung_vai_tro` và access JWT từ PHIEN-012.

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

Không có lỗi source PHIEN-012.

Production bắt buộc đặt `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET`
thành secret mạnh bên ngoài source code. Local development có fallback để
không chặn môi trường dev.

Web phải dùng refresh token HttpOnly cookie; Mobile sẽ lưu refresh token bằng
SecureStore khi tích hợp màn hình Auth. PHIEN-013 mới triển khai RBAC/PermissionGuard.

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

PHIEN-012 đã chạy thành công:

```text
đăng ký khách hàng
Argon2id password hash
chặn đăng ký trùng email
đăng nhập MOBILE
đăng nhập WEB + HttpOnly cookie
refresh token rotation
token cũ bị vô hiệu sau rotation
đổi mật khẩu + revoke session
quên mật khẩu không leak email tồn tại
Mailpit nhận email reset thật
reset token chỉ dùng một lần
logout idempotent + revoke refresh token
OpenAPI Auth contract
Orval generated Auth client
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
