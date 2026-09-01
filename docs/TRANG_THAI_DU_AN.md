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

**PHIEN-037 – Nhập/Xuất/Chuyển kho**

Backend:

- `POST /api/v1/ton-kho/nhap`:
  - upsert InventoryLot;
  - increment onHand;
  - append HARVEST_IN;
  - cùng DB transaction.
- `POST /api/v1/ton-kho/xuat`:
  - conditional decrement từ available;
  - giữ nguyên reserved/blocked;
  - append TRANSFER_OUT;
  - cùng DB transaction.
- `POST /api/v1/ton-kho/chuyen`:
  - source giảm available;
  - destination upsert/increment;
  - append TRANSFER_OUT + TRANSFER_IN;
  - tất cả cùng DB transaction.
- mutation dùng `ton_kho.dieu_chinh` đang ADMIN-only;
- không seed permission/schema/migration mới;
- ledger vẫn immutable;
- Admin `/ton-kho` dùng ProForm cho cả 3 action;
- concurrency gate chống available âm.

Boundary:

- chưa dùng ADJUSTMENT;
- chưa reason/actor/timestamp/before/after;
- chưa Audit Log cho stock adjustment;
- chưa FEFO / Cart / Order.

## Phiên tiếp theo

**PHIEN-038 – Điều chỉnh tồn kho**

PHIEN-038 bắt buộc:

```text
reason
actor
timestamp
before
after
Audit Log
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

Không có lỗi source PHIEN-037.

Giá Order phải snapshot khi đặt hàng; Order/OrderItem chưa đến phase nên chưa tạo sớm.

PHIEN-037 đã triển khai nhập/xuất/chuyển kho atomic: InventoryLot state và immutable ledger cùng transaction; xuất/chuyển dùng conditional available để chống oversell. PHIEN-038 mới làm điều chỉnh tồn với reason/actor/timestamp/before/after + Audit Log.

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

PHIEN-037 đã chạy thành công:

```text
fresh DB deploy toàn bộ 25 migration qua PHIEN-036
không tạo migration/schema mới
API typecheck
movement E2E: atomic nhập/xuất/chuyển
rollback state+ledger khi thiếu available
2 outbound concurrent không làm available âm
TonKho/Ledger/Public Product stale boundary PASS
Swagger/OpenAPI: 2 GET + 3 POST movement
Orval generated movement API
Admin /ton-kho: 3 ProForm + typecheck
full API E2E isolated: tối thiểu 28 suites PASS
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
