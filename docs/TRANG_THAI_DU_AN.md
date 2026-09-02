# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

01/09/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 12 – KHÁCH HÀNG, YÊU THÍCH, THEO DÕI, LOYALTY
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá + Ảnh sản phẩm + API public sản phẩm đã sẵn sàng + Kho đã sẵn sàng + InventoryLot/Tồn kho theo lô đã sẵn sàng + Inventory Transaction Ledger đã sẵn sàng + Nhập/Xuất/Chuyển kho atomic đã sẵn sàng + Điều chỉnh tồn kho có Audit đã sẵn sàng + FEFO đã sẵn sàng + Cảnh báo hàng sắp hết hạn đã sẵn sàng + Customer Web layout/Design System đã sẵn sàng + Trang chủ Customer Web đã sẵn sàng + Search/List/Filter đã sẵn sàng + Product Detail đã sẵn sàng + Farm Detail đã sẵn sàng + Trace Web đã sẵn sàng + Cart Backend đã sẵn sàng + Cart Customer Web đã sẵn sàng + Checkout Preview đã sẵn sàng + Inventory Reservation đã sẵn sàng + Order schema đã sẵn sàng + Create Order đã sẵn sàng + Payment Domain đã sẵn sàng + COD + Mock Payment đã sẵn sàng + Payment Gateway Adapter đã sẵn sàng + Payment Callback Idempotency đã sẵn sàng + Checkout UI Customer Web đã sẵn sàng + Payment Result UI đã sẵn sàng + Order State Machine đã sẵn sàng + Customer Order List/Detail đã sẵn sàng + Admin Order List/Detail đã sẵn sàng + Packing Workflow đã sẵn sàng + Shipment Domain đã sẵn sàng + Shipping Adapter Mock đã sẵn sàng + Review Backend đã sẵn sàng + Review UI Customer Web đã sẵn sàng + Complaint Domain đã sẵn sàng + Complaint Customer Web đã sẵn sàng + Complaint Admin đã sẵn sàng + Refund Backend đã sẵn sàng + Customer Profile Backend + Customer Web đã sẵn sàng + Address Book Backend + Customer Web đã sẵn sàng + Wishlist Backend + Customer Web đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-073 – Wishlist**

Exact master:

```text
favorite product
```

Backend:

```text
GET    /api/v1/khach-hang/yeu-thich
GET    /api/v1/khach-hang/yeu-thich/:sanPhamId/trang-thai
PUT    /api/v1/khach-hang/yeu-thich/:sanPhamId
DELETE /api/v1/khach-hang/yeu-thich/:sanPhamId
```

- thêm `SanPhamYeuThich` + migration deterministic;
- unique `khachHangId + sanPhamId` chống favorite trùng;
- JWT customer ownership;
- PUT/DELETE idempotent;
- chỉ favorite sản phẩm đang công khai theo cùng boundary Product Public;
- list chỉ trả favorite có sản phẩm hiện còn công khai.

Customer Web:

- Product Detail có nút `Yêu thích`/`Đã yêu thích`;
- route `/yeu-thich` hiển thị wishlist theo tài khoản;
- generated Orval client là đường gọi API duy nhất.

Boundary:

- không Follow Farm/follow-unfollow;
- không new harvest notification (PHIEN-074);
- không Loyalty;
- không Admin/Mobile.

## Phiên tiếp theo

**PHIEN-074 – Follow Farm**

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

Không có lỗi source PHIEN-073.

Create Order đã snapshot giá; PHIEN-062 đã có Packing Workflow; PHIEN-063 đã có Shipment Domain theo supplier order; PHIEN-064 đã có Mock Shipping Adapter boundary. Chưa có carrier API/lifecycle integration vì master không yêu cầu. PHIEN-065 đã có Review Backend và PHIEN-066 đã có Review UI Customer Web. PHIEN-067..069 đã hoàn tất Complaint Domain/Customer/Admin; PHIEN-070 đã có Refund Backend qua Payment adapter. Complaint resolution vẫn chưa được bind tự động vì exact master không yêu cầu. PHIEN-071 đã có Customer Profile Backend + Customer Web; PHIEN-072 đã có Address Book CRUD/default; PHIEN-073 đã có Wishlist favorite product. Follow Farm để PHIEN-074.

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

PHIEN-073 đã chạy thành công:

```text
exact PHIEN-072 base SHA + exact 17-file previous scope
exact PHIEN-073 Wishlist = favorite product
PHIEN-074 Follow Farm boundary
SanPhamYeuThich schema + deterministic migration
unique customer + product
JWT customer ownership
public-product eligibility source-of-truth
GET list + GET status + PUT favorite + DELETE unfavorite
PUT/DELETE idempotent
Orval 4 Wishlist operations
Product Detail WishlistButton
Customer Web /yeu-thich
Wishlist e2e + Product Public/Customer Profile regression
API typecheck/build
api-client typecheck
Customer Web typecheck/build
no Follow Farm/new harvest notification/Loyalty/Admin/Mobile
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
