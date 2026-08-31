# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 5 – CATALOG VÀ SẢN PHẨM
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá + Ảnh sản phẩm Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-032 – Ảnh sản phẩm**

Contract master:

```text
multiple upload
cover image
sort order
delete
```

Cách biểu diễn dữ liệu:

```text
SanPhamAnh
sanPhamId
tepTinId
laAnhBia
thuTu
```

Backend:

- thêm model `SanPhamAnh` liên kết `SanPham` với `TepTin`;
- một Product có nhiều ảnh;
- một `TepTin` không được gắn trùng hai lần vào cùng Product;
- chỉ nhận file ảnh đang hoạt động: JPEG / PNG / WebP;
- chỉ cho tác nhân gắn file do chính tác nhân tải lên, tránh gắn nhầm file private của người khác;
- multiple upload dùng lại `/api/v1/tep-tin/tai-len`, sau đó gắn nhiều `tepTinId` trong một request;
- ảnh đầu tiên tự trở thành cover khi Product chưa có ảnh;
- mỗi Product chỉ có đúng một cover khi còn ảnh;
- `thuTu` điều khiển sort order;
- DELETE association chỉ xóa `SanPhamAnh`, không xóa vật lý `TepTin`;
- nếu xóa cover thì ảnh còn lại đầu tiên tự trở thành cover;
- Audit:
  - `SAN_PHAM_ANH_THEM`;
  - `SAN_PHAM_ANH_DAT_BIA`;
  - `SAN_PHAM_ANH_SAP_XEP`;
  - `SAN_PHAM_ANH_XOA`.

RBAC:

- không tạo permission ảnh riêng;
- dùng lại `san_pham.xem` để xem ảnh;
- dùng lại `san_pham.sua` để gắn ảnh / đặt cover / sắp xếp / xóa association;
- quyền Product PHIEN-031 giữ nguyên 4 permissions / 8 mappings.

API protected:

```text
GET    /api/v1/san-pham/:sanPhamId/anh
POST   /api/v1/san-pham/:sanPhamId/anh
PATCH  /api/v1/san-pham/:sanPhamId/anh/sap-xep
PATCH  /api/v1/san-pham/:sanPhamId/anh/:id/anh-bia
DELETE /api/v1/san-pham/:sanPhamId/anh/:id
```

Admin:

- vẫn dùng route `/san-pham`;
- action `Ảnh`;
- chọn nhiều ảnh JPEG/PNG/WebP;
- upload qua hạ tầng `TepTin`/MinIO hiện có;
- hiển thị thumbnail bằng signed URL;
- đặt ảnh bìa;
- di chuyển lên/xuống để đổi sort order;
- xóa association ảnh khỏi Product.

Rule kiến trúc phải giữ:

- Product ≠ Batch.
- Giá Order phải snapshot khi đặt hàng.
- PHIEN-032 không tạo Order/OrderItem/Inventory sớm.
- Không mở public Product API; thuộc PHIEN-033.
- Không thêm dependency mới.

Quality:

- Prisma migration `SanPhamAnh`;
- DB gate 1 table / 7 columns / 2 FK;
- Swagger/OpenAPI;
- Orval;
- E2E multiple upload / cover / sort order / delete;
- E2E chặn PDF và ảnh private của actor khác;
- E2E cover fallback sau delete;
- E2E xác nhận xóa association không xóa `TepTin`;
- Product boundary ảnh protected từ 404 → 200;
- Variant PHIEN-031 vẫn hoạt động;
- public Product PHIEN-033 vẫn 404;
- full E2E isolated tối thiểu 23 suites;
- QR teardown regression;
- Redis/BullMQ namespace riêng từng suite.

## Phiên tiếp theo

**PHIEN-033 – API public sản phẩm**

PHIEN-032 đã hoàn thành ảnh Product protected + Admin.
Public Product API vẫn để PHIEN-033 theo master plan.

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

Không có lỗi source PHIEN-032.

Giá Order phải snapshot khi đặt hàng; Order/OrderItem chưa đến phase nên chưa tạo sớm.

Ảnh Product đã có protected Backend/Admin; public Product API vẫn để PHIEN-033.

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

PHIEN-032 đã chạy thành công:

```text
fresh DB migration deploy qua PHIEN-031
Prisma format/validate/generate
migration SanPhamAnh
DB gate 1 table / 7 columns / 2 FK / named indexes
RBAC Product giữ nguyên 4 permissions / 8 mappings
không permission ảnh riêng
multiple upload qua TepTin/MinIO hiện có
gắn nhiều tepTinId cho Product
chỉ JPEG/PNG/WebP hoạt động
chặn PDF
chặn gắn file private của actor khác
ảnh đầu tiên tự cover
đặt cover mới và chỉ còn đúng một cover
sort order bằng thuTu
reorder phải gửi đủ tập ảnh hiện tại
DELETE association
xóa cover tự chọn cover kế tiếp
DELETE association không xóa vật lý TepTin
Audit add/cover/sort/delete
Product boundary image protected -> 200
Variant PHIEN-031 vẫn -> 200
public Product API -> 404
Order/Inventory vẫn chưa tạo sớm
OpenAPI exact protected Product image operations
Orval Product image operations
Admin multiple upload + thumbnail + cover + reorder + delete
QR E2E teardown regression
full API E2E isolated tối thiểu 23 suites
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
