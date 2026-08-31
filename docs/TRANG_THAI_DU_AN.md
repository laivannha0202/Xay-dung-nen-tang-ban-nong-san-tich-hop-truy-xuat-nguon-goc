# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 5 – CATALOG VÀ SẢN PHẨM
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá + Ảnh sản phẩm + API public sản phẩm đã sẵn sàng + Kho đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-034 – Kho**

Master model:

```text
maKho
ten
diaChi
status
```

Backend/Database:

- tạo model `Kho` độc lập với `maKho` unique, `ten`, `diaChi`, `TrangThaiBanGhi`;
- API protected list/detail/create/update/status;
- không có DELETE;
- RBAC `kho.xem/kho.tao/kho.sua/kho.khoa`;
- NHAN_VIEN có xem/tạo/sửa; ADMIN thêm khóa/mở;
- mọi mutation có Audit;
- Swagger/OpenAPI -> Orval;
- Admin Web có trang Kho bằng ProTable/ModalForm.

Boundary:

- PHIEN-034 chưa tạo InventoryLot;
- chưa có `onHand/reserved/blocked/available`;
- Kho chưa nối Batch/Variant;
- chưa tạo inventory ledger / nhập-xuất-chuyển kho / FEFO / Order / Cart;
- public Product availability vẫn `soLuongKhaDung = null`, `coTheDatHang = false`.

## Phiên tiếp theo

**PHIEN-035 – InventoryLot**

PHIEN-035 mới nối:

```text
warehouse + batch + variant
onHand
reserved
blocked
available
```

với rule:

```text
available = onHand - reserved - blocked
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

Không có lỗi source PHIEN-033.

Giá Order phải snapshot khi đặt hàng; Order/OrderItem chưa đến phase nên chưa tạo sớm.

Public Product API đã mở ở PHIEN-033. Tồn kho vẫn chưa được suy đoán; PHIEN-034 bắt đầu Kho.

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
