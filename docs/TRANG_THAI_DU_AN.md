# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 6 – KHO VÀ TỒN KHO
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
- [x] Kho
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

Không có lỗi source PHIEN-034.

Giá Order phải snapshot khi đặt hàng; Order/OrderItem chưa đến phase nên chưa tạo sớm.

Public Product API đã mở ở PHIEN-033. PHIEN-034 đã hoàn thành master data Kho; tồn kho vẫn chưa được suy đoán. PHIEN-035 mới triển khai InventoryLot.

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

PHIEN-034 đã chạy thành công:

```text
fresh DB deploy 22 migration trước PHIEN-034
Prisma format / validate / generate
migration Kho
DB gate: 1 bảng Kho / 7 cột / maKho unique / 0 FK
RBAC Kho: 4 permissions / 7 role mappings
KHACH_HANG không quản trị Kho
NHAN_VIEN xem / tạo / sửa
ADMIN thêm khóa / mở
không có DELETE Kho
Audit create / update / status
focused Kho E2E: 10/10 PASS
public Product inventory boundary: PASS
Swagger/OpenAPI Kho: 5 operations, không DELETE
Orval generated Kho API
Admin Web /kho typecheck PASS
full API E2E isolated: 25/25 suites PASS
pnpm lint
pnpm typecheck
workspace tests
pnpm build
pnpm format:check
git diff --check
```

Boundary sau PHIEN-034:

```text
chưa InventoryLot
chưa onHand / reserved / blocked / available
Kho chưa nối Batch / Variant
public Product availability vẫn null / false
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
