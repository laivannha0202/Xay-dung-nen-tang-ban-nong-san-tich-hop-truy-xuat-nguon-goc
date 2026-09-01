# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: GIAI ĐOẠN 6 – KHO VÀ TỒN KHO
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô + Danh mục sản phẩm + Sản phẩm + Biến thể/giá + Ảnh sản phẩm + API public sản phẩm đã sẵn sàng + Kho đã sẵn sàng + InventoryLot/Tồn kho theo lô đã sẵn sàng + Inventory Transaction Ledger đã sẵn sàng + Nhập/Xuất/Chuyển kho atomic đã sẵn sàng + Điều chỉnh tồn kho có Audit đã sẵn sàng + FEFO đã sẵn sàng + Cảnh báo hàng sắp hết hạn đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-040 – Cảnh báo hàng sắp hết hạn**

Job:

```text
queue = system-job
job = canh-bao-het-han-ton-kho
scheduler = ton-kho-het-han-hang-ngay
cron = 01:10 mỗi ngày
```

Rule:

```text
InventoryLot.onHand > 0

SAP_HET_HAN:
ngayHetHan >= hôm nay
ngayHetHan <= hôm nay + 7 ngày

HET_HAN:
ngayHetHan < hôm nay
```

Hạn dùng đúng hôm nay vẫn thuộc `SAP_HET_HAN`.

API:

```text
GET /api/v1/ton-kho/canh-bao-het-han
permission = kho.xem
query = soNgay, gioiHan
```

Admin dashboard:

- metric Lô sắp hết hạn;
- metric Lô đã hết hạn;
- warning/error alert;
- danh sách Mã lô / Sản phẩm / Farm / Kho / On hand / HSD / số ngày còn lại.

Boundary:

- job/service chỉ đọc;
- không tự đổi trạng thái lô;
- không ghi `EXPIRE` ledger;
- không notification/email;
- chưa low-stock alert;
- chưa promo/hủy hàng;
- không Cart/Order.

## Phiên tiếp theo

**PHIEN-041 – Customer Web layout + Design System**

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

Không có lỗi source PHIEN-040.

Giá Order phải snapshot khi đặt hàng; Order/OrderItem chưa đến phase nên chưa tạo sớm.

PHIEN-040 đã triển khai daily BullMQ job phát hiện lô sắp hết hạn/đã hết hạn, read-only API dùng kho.xem và Admin dashboard alert. Mốc near-expiry là 7 ngày; không tự mutate lô hay ghi EXPIRE ledger. PHIEN-041 chuyển sang Customer Web.

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

PHIEN-040 đã chạy thành công:

```text
fresh DB deploy toàn bộ migration
không tạo migration/schema mới
API typecheck
near-expiry inclusive hôm nay và +7 ngày
expired < hôm nay
onHand=0 bị loại
TAM_GIU còn hàng vật lý vẫn được cảnh báo
API RBAC kho.xem: anonymous 401, KHACH 403, NHAN_VIEN/ADMIN 200
HeThongWorker xử lý CANH_BAO_HET_HAN_TON_KHO
daily scheduler 01:10
service/job read-only
không ghi EXPIRE ledger
FEFO boundary PASS
Swagger/OpenAPI có layCanhBaoHetHanTonKho
Orval generated alert API
Admin dashboard alert typecheck PASS
full API E2E isolated fresh DB mỗi suite: tối thiểu 30 suites PASS
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
