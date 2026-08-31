# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 6 – KHO VÀ TỒN KHO
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá + Ảnh sản phẩm + API public sản phẩm đã sẵn sàng + Kho đã sẵn sàng + InventoryLot/Tồn kho theo lô đã sẵn sàng + Inventory Transaction Ledger đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-036 – Inventory Transaction Ledger**

Ledger types:

```text
HARVEST_IN
TRANSFER_IN
TRANSFER_OUT
ORDER_RESERVE
ORDER_RELEASE
ORDER_SHIP
RETURN_IN
DAMAGE
EXPIRE
ADJUSTMENT
```

Backend/Database:

- tạo enum `LoaiGiaoDichTonKho` đủ 10 type master;
- tạo model `GiaoDichTonKho` map `inventory_transaction`;
- mỗi transaction gắn đúng một `TonKhoLo`;
- DB chỉ lưu id / tonKhoLoId / loai / soLuong / createdAt;
- không có `updatedAt`;
- CHECK: type thường quantity > 0; ADJUSTMENT quantity != 0;
- 2 DB trigger cấm UPDATE/DELETE ledger cũ;
- correction phải append transaction mới;
- API protected read-only list/detail `/api/v1/giao-dich-ton-kho`;
- read dùng `kho.xem`; không seed permission mới;
- Admin Web có trang Inventory Transaction Ledger read-only;
- Swagger/OpenAPI -> Orval.

Boundary:

- append ledger trực tiếp ở PHIEN-036 không tự mutate onHand/reserved/blocked;
- chưa có POST/PATCH/DELETE ledger;
- chưa có nhập/xuất/chuyển kho;
- chưa FEFO / Cart / Order;
- PHIEN-037 mới làm action movement atomic.

## Phiên tiếp theo

**PHIEN-037 – Nhập/Xuất/Chuyển kho**

PHIEN-037 phải bảo đảm:

```text
mọi action phải atomic
InventoryLot state + immutable ledger phải cùng transaction
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
- [x] Tồn kho
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

Không có lỗi source PHIEN-036.

Giá Order phải snapshot khi đặt hàng; Order/OrderItem chưa đến phase nên chưa tạo sớm.

PHIEN-036 đã tạo immutable Inventory Transaction Ledger gắn với InventoryLot; ledger cũ bị chặn UPDATE/DELETE ở DB. PHIEN-037 mới triển khai nhập/xuất/chuyển kho atomic để cập nhật InventoryLot và append ledger trong cùng transaction.

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

PHIEN-036 đã chạy thành công:

```text
fresh DB deploy toàn bộ migration qua PHIEN-035
Prisma format / validate / generate
migration Inventory Transaction Ledger
DB gate: 1 bảng / 5 cột / 1 FK / 1 CHECK / 2 immutable trigger
enum đủ 10 transaction type master
không có updatedAt trong ledger
UPDATE/DELETE ledger bị DB trigger chặn
API Ledger chỉ GET list/detail
Ledger focused E2E: 9/9 PASS
TonKho/Kho/Public Product stale boundary PHIEN-036: PASS
append ledger trực tiếp không tự mutate InventoryLot quantity
Swagger/OpenAPI Ledger: 2 GET operations
Orval generated Ledger read API
Admin Web /giao-dich-ton-kho read-only typecheck PASS
full API E2E isolated: tối thiểu 27 suites PASS
pnpm lint
pnpm typecheck
workspace tests
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
