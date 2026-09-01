# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

01/09/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 11 – ĐÁNH GIÁ VÀ KHIẾU NẠI
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá + Ảnh sản phẩm + API public sản phẩm đã sẵn sàng + Kho đã sẵn sàng + InventoryLot/Tồn kho theo lô đã sẵn sàng + Inventory Transaction Ledger đã sẵn sàng + Nhập/Xuất/Chuyển kho atomic đã sẵn sàng + Điều chỉnh tồn kho có Audit đã sẵn sàng + FEFO đã sẵn sàng + Cảnh báo hàng sắp hết hạn đã sẵn sàng + Customer Web layout/Design System đã sẵn sàng + Trang chủ Customer Web đã sẵn sàng + Search/List/Filter đã sẵn sàng + Product Detail đã sẵn sàng + Farm Detail đã sẵn sàng + Trace Web đã sẵn sàng + Cart Backend đã sẵn sàng + Cart Customer Web đã sẵn sàng + Checkout Preview đã sẵn sàng + Inventory Reservation đã sẵn sàng + Order schema đã sẵn sàng + Create Order đã sẵn sàng + Payment Domain đã sẵn sàng + COD + Mock Payment đã sẵn sàng + Payment Gateway Adapter đã sẵn sàng + Payment Callback Idempotency đã sẵn sàng + Checkout UI Customer Web đã sẵn sàng + Payment Result UI đã sẵn sàng + Order State Machine đã sẵn sàng + Customer Order List/Detail đã sẵn sàng + Admin Order List/Detail đã sẵn sàng + Packing Workflow đã sẵn sàng + Shipment Domain đã sẵn sàng + Shipping Adapter Mock đã sẵn sàng + Review Backend đã sẵn sàng + Review UI Customer Web đã sẵn sàng + Complaint Domain đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-067 – Complaint Domain**

Exact master:

```text
Entity:
complaint
complaint_evidence

Reason:
hỏng
dập
sai
thiếu
hết hạn
chất lượng
chứng nhận
```

Backend domain:

```text
POST /api/v1/khieu-nai
GET  /api/v1/khieu-nai/muc-don-hang/:mucDonHangId/dieu-kien
GET  /api/v1/khieu-nai/cua-toi
GET  /api/v1/khieu-nai/cua-toi/:id
GET  /api/v1/quan-tri/khieu-nai
GET  /api/v1/quan-tri/khieu-nai/:id
```

- `KhieuNai` map `complaint`, gắn `MucDonHang/order_item`;
- `KhieuNaiBangChung` map `complaint_evidence`, gắn `TepTin`;
- exact 7 reason được map sang enum code HONG/DAP/SAI/THIEU/HET_HAN/CHAT_LUONG/CHUNG_NHAN;
- customer ownership xác minh từ order item -> supplier order -> order -> customer;
- eligibility xác minh Shipment `DELIVERED`, client không tự khai delivered;
- evidence phải là file active do chính user upload và có MIME image/video;
- detail trả order/item/batch allocation/shipment/evidence từ source-of-truth để PHIEN-068/069 dùng;
- Admin list/detail read-only reuse `don_hang.xu_ly`, không thêm permission mới;
- OpenAPI + Orval contract đã sẵn sàng.

Boundary:

- không Customer Web wizard (PHIEN-068);
- không Complaint Admin UI (PHIEN-069);
- không complaint status/resolution workflow vì exact master chưa nêu;
- không Refund (PHIEN-070);
- không Shipment/Order/Payment/Inventory mutation.

## Phiên tiếp theo

**PHIEN-068 – Complaint Customer Web**

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

Không có lỗi source PHIEN-067.

Create Order đã snapshot giá; PHIEN-062 đã có Packing Workflow; PHIEN-063 đã có Shipment Domain theo supplier order; PHIEN-064 đã có Mock Shipping Adapter boundary. Chưa có carrier API/lifecycle integration vì master không yêu cầu. PHIEN-065 đã có Review Backend và PHIEN-066 đã có Review UI Customer Web. PHIEN-067 đã có Complaint Domain + API nền; PHIEN-068 mới làm Complaint Customer Web, PHIEN-069 mới làm Complaint Admin và PHIEN-070 mới Refund.

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

PHIEN-067 đã chạy thành công:

```text
exact PHIEN-066 base SHA + exact 8-file previous scope
exact PHIEN-067 entities complaint + complaint_evidence
exact 7 complaint reasons
Prisma complaint schema + deterministic migration
complaint/order_item relation; complaint_evidence/file relation
không unique complaint/order_item ngoài master
customer ownership from order_item -> supplier_order -> order -> customer
Shipment DELIVERED source-of-truth eligibility
evidence active + uploader ownership + image/video MIME validation
customer create + eligibility + own list/detail
admin read-only list/detail reuse don_hang.xu_ly
detail includes order/item/batch allocation/shipment/evidence
OpenAPI 6 Complaint operations + Orval generated client
PHIEN-065 Review Backend regression
PHIEN-063 Shipment Domain regression
API typecheck/build
api-client typecheck
no Customer/Admin UI
no complaint status/resolution workflow
no Refund
no Shipment/Order/Payment/Inventory mutation
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
