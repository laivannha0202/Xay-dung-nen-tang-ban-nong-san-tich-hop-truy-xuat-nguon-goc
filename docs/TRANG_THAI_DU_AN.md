# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 7 – CUSTOMER WEB CORE
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá + Ảnh sản phẩm + API public sản phẩm đã sẵn sàng + Kho đã sẵn sàng + InventoryLot/Tồn kho theo lô đã sẵn sàng + Inventory Transaction Ledger đã sẵn sàng + Nhập/Xuất/Chuyển kho atomic đã sẵn sàng + Điều chỉnh tồn kho có Audit đã sẵn sàng + FEFO đã sẵn sàng + Cảnh báo hàng sắp hết hạn đã sẵn sàng + Customer Web layout/Design System đã sẵn sàng + Trang chủ Customer Web đã sẵn sàng + Search/List/Filter đã sẵn sàng + Product Detail đã sẵn sàng + Farm Detail đã sẵn sàng + Trace Web đã sẵn sàng + Cart Backend đã sẵn sàng + Cart Customer Web đã sẵn sàng + Checkout Preview đã sẵn sàng + Inventory Reservation đã sẵn sàng + Order schema đã sẵn sàng + Create Order đã sẵn sàng + Payment Domain đã sẵn sàng + COD + Mock Payment đã sẵn sàng + Payment Gateway Adapter đã sẵn sàng + Payment Callback Idempotency đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-056 – Payment Callback Idempotency**

Endpoint public:

```text
GET /api/v1/thanh-toan/callback/:gateway
```

Gateway:

```text
MOCK
VNPAY_SANDBOX
```

Flow:

```text
callback
→ adapter.verifyCallback()
→ verify signature
→ lookup existing payment_transaction by externalReference
→ verify gateway + amount
→ inspect Payment/Transaction state
→ inventory terminal action
→ update Payment + Transaction
```

Idempotency:

- callback KHÔNG insert `payment_transaction`;
- callback chỉ cập nhật transaction đã tồn tại;
- Payment/Transaction chỉ chuyển từ `CREATED/PENDING`;
- duplicate terminal cùng kết quả trả success idempotent;
- callback terminal ngược kết quả trả conflict.

Inventory:

```text
success -> xacNhanDaBan() -> DA_BAN -> ORDER_SHIP
failed  -> giaiPhong()    -> DA_GIAI_PHONG/HET_HAN -> ORDER_RELEASE
```

`DatChoTonKhoService` giữ row lock và terminal no-op nên callback đồng thời
không tạo duplicate inventory ledger effect.

Security:

- invalid signature -> 400, không business mutation;
- callback amount phải khớp `payment_transaction.soTien`;
- unknown transaction -> 404;
- gateway phải khớp Payment/Transaction method.

Focused concurrency test:

```text
5 callback success đồng thời
→ 1 payment_transaction
→ 1 ORDER_SHIP

3 callback failed đồng thời
→ 1 payment_transaction
→ 1 ORDER_RELEASE
```

OpenAPI/Orval:

```text
useXuLyCallbackThanhToan
```

Boundary:

- không schema/migration;
- chưa Order State Machine;
- chưa Shipment;
- chưa Customer/Admin/Mobile checkout UI.

## Phiên tiếp theo

**PHIEN-057 – Checkout UI Customer Web**

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

Không có lỗi source PHIEN-056.

Giá Order phải snapshot khi đặt hàng; Order/OrderItem chưa đến phase nên chưa tạo sớm.

PHIEN-055 đã triển khai Payment Gateway Adapter theo exact interface `createPayment`/`verifyCallback`/`refund`, với implementation Mock và VNPay Sandbox v2.1.0. VNPay dùng HMACSHA512 cho URL/callback, refund POST JSON tới sandbox merchant API và verify checksum response. Credential chỉ đọc từ environment placeholder, không hardcode secret thật. Chưa nối callback vào Payment lifecycle/idempotency; PHIEN-056 tiếp theo là Payment Callback Idempotency.

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

PHIEN-056 đã chạy thành công:

```text
base exact PHIEN-055 SHA
fresh validation DB + existing migrations
API typecheck
5 callback success concurrency E2E
3 callback failed concurrency E2E
invalid signature no-effect E2E
amount mismatch no-effect E2E
duplicate terminal response E2E
Gateway Adapter regression E2E
COD + Mock Payment regression E2E
Reservation regression E2E
OpenAPI snapshot
Orval regenerate
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
