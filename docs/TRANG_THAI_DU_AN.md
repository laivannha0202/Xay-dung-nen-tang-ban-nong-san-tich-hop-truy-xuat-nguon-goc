# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

01/09/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 10 – ĐƠN HÀNG VÀ GIAO HÀNG
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá + Ảnh sản phẩm + API public sản phẩm đã sẵn sàng + Kho đã sẵn sàng + InventoryLot/Tồn kho theo lô đã sẵn sàng + Inventory Transaction Ledger đã sẵn sàng + Nhập/Xuất/Chuyển kho atomic đã sẵn sàng + Điều chỉnh tồn kho có Audit đã sẵn sàng + FEFO đã sẵn sàng + Cảnh báo hàng sắp hết hạn đã sẵn sàng + Customer Web layout/Design System đã sẵn sàng + Trang chủ Customer Web đã sẵn sàng + Search/List/Filter đã sẵn sàng + Product Detail đã sẵn sàng + Farm Detail đã sẵn sàng + Trace Web đã sẵn sàng + Cart Backend đã sẵn sàng + Cart Customer Web đã sẵn sàng + Checkout Preview đã sẵn sàng + Inventory Reservation đã sẵn sàng + Order schema đã sẵn sàng + Create Order đã sẵn sàng + Payment Domain đã sẵn sàng + COD + Mock Payment đã sẵn sàng + Payment Gateway Adapter đã sẵn sàng + Payment Callback Idempotency đã sẵn sàng + Checkout UI Customer Web đã sẵn sàng + Payment Result UI đã sẵn sàng + Order State Machine đã sẵn sàng + Customer Order List/Detail đã sẵn sàng + Admin Order List/Detail đã sẵn sàng + Packing Workflow đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-062 – Packing Workflow**

Exact checklist:

```text
đúng sản phẩm
đúng batch
đúng qty
đóng gói
QR
```

Backend:

```text
GET  /api/v1/quan-tri/don-hang/dong-goi/:donNhaCungCapId
POST /api/v1/quan-tri/don-hang/dong-goi/:donNhaCungCapId/bat-dau
POST /api/v1/quan-tri/don-hang/dong-goi/:donNhaCungCapId/hoan-tat
```

- reuse `don_hang.xu_ly` + PHIEN-059 state machine;
- start `DA_XAC_NHAN -> DANG_CHUAN_BI`;
- complete `DANG_CHUAN_BI -> DA_DONG_GOI`;
- Backend đối chiếu OrderItem/variant + batch allocation + qty;
- mọi batch phải có QR `maTruyXuat`;
- parent Order chỉ `DA_DONG_GOI` khi mọi supplier order đã đóng gói;
- Audit start/complete.

Boundary:

- không schema/migration/new permission;
- không Payment/Callback/Inventory quantity mutation;
- không auto `CHO_THANH_TOAN -> DA_XAC_NHAN`;
- không Customer Web/Mobile;
- không Shipment/DANG_GIAO.

## Phiên tiếp theo

**PHIEN-063 – Shipment Domain**

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
- [x] FEFO
- [x] Giỏ hàng
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

Không có lỗi source PHIEN-062.

Create Order đã snapshot giá; PHIEN-062 đã có Packing Workflow theo supplier order. Shipment thuộc PHIEN-063.

Payment Callback Idempotency PHIEN-056 đã xử lý callback trên Payment/Transaction + inventory reservation. Payment lifecycle hiện vẫn chưa tự chuyển Order state; PHIEN-060 cancel action vì vậy chặn payment đang xử lý/đã thanh toán và không tự refund.

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

PHIEN-062 đã chạy thành công:

```text
exact PHIEN-061 base SHA
exact PHIEN-062 5-item checklist
don_hang.xu_ly RBAC reuse
PHIEN-059 state-machine regression
GET checklist + POST start + POST complete
OrderItem/variant vs allocation validation
batch + qty validation
QR maTruyXuat required
DA_XAC_NHAN -> DANG_CHUAN_BI -> DA_DONG_GOI
parent Order multi-supplier aggregate
Audit start/complete
OpenAPI 3 operationIds + packing schemas
Orval generated client
Admin /don-hang packing checklist
API typecheck/focused Jest/build
api-client typecheck
Admin Web typecheck/build
no schema/migration/new permission
no Payment/Callback/Inventory quantity mutation
no Customer Web/Mobile/Shipment
pnpm lint
pnpm typecheck
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
