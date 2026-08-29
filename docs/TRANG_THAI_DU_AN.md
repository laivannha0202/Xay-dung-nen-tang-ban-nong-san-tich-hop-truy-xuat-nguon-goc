# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 3 – Quản lý nguồn cung
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận Backend/Admin/Job đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-019 – Chứng nhận**

Đã thiết lập:

- enum `CHO_XAC_MINH/DA_XAC_MINH/TU_CHOI`;
- model MySQL/Prisma `chung_nhan`;
- Chứng nhận thuộc Trang trại;
- loại, mã duy nhất, đơn vị cấp, ngày cấp, ngày hết hạn;
- file liên kết `TepTin`, bucket MinIO/S3 vẫn private;
- hỗ trợ PDF/JPEG/PNG/WebP;
- signed URL nội bộ ngắn hạn để xem file;
- Backend list/detail/create/update/verify;
- sửa nội dung tự đưa về `CHO_XAC_MINH`;
- 4 permission `chung_nhan.xem/tao/sua/xac_minh`;
- Nhân viên: xem/tạo/sửa;
- Admin: đủ 4 quyền;
- Khách hàng: không có quyền quản trị;
- Audit cho tạo/sửa/xác minh/từ chối;
- BullMQ `system-job` cảnh báo 30 ngày/7 ngày/hết hạn;
- scheduler hằng ngày bằng `upsertJobScheduler`;
- cảnh báo idempotent bằng timestamp + Audit hệ thống;
- Swagger/OpenAPI + Orval;
- Admin menu Chứng nhận;
- ProTable + Detail + Create/Edit + xem file + Verify/Reject.

## Phiên tiếp theo

**PHIEN-020 – Mùa vụ**

Mục tiêu:

```text
farm
cây trồng
giống
ngày trồng
ngày dự kiến thu hoạch
sản lượng dự kiến
trạng thái
Admin ProTable + detail timeline
```

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

Không có lỗi source PHIEN-019.

Chứng nhận thay đổi nội dung hoặc file sau khi đã xác minh sẽ tự quay về
`CHO_XAC_MINH` và phải được Admin xác minh lại.

Job cảnh báo chứng nhận dùng queue `system-job` hiện có và chạy hằng ngày.
Ba mốc 30 ngày, 7 ngày và hết hạn được ghi idempotent bằng timestamp trên
bản ghi Chứng nhận và Audit tác nhân `HE_THONG`.

PHIEN-020 tiếp theo là Mùa vụ.

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

PHIEN-019 đã chạy thành công:

```text
migration chung_nhan
enum trạng thái xác minh
2 foreign keys
4 permission Chứng nhận
7 role-permission mapping
regression mapping Nhà cung cấp = 7
regression mapping Trang trại = 7
KHACH_HANG protected GET -> 403
NHAN_VIEN upload PDF thật vào MinIO
NHAN_VIEN tạo/xem/sửa Chứng nhận
NHAN_VIEN verify -> 403
ngày hết hạn <= ngày cấp -> 400
duplicate mã -> 409
ADMIN xác minh
ADMIN từ chối + lý do
Audit tạo/sửa/xác minh/từ chối
BullMQ scheduler hằng ngày
job cảnh báo 30 ngày
job cảnh báo 7 ngày
job cảnh báo hết hạn
job chạy lại idempotent -> 0 cảnh báo mới
Audit HE_THONG cho cảnh báo
Swagger/OpenAPI operationId
Orval generated client
Admin ProTable Chứng nhận
Admin Detail/Create/Edit
Admin upload file
Admin Verify/Reject
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
