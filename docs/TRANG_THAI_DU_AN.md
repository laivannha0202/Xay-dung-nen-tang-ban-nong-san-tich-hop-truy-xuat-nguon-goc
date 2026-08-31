# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 5 – CATALOG VÀ SẢN PHẨM
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-029 – Danh mục sản phẩm**

Đã thiết lập đúng contract master:

```text
category / parent / slug / status / image
```

Backend:

- model `DanhMucSanPham`;
- tên `ten`;
- `slug` unique, lowercase kebab-case;
- parent tùy chọn qua `danhMucChaId`;
- self hierarchy `danhMucCha` / `danhMucCon`;
- service chặn self-parent và hierarchy cycle;
- status dùng `TrangThaiBanGhi`;
- image dùng `TepTin` hiện hữu qua `anhId`;
- chỉ cho phép `TepTin` đang `HOAT_DONG` và MIME `image/*`;
- response Admin có signed image URL;
- không DELETE category, dùng trạng thái để ngừng hoạt động;
- tìm kiếm theo tên/slug;
- filter theo parent/status;
- Audit:
  - `DANH_MUC_SAN_PHAM_TAO`;
  - `DANH_MUC_SAN_PHAM_SUA`;
  - `DANH_MUC_SAN_PHAM_DOI_TRANG_THAI`.

RBAC:

- `danh_muc_san_pham.xem`;
- `danh_muc_san_pham.tao`;
- `danh_muc_san_pham.sua`;
- `danh_muc_san_pham.khoa`;
- Nhân viên: xem/tạo/sửa;
- Admin: xem/tạo/sửa/khóa;
- tổng 7 role-permission mappings.

API:

```text
GET   /api/v1/danh-muc-san-pham
GET   /api/v1/danh-muc-san-pham/:id
POST  /api/v1/danh-muc-san-pham
PATCH /api/v1/danh-muc-san-pham/:id
PATCH /api/v1/danh-muc-san-pham/:id/trang-thai
```

Admin:

- route `/danh-muc-san-pham`;
- ProTable;
- create/edit modal;
- parent select;
- upload JPEG/PNG/WebP qua module `TepTin` hiện hữu;
- signed image preview;
- khóa/mở theo quyền;
- thay placeholder `/nong-san` bằng menu `Danh mục sản phẩm`.

Quality:

- Swagger/OpenAPI;
- Orval;
- E2E hierarchy/slug/image/RBAC/audit;
- full E2E isolated tối thiểu 20 suites;
- Redis/BullMQ namespace riêng từng suite;
- QR E2E đóng chủ động BullMQ workers/queues trước `app.close()` để tránh teardown treo;
- không dependency mới.

Boundary:

- Không tạo Product model/API trước phiên kế tiếp trong master plan.
- Không tạo Customer/Mobile catalog UI ở PHIEN-029.

## Phiên tiếp theo

**PHIEN-030 – Sản phẩm**

PHIEN-029 chỉ hoàn thành Danh mục sản phẩm.
Phạm vi phiên kế tiếp được đọc trực tiếp từ master plan, không được suy đoán hoặc làm sớm.

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
- [x] Nhật ký canh tác
- [x] Thu hoạch
- [x] Lô
- [x] Kiểm định
- [x] QR
- [x] Truy xuất (Backend Trace Events + API công khai đã xong; Trace Web PHIEN-046)
- [x] Thu hồi Lô (core + Admin + public warning; integration Order/Inventory theo phase phụ thuộc)
- [x] Danh mục sản phẩm
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

Không có lỗi source PHIEN-029.

Danh mục sản phẩm đã có hierarchy/slug/status/image.

Không tạo Product model/API trước PHIEN-030 – Sản phẩm.
Customer Web/Mobile catalog vẫn thuộc các phase sau theo master plan.

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

PHIEN-029 đã chạy thành công:

```text
fresh DB migration deploy PHIEN-001..028
Prisma format/validate/generate
migration DanhMucSanPham
DB gate 1 table / 8 columns / 2 FK / 6 named index-columns
4 permissions / 7 mappings
NHAN_VIEN = xem/tao/sua
ADMIN = xem/tao/sua/khoa
KHACH_HANG GET category -> 403
slug invalid -> 400
duplicate slug -> 409
create root category + image
create child category + parent
missing parent -> 404
PDF image -> 400
inactive image -> 404
list/search/filter
update category
hierarchy cycle -> 400
NHAN_VIEN status -> 403
ADMIN status -> 200
Audit create/update/status
DELETE category -> 404
Product API boundary -> 404
OpenAPI exact category CRUD/status
Orval category operations
Admin ProTable/create/edit/image/status
full API E2E isolated tối thiểu 20 suites
Redis/BullMQ namespace riêng từng suite
QR E2E teardown đóng BullMQ workers/queues trước app.close()
pnpm lint
pnpm typecheck
workspace tests
pnpm build
pnpm format:check
source SHA-256 trước/sau cập nhật docs
prettier --check 3 file docs
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
