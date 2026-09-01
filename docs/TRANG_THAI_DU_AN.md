# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 7 – CUSTOMER WEB CORE
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá + Ảnh sản phẩm + API public sản phẩm đã sẵn sàng + Kho đã sẵn sàng + InventoryLot/Tồn kho theo lô đã sẵn sàng + Inventory Transaction Ledger đã sẵn sàng + Nhập/Xuất/Chuyển kho atomic đã sẵn sàng + Điều chỉnh tồn kho có Audit đã sẵn sàng + FEFO đã sẵn sàng + Cảnh báo hàng sắp hết hạn đã sẵn sàng + Customer Web layout/Design System đã sẵn sàng + Trang chủ Customer Web đã sẵn sàng + Search/List/Filter đã sẵn sàng + Product Detail đã sẵn sàng + Farm Detail đã sẵn sàng + Trace Web đã sẵn sàng + Cart Backend đã sẵn sàng + Cart Customer Web đã sẵn sàng + Checkout Preview đã sẵn sàng + Inventory Reservation đã sẵn sàng + Order schema đã sẵn sàng + Create Order đã sẵn sàng + Payment Domain đã sẵn sàng + COD + Mock Payment đã sẵn sàng + Payment Gateway Adapter đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-055 – Payment Gateway Adapter**

Exact interface:

```text
createPayment
verifyCallback
refund
```

Implementation:

```text
MockPaymentGateway
VnPaySandboxGateway
PaymentGatewayRegistry
```

Mock:

- `createPayment`: deterministic local payment URL;
- `verifyCallback`: signature/result giả lập;
- `refund`: full/partial refund giả lập;
- không network.

VNPay Sandbox v2.1.0:

### createPayment

```text
vnp_Version = 2.1.0
vnp_Command = pay
vnp_Amount  = VND * 100
vnp_TxnRef  = merchant external reference
```

Params được sort + URL encode và ký HMACSHA512.
Gateway URL mặc định:

```text
https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

### verifyCallback

- bỏ `vnp_SecureHash` / `vnp_SecureHashType` khỏi sign data;
- sort + URL encode params;
- verify HMACSHA512 bằng `VNPAY_HASH_SECRET`;
- verify `vnp_TmnCode`;
- chỉ `success=true` khi:
  - signature hợp lệ;
  - `vnp_ResponseCode=00`;
  - `vnp_TransactionStatus=00`.

PHIEN-055 chỉ verify callback ở adapter.
Không update Payment/Inventory từ callback ở phiên này.

### refund

POST JSON tới:

```text
https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
```

- `vnp_Command=refund`;
- full refund -> `vnp_TransactionType=02`;
- partial refund -> `vnp_TransactionType=03`;
- request checksum dùng exact field-order VNPAY v2.1.0;
- response refund cũng verify checksum trước khi `accepted=true`.

Config:

```text
VNPAY_TMN_CODE
VNPAY_HASH_SECRET
VNPAY_PAYMENT_URL
VNPAY_API_URL
```

`.env.example` chỉ chứa placeholder sandbox; không commit credential thật.

Boundary:

- không schema/migration;
- không public API/OpenAPI mới;
- không thay COD/Mock Payment lifecycle PHIEN-054;
- chưa callback controller;
- chưa callback idempotency/database update;
- chưa Order State Machine/Shipment/UI.

## Phiên tiếp theo

**PHIEN-056 – Payment Callback Idempotency**

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

Không có lỗi source PHIEN-055.

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

PHIEN-055 đã chạy thành công:

```text
base exact PHIEN-054 SHA
fresh validation DB + existing migrations
PaymentGatewayAdapter exact interface test
PaymentGatewayRegistry Mock/VNPay test
Mock createPayment/verifyCallback/refund test
VNPay create URL HMACSHA512 test
VNPay valid/tampered callback test
VNPay signed refund POST/response checksum test
COD + Mock Payment regression E2E
Payment Domain regression E2E
API typecheck
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
