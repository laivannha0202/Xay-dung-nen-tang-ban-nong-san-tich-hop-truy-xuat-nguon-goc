# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 6 – KHO VÀ TỒN KHO
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá + Ảnh sản phẩm + API public sản phẩm đã sẵn sàng + Kho đã sẵn sàng + InventoryLot/Tồn kho theo lô đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-035 – InventoryLot**

Master key:

```text
warehouse + batch + variant
```

Quantity:

```text
onHand
reserved
blocked
available = onHand - reserved - blocked
```

Backend/Database:

- tạo model `TonKhoLo` map bảng `inventory_lot`;
- unique key `Kho + LoSanPham + BienTheSanPham`;
- DB lưu `onHand/reserved/blocked`, không lưu cột `available`;
- 4 CHECK constraint cấm quantity âm và cấm `reserved + blocked > onHand`;
- 3 FK RESTRICT tới Kho/Lô/Biến thể;
- API protected read-only list/detail `/api/v1/ton-kho`;
- read dùng quyền `kho.xem`;
- giữ `ton_kho.dieu_chinh` ADMIN-only cho phase mutation sau;
- public Product availability dùng InventoryLot từ Kho hoạt động + Lô `CO_THE_BAN` chưa hết hạn;
- Admin Web có trang Tồn kho read-only;
- Swagger/OpenAPI -> Orval.

Boundary:

- chưa có `inventory_transaction`;
- chưa có POST/PATCH/DELETE Tồn kho;
- chưa nhập/xuất/chuyển kho;
- chưa FEFO / Cart / Order;
- PHIEN-036 mới tạo immutable Inventory Transaction Ledger.

## Phiên tiếp theo

**PHIEN-036 – Inventory Transaction Ledger**

PHIEN-036 mới tạo ledger với các type master như:

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

Ledger cũ không được sửa.

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

Không có lỗi source PHIEN-035.

Giá Order phải snapshot khi đặt hàng; Order/OrderItem chưa đến phase nên chưa tạo sớm.

PHIEN-035 đã tạo InventoryLot theo Kho + Lô + Biến thể. Public Product availability đã dùng tồn thật hợp lệ; PHIEN-036 mới tạo immutable Inventory Transaction Ledger.

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

PHIEN-035 đã chạy thành công:

```text
fresh DB deploy toàn bộ migration qua PHIEN-034
Prisma format / validate / generate
migration InventoryLot
DB gate: 1 bảng / 9 cột / 3 FK / 4 CHECK / unique W+B+V
không lưu cột available
available = onHand - reserved - blocked
RBAC không mở rộng: kho.xem cho read, ton_kho.dieu_chinh vẫn ADMIN-only
Tồn kho focused E2E: 9/9 PASS
Kho boundary PHIEN-035: PASS
Public Product inventory integration: PASS
Kho khóa / Lô hết hạn bị loại khỏi public availability
API Tồn kho chỉ GET list/detail
chưa InventoryTransaction ledger
Swagger/OpenAPI Tồn kho: 2 GET operations
Orval generated Tồn kho read API
Admin Web /ton-kho read-only typecheck PASS
full API E2E isolated: tối thiểu 26 suites PASS
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
