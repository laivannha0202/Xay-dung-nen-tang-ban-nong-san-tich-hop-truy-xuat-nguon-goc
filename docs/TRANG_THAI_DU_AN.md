# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 3 – Quản lý nguồn cung
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-020 – Mùa vụ**

Đã thiết lập:

- enum vòng đời `KE_HOACH/DANG_CANH_TAC/CHO_THU_HOACH/DA_KET_THUC/HUY`;
- model MySQL/Prisma `mua_vu`;
- quan hệ bắt buộc Mùa vụ → Trang trại;
- cây trồng, giống;
- ngày trồng, ngày dự kiến thu hoạch;
- sản lượng dự kiến theo kilogram;
- Backend list/detail/create/update;
- search + pagination + filter Trang trại/trạng thái;
- 3 permission `mua_vu.xem/tao/sua`;
- Nhân viên: xem/tạo/sửa;
- Admin: xem/tạo/sửa;
- Khách hàng: không có quyền quản trị;
- Audit cho tạo/sửa trong cùng transaction;
- Swagger/OpenAPI + Orval;
- Admin menu Mùa vụ;
- ProTable + Create/Edit + Detail Timeline;
- Timeline dựng trực tiếp từ dữ liệu Mùa vụ, không tạo bảng timeline riêng;
- chưa ghi sản lượng thu hoạch thực tế.

## Phiên tiếp theo

**PHIEN-021 – Thu hoạch**

Phạm vi chi tiết sẽ tiếp tục bám `docs/KE_HOACH_CAC_PHIEN_AI.md`.
Không đưa dữ liệu Thu hoạch thực tế vào PHIEN-020.

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
- [x] Trang trại
- [x] Chứng nhận
- [x] Mùa vụ
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

Không có lỗi source PHIEN-020.

Mùa vụ hiện lưu kế hoạch canh tác và vòng đời. `sanLuongDuKienKg` chỉ là
sản lượng dự kiến, không phải sản lượng thu hoạch thực tế.

Timeline Admin được dựng từ ngày trồng, ngày dự kiến thu hoạch và trạng thái,
không có bảng timeline riêng.

PHIEN-021 tiếp theo là Thu hoạch.

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

PHIEN-020 đã chạy thành công:

```text
migration mua_vu
enum trạng thái Mùa vụ
1 foreign key Trang trại
3 permission Mùa vụ
6 role-permission mapping
regression mapping Nhà cung cấp = 7
regression mapping Trang trại = 7
regression mapping Chứng nhận = 7
KHACH_HANG protected GET -> 403
ngày dự kiến thu hoạch <= ngày trồng -> 400
sản lượng dự kiến <= 0 -> 400
NHAN_VIEN tạo Mùa vụ
search + pagination + farm/status filter
NHAN_VIEN cập nhật kế hoạch + trạng thái
không tạo Mùa vụ cho Trang trại ngừng hoạt động
Audit tạo/sửa
Swagger/OpenAPI operationId
Orval generated client
Admin ProTable Mùa vụ
Admin Create/Edit
Admin Detail Timeline
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
