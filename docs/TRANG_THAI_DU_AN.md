# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 5 – CATALOG VÀ SẢN PHẨM
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-030 – Sản phẩm**

Đã thiết lập đúng contract master:

```text
ten / moTa / farm / category / status
Product ≠ Batch
```

Backend:

- model `SanPham`;
- `ten`;
- `moTa` nullable;
- bắt buộc `trangTraiId` → `TrangTrai`;
- bắt buộc `danhMucSanPhamId` → `DanhMucSanPham`;
- `trangThai` dùng `TrangThaiBanGhi`;
- tạo sản phẩm chỉ nhận farm/category đang `HOAT_DONG`;
- đổi farm/category chỉ nhận reference đang `HOAT_DONG`;
- mở lại sản phẩm chỉ khi farm/category nguồn còn `HOAT_DONG`;
- tìm theo tên;
- filter theo farm/category/status;
- không DELETE, dùng trạng thái;
- Audit:
  - `SAN_PHAM_TAO`;
  - `SAN_PHAM_SUA`;
  - `SAN_PHAM_DOI_TRANG_THAI`.

RBAC:

- `san_pham.xem`;
- `san_pham.tao`;
- `san_pham.sua`;
- `san_pham.khoa`;
- Khách hàng: xem (quyền nền đã seed từ PHIEN-013);
- Nhân viên: xem/tạo/sửa;
- Admin: xem/tạo/sửa/khóa;
- tổng 8 role-permission mappings.

API protected:

```text
GET   /api/v1/san-pham
GET   /api/v1/san-pham/:id
POST  /api/v1/san-pham
PATCH /api/v1/san-pham/:id
PATCH /api/v1/san-pham/:id/trang-thai
```

Admin:

- route `/san-pham`;
- ProTable;
- create/edit modal;
- select Trang trại hoạt động;
- select Danh mục hoạt động;
- search/filter;
- khóa/mở theo quyền.

Quality:

- Swagger/OpenAPI;
- Orval;
- E2E RBAC/reference/CRUD/status/audit/boundary;
- cập nhật Category E2E boundary: Product protected đã tồn tại ở PHIEN-030, public Product vẫn chưa mở;
- full E2E isolated tối thiểu 21 suites;
- Redis/BullMQ namespace riêng từng suite;
- QR teardown hardening PHIEN-029 phải giữ nguyên;
- không dependency mới.

Boundary bắt buộc:

- Product ≠ Batch.
- Không thêm `SanPham` ↔ `LoSanPham` ở PHIEN-030.
- Không tạo SKU/biến thể/giá/đơn vị; thuộc PHIEN-031.
- Không thêm ảnh sản phẩm; thuộc PHIEN-032.
- Không mở public product API; thuộc PHIEN-033.

## Phiên tiếp theo

**PHIEN-031 – Biến thể và giá**

PHIEN-030 chỉ hoàn thành Product catalog core Backend/Admin.
Phạm vi phiên tiếp theo đọc trực tiếp từ master plan; không làm sớm trong PHIEN-030.

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
- [x] Sản phẩm
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

Không có lỗi source PHIEN-030.

Product catalog core đã có Backend/Admin.

Không tạo SKU/biến thể/giá trước PHIEN-031 – Biến thể và giá.
Không thêm ảnh trước PHIEN-032 và không mở public product API trước PHIEN-033.

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

PHIEN-030 đã chạy thành công:

```text
fresh DB migration deploy qua PHIEN-029
Prisma format/validate/generate
migration SanPham
DB gate 1 table / 8 columns / 2 FK / 7 named index-columns
4 permissions / 8 mappings = KHACH_HANG 1 + NHAN_VIEN 3 + ADMIN 4
Product != Batch schema gate
Category PHIEN-029 stale Product-404 boundary -> PHIEN-030 protected 401/admin 200/public 404
không SKU/giá/đơn vị/ảnh/Batch FK
KHACH_HANG authenticated GET Product -> 200; mutation -> 403
unauthenticated Product API -> 401
inactive farm/category -> 400
create Product
list/search/filter farm/category/status
update Product
inactive reference update -> 400
NHAN_VIEN status -> 403
ADMIN status -> 200
Audit create/update/status
DELETE -> 404
variant/image/public Product routes -> 404
OpenAPI exact protected Product CRUD/status
Orval Product operations
Admin ProTable/create/edit/farm/category/status
QR E2E teardown regression
full API E2E isolated tối thiểu 21 suites
Redis/BullMQ namespace riêng từng suite
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
