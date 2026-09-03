# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

03/09/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 15 – DASHBOARD VÀ BÁO CÁO
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá + Ảnh sản phẩm + API public sản phẩm đã sẵn sàng + Kho đã sẵn sàng + InventoryLot/Tồn kho theo lô đã sẵn sàng + Inventory Transaction Ledger đã sẵn sàng + Nhập/Xuất/Chuyển kho atomic đã sẵn sàng + Điều chỉnh tồn kho có Audit đã sẵn sàng + FEFO đã sẵn sàng + Cảnh báo hàng sắp hết hạn đã sẵn sàng + Customer Web layout/Design System đã sẵn sàng + Trang chủ Customer Web đã sẵn sàng + Search/List/Filter đã sẵn sàng + Product Detail đã sẵn sàng + Farm Detail đã sẵn sàng + Trace Web đã sẵn sàng + Cart Backend đã sẵn sàng + Cart Customer Web đã sẵn sàng + Checkout Preview đã sẵn sàng + Inventory Reservation đã sẵn sàng + Order schema đã sẵn sàng + Create Order đã sẵn sàng + Payment Domain đã sẵn sàng + COD + Mock Payment đã sẵn sàng + Payment Gateway Adapter đã sẵn sàng + Payment Callback Idempotency đã sẵn sàng + Checkout UI Customer Web đã sẵn sàng + Payment Result UI đã sẵn sàng + Order State Machine đã sẵn sàng + Customer Order List/Detail đã sẵn sàng + Admin Order List/Detail đã sẵn sàng + Packing Workflow đã sẵn sàng + Shipment Domain đã sẵn sàng + Shipping Adapter Mock đã sẵn sàng + Review Backend đã sẵn sàng + Review UI Customer Web đã sẵn sàng + Complaint Domain đã sẵn sàng + Complaint Customer Web đã sẵn sàng + Complaint Admin đã sẵn sàng + Refund Backend đã sẵn sàng + Customer Profile Backend + Customer Web đã sẵn sàng + Address Book Backend + Customer Web đã sẵn sàng + Wishlist Backend + Customer Web đã sẵn sàng + Follow Farm + new harvest notification đã sẵn sàng + Loyalty models/ledger đã sẵn sàng + Voucher/Promotion rule engine đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-089 – Inventory Reports**

Exact master:

```text
stock
near expiry
expired
waste
```

Backend:
- `GET /api/v1/quan-tri/bao-cao-ton-kho/ton-kho`;
- `GET /api/v1/quan-tri/bao-cao-ton-kho/sap-het-han`;
- `GET /api/v1/quan-tri/bao-cao-ton-kho/het-han`;
- `GET /api/v1/quan-tri/bao-cao-ton-kho/hao-hut`;
- quyền `kho.xem`;
- stock đọc snapshot `inventory_lot`: onHand / reserved / blocked / available;
- near expiry dùng ngưỡng `near-expiry` trong System Settings và cùng UTC-day semantic với cảnh báo tồn kho hiện có;
- expired chỉ lấy lô còn `onHand > 0` có HSD trước ngày tham chiếu;
- waste chỉ lấy Inventory Transaction Ledger loại `DAMAGE`/`EXPIRE`; không coi mọi signed `ADJUSTMENT` là hao hụt;
- report hoàn toàn read-only, không thêm schema/migration và không thêm workflow ghi nhận hỏng/hết hạn.

Admin Web:
- route `/bao-cao-ton-kho`;
- 4 tab đúng exact master: Tồn hiện tại / Sắp hết hạn / Đã hết hạn / Hao hụt;
- có search, pagination và filter DAMAGE/EXPIRE ở tab hao hụt;
- không thêm dependency mới.

Boundary:
- chưa tạo Order/Revenue Reports;
- chưa thêm filter ngày/farm/category của PHIEN-090;
- không sửa inventory mutation/ledger semantics.

## Phiên tiếp theo

**PHIEN-090 – Order/Revenue Reports**

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
- [x] Đánh giá (Backend PHIEN-065 + Customer Web PHIEN-066)
- [x] Khiếu nại (Domain PHIEN-067 + Customer Web PHIEN-068 + Admin PHIEN-069)
- [x] Hoàn tiền (Backend PHIEN-070)
- [x] Hồ sơ khách hàng (Backend + Customer Web PHIEN-071)
- [x] Sổ địa chỉ (Backend + Customer Web PHIEN-072)
- [x] Yêu thích sản phẩm (Wishlist PHIEN-073)
- [x] Theo dõi trang trại + thông báo thu hoạch mới (PHIEN-074)
- [x] Loyalty models/ledger (PHIEN-075)
- [x] Voucher/Promotion eligibility rule engine (PHIEN-076)
- [x] Quản lý khách hàng Admin (PHIEN-077)
- [x] Quản lý nhân viên Admin (PHIEN-078)
- [x] Permission Matrix Admin (PHIEN-079)
- [x] Audit UI Admin (PHIEN-080)
- [x] System Settings Admin (PHIEN-081)
- [x] Commission Rules Admin (PHIEN-082)
- [x] Seller Balance Backend (PHIEN-083)
- [x] Settlement Backend (PHIEN-084)
- [x] Payout Backend (PHIEN-085)
- [x] Finance Admin UI (PHIEN-086)
- [x] Dashboard API (PHIEN-087)
- [x] Admin Dashboard (PHIEN-088)
- [x] Inventory Reports (PHIEN-089)
- [x] Voucher/Promotion rule engine (PHIEN-076)

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

Không có lỗi source PHIEN-078.

Create Order đã snapshot giá; PHIEN-062 đã có Packing Workflow; PHIEN-063 đã có Shipment Domain theo supplier order; PHIEN-064 đã có Mock Shipping Adapter boundary. Chưa có carrier API/lifecycle integration vì master không yêu cầu. PHIEN-065 đã có Review Backend và PHIEN-066 đã có Review UI Customer Web. PHIEN-067..069 đã hoàn tất Complaint Domain/Customer/Admin; PHIEN-070 đã có Refund Backend qua Payment adapter. Complaint resolution vẫn chưa được bind tự động vì exact master không yêu cầu. PHIEN-071 đã có Customer Profile Backend + Customer Web; PHIEN-072 đã có Address Book CRUD/default; PHIEN-073 đã có Wishlist favorite product; PHIEN-074 đã có Follow Farm + in-app new harvest notification; PHIEN-075 đã có Loyalty account/transaction foundation; PHIEN-076 đã có Voucher/Promotion eligibility rule engine. Admin Customer Management để PHIEN-077.

Payment Callback Idempotency PHIEN-056 đã xử lý callback trên Payment/Transaction + inventory reservation. PHIEN-070 cung cấp Refund API riêng qua Payment adapter; Payment lifecycle vẫn chưa tự chuyển Order state và cancel action PHIEN-060 không tự gọi Refund API vì master không yêu cầu integration đó.

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

PHIEN-079 đã chạy thành công:

```text
exact PHIEN-078 base + exact 18-file scope
Permission Matrix GET + PUT
JWT + phan_quyen.quan_ly
row lock + idempotency + audit
ADMIN lockout guard
no role/permission CRUD
Orval typed
Permission Matrix e2e + RBAC + Employee regression
API/admin-web/api-client build/typecheck
pnpm lint/typecheck/build/format:check
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
