# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 3 – Quản lý nguồn cung
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại Backend/Admin/Public API đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-018 – Trang trại**

Đã thiết lập:

- model MySQL/Prisma `trang_trai` và `trang_trai_anh`;
- mã/tên/địa chỉ/GPS/diện tích ha/trạng thái;
- quan hệ bắt buộc Trang trại → Nhà cung cấp;
- ảnh liên kết qua `TepTin`, không lưu URL/object-key vào bảng nghiệp vụ;
- tối đa 10 ảnh, chỉ JPEG/PNG/WebP đã upload hợp lệ;
- bucket MinIO/S3 vẫn private;
- signed URL ngắn hạn cho ảnh chi tiết;
- CRUD Backend + search + pagination + supplier/status filter;
- 4 permission `trang_trai.xem/tao/sua/khoa`;
- Nhân viên: xem/tạo/sửa;
- Admin: đủ 4 quyền;
- Khách hàng: không có quyền quản trị;
- Audit cho tạo/sửa/khóa-mở trong cùng transaction;
- public `GET /api/v1/cong-khai/trang-trai/:id` không cần token;
- public chỉ hiển thị Trang trại và Nhà cung cấp đang hoạt động;
- Swagger/OpenAPI + Orval;
- Admin menu Trang trại;
- ProTable + Detail + Create/Edit + upload/attach ảnh + khóa/mở.

## Phiên tiếp theo

**PHIEN-019 – Chứng nhận**

Mục tiêu:

```text
loại
mã
đơn vị cấp
ngày cấp
hết hạn
file
trạng thái xác minh
job cảnh báo 30 ngày / 7 ngày / hết hạn
Admin list/detail/verify
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

Không có lỗi source PHIEN-018.

Ảnh Trang trại sử dụng module `TepTin`/MinIO hiện có. Object storage vẫn private;
public farm detail chỉ nhận signed URL ngắn hạn.

Nhân viên được xem/tạo/sửa Trang trại nhưng không được khóa. Chỉ Admin có
`trang_trai.khoa`.

PHIEN-019 tiếp theo là Chứng nhận.

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

PHIEN-018 đã chạy thành công:

```text
migration trang_trai + trang_trai_anh
3 foreign keys
4 permission Trang trại
7 role-permission mapping
KHACH_HANG protected GET -> 403
GPS thiếu một tọa độ -> 400
NHAN_VIEN upload PNG thật vào MinIO
NHAN_VIEN tạo/xem/sửa Trang trại
NHAN_VIEN khóa -> 403
duplicate mã -> 409
search + pagination + supplier filter
ADMIN khóa/mở
public farm detail không cần token
public farm inactive -> 404
signed URL public đọc đúng byte ảnh MinIO
Audit tạo/sửa/đổi trạng thái
Swagger/OpenAPI operationId
Orval generated client
Admin ProTable Trang trại
Admin Detail/Create/Edit
Admin upload/attach ảnh
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
