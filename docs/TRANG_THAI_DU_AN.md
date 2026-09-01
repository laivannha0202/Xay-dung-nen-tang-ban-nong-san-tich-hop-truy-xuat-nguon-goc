# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 7 – CUSTOMER WEB CORE
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá + Ảnh sản phẩm + API public sản phẩm đã sẵn sàng + Kho đã sẵn sàng + InventoryLot/Tồn kho theo lô đã sẵn sàng + Inventory Transaction Ledger đã sẵn sàng + Nhập/Xuất/Chuyển kho atomic đã sẵn sàng + Điều chỉnh tồn kho có Audit đã sẵn sàng + FEFO đã sẵn sàng + Cảnh báo hàng sắp hết hạn đã sẵn sàng + Customer Web layout/Design System đã sẵn sàng + Trang chủ Customer Web đã sẵn sàng + Search/List/Filter đã sẵn sàng + Product Detail đã sẵn sàng + Farm Detail đã sẵn sàng + Trace Web đã sẵn sàng + Cart Backend đã sẵn sàng + Cart Customer Web đã sẵn sàng + Checkout Preview đã sẵn sàng + Inventory Reservation đã sẵn sàng + Order schema đã sẵn sàng + Create Order đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-052 – Create Order**

Transaction:

```text
validate cart
→ validate price
→ reserve
→ create order
→ create suborders
→ create items
→ allocate
```

API:

```text
POST /api/v1/don-hang
```

Request:

- `maYeuCau`: UUID idempotency key;
- exact cart item snapshot:
  `bienTheSanPhamId + soLuong + donGiaDuKien`.

Backend validation:

- persisted cart không rỗng;
- request và cart có exact variant set;
- quantity phải khớp;
- `donGiaDuKien` phải bằng current Backend price;
- item phải còn đặt được trước reserve;
- sau reserve lock cart và validate lại cart/catalog/current price.

Reservation:

- dùng `DatChoTonKhoService`;
- reference `ORDER:<maDonHang>`;
- FEFO + row lock + TTL từ PHIEN-050;
- Create Order response trả reservation đang giữ.

Create transaction:

- một `DonHang` tổng;
- split `DonHangNhaCungCap` theo supplier;
- `MucDonHang` snapshot current Backend product/variant/farm;
- `PhanBoDonHang` map trực tiếp reservation allocations;
- allocation sum bắt buộc khớp OrderItem quantity.

Idempotency:

- retry cùng `maYeuCau` trả Order đã tồn tại;
- không tạo thêm order/reservation.

Failure:

- stale price bị reject trước reserve;
- reserve fail không tạo Order orphan;
- nếu transaction tạo Order fail sau reserve,
  reservation được release best-effort.

Money scope:

- `tongTien`/`tamTinh` hiện là merchandise current-price subtotal;
- không fake promotion/shipping/points;
- chưa Payment.

OpenAPI/Orval:

```text
useTaoDonHang
```

Boundary:

- không schema/migration mới;
- không clear cart ngoài exact master;
- chưa Payment/Shipment;
- chưa Order State Machine;
- không Customer/Admin/Mobile UI.

## Phiên tiếp theo

**PHIEN-053 – Payment Domain**

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

Không có lỗi source PHIEN-052.

Giá Order phải snapshot khi đặt hàng; Order/OrderItem chưa đến phase nên chưa tạo sớm.

PHIEN-052 đã triển khai authenticated Create Order theo exact transaction: validate persisted cart + current price, FEFO reserve, sau đó transaction tạo order/supplier_order/order_item/order_allocation. Request có `maYeuCau` idempotency; allocation lấy trực tiếp từ durable reservation PHIEN-050. Nếu create transaction lỗi sau reserve thì release reservation best-effort. PHIEN-053 tiếp theo là Payment Domain.

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

PHIEN-052 đã chạy thành công:

```text
base exact PHIEN-051 SHA
fresh validation DB + existing migrations
API typecheck
stale-price-before-reserve E2E
supplier split Create Order E2E
reservation/allocation E2E
idempotent retry E2E
stock-change reject/no orphan Order E2E
Reservation regression E2E
Order schema regression E2E
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
