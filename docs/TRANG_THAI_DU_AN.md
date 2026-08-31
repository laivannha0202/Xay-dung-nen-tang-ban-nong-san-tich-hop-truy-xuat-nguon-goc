# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 5 – CATALOG VÀ SẢN PHẨM
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-031 – Biến thể và giá**

Contract master:

```text
SKU
500g
1kg
2kg
gia
donVi
```

Cách biểu diễn dữ liệu:

```text
BienTheSanPham
sku
khoiLuong
gia
donVi
```

Ví dụ:

```text
CARROT-500G -> khoiLuong=500, donVi=g
CARROT-1KG  -> khoiLuong=1,   donVi=kg
CARROT-2KG  -> khoiLuong=2,   donVi=kg
```

Backend:

- model `BienTheSanPham` thuộc đúng một `SanPham`;
- SKU unique toàn hệ thống;
- unique `(sanPhamId, khoiLuong, donVi)` để không trùng quy cách trong một Product;
- `khoiLuong > 0`;
- `gia > 0`;
- normalize SKU uppercase;
- normalize `donVi` lowercase;
- không DELETE Variant ở PHIEN-031;
- Audit:
  - `BIEN_THE_SAN_PHAM_TAO`;
  - `BIEN_THE_SAN_PHAM_SUA`;
  - khi sửa giá, metadata lưu `giaTruoc/giaSau`.

RBAC:

- không tạo permission Variant riêng;
- dùng lại:
  - `san_pham.xem`;
  - `san_pham.tao`;
  - `san_pham.sua`;
- quyền Product PHIEN-030 giữ nguyên 4 permissions / 8 mappings.

API protected:

```text
GET   /api/v1/san-pham/:sanPhamId/bien-the
POST  /api/v1/san-pham/:sanPhamId/bien-the
PATCH /api/v1/san-pham/:sanPhamId/bien-the/:id
```

Admin:

- vẫn dùng route `/san-pham`;
- action `Biến thể`;
- modal quản lý SKU/quy cách/giá;
- thêm biến thể;
- sửa biến thể và giá;
- hiển thị giá catalog hiện tại.

Rule kiến trúc bắt buộc:

**Giá Order phải snapshot khi đặt hàng.**

PHIEN-031 chỉ lưu **giá catalog hiện tại** trên `BienTheSanPham`.
Không tạo Order/OrderItem sớm chỉ để implement snapshot.
Khi đến Checkout/Order, backend phải copy giá hiện tại vào chi tiết đơn hàng;
đơn cũ không được thay đổi khi giá catalog đổi sau đó.

Quality:

- Swagger/OpenAPI;
- Orval;
- E2E 500g/1kg/2kg;
- RBAC;
- duplicate SKU/quy cách;
- positive weight/price;
- Audit price before/after;
- Product E2E boundary được nâng từ Variant 404 sang Variant 200;
- full E2E isolated tối thiểu 22 suites;
- QR teardown regression;
- không dependency mới.

Boundary:

- Product ≠ Batch vẫn giữ.
- Không tạo Order/OrderItem sớm.
- Không thêm ảnh sản phẩm; thuộc PHIEN-032.
- Không mở public Product API; thuộc PHIEN-033.

## Phiên tiếp theo

**PHIEN-032 – Ảnh sản phẩm**

PHIEN-031 đã hoàn thành Variant + current catalog price.
Ảnh sản phẩm vẫn để PHIEN-032; public Product API vẫn để PHIEN-033.

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

Không có lỗi source PHIEN-031.

Giá Order phải snapshot khi đặt hàng, nhưng Order/OrderItem chưa đến phase nên chưa tạo sớm.

Không thêm ảnh trước PHIEN-032 và không mở public Product API trước PHIEN-033.

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

PHIEN-031 đã chạy thành công:

```text
fresh DB migration deploy qua PHIEN-030
Prisma format/validate/generate
migration BienTheSanPham
DB gate 1 table / 8 columns / 1 Product FK / 6 named index-columns
RBAC Product giữ nguyên 4 permissions / 8 mappings
không permission Variant riêng
SKU unique
unique Product + khoiLuong + donVi
500g / 1kg / 2kg
khoiLuong > 0
gia > 0
KHACH_HANG authenticated GET Variant -> 200; POST -> 403
NHAN_VIEN create/update Variant
Audit create/update + giaTruoc/giaSau
DELETE Variant -> 404
Product boundary Variant -> 200
image/public Product routes -> 404
Order API -> 404
OpenAPI exact protected Variant list/create/update
Orval Variant operations
Admin Variant modal + SKU/quy cách/giá
QR E2E teardown regression
full API E2E isolated tối thiểu 22 suites
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
