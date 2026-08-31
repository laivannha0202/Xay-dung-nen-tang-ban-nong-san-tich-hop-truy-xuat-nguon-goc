# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

31/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 4 – Lô, chất lượng, truy xuất
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai + Thu hồi Lô Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-028 – Thu hồi lô**

Đã thiết lập:

- model ledger `ThuHoiLoSanPham` 1:1 với Lô;
- lưu riêng:
  - lý do nội bộ;
  - thông báo an toàn cho khách hàng;
  - thời điểm thu hồi;
  - tác nhân thu hồi;
- permission `lo_san_pham.thu_hoi`;
- chỉ `ADMIN` được map quyền thu hồi;
- endpoint `POST /api/v1/lo-san-pham/:id/thu-hoi`;
- thu hồi atomic:
  - khóa Lô `FOR UPDATE`;
  - tạo recall ledger;
  - chuyển Lô sang `THU_HOI`;
  - ghi Audit trong cùng transaction;
- `THU_HOI` là trạng thái terminal:
  - chặn bán vì không còn `CO_THE_BAN`;
  - các API sửa/gửi kiểm định hiện hữu không thể đưa Lô quay lại;
  - không có API PATCH/DELETE/undo recall;
- concurrency: hai request thu hồi cùng Lô chỉ một request thắng;
- Audit `LO_SAN_PHAM_THU_HOI` ghi `nganBan=true`, `nganPhanBo=true`;
- kết quả kiểm định `RECALLED` được đồng bộ vào cùng recall ledger;
- `RECALLED` bắt buộc quyền `lo_san_pham.thu_hoi` và có lý do;
- public trace trả `thuHoi` warning chỉ gồm:
  - `thuHoiLuc`;
  - `thongBaoKhachHang`;
- public trace không lộ lý do nội bộ hoặc actor thu hồi;
- Lô legacy đã `THU_HOI` nhưng chưa có ledger vẫn nhận cảnh báo public an toàn;
- Admin Lô có nút Thu hồi danger, modal cảnh báo rõ và detail recall;
- Swagger/OpenAPI + Orval cho `thuHoiLoSanPham`;
- migration seed đúng 1 permission + 1 mapping ADMIN;
- không thêm dependency;
- full E2E chạy isolated theo suite + Redis/BullMQ namespace riêng.

Giới hạn phụ thuộc theo master plan:

- Inventory Reservation chỉ xuất hiện ở PHIEN-050, nên PHIEN-028 chưa có allocation record để release thực tế;
- Order schema/Create Order chỉ xuất hiện ở PHIEN-051/052, nên hiện chưa có order affected để truy vấn hoặc khách hàng theo order để fan-out notification;
- trạng thái `THU_HOI` + Audit đã khóa contract `stop allocation` cho các module tương lai;
- cảnh báo khách hàng hiện có ngay qua public trace API;
- Customer Trace Web hiển thị recall alert thuộc PHIEN-046, không tạo UI Customer sớm ở PHIEN-028.

## Phiên tiếp theo

**PHIEN-029 – Danh mục sản phẩm**

Theo master plan:

```text
category
parent category nếu cần
slug
status
image
```

PHIEN-028 đã hoàn thành recall core trên Lô.

Các integration phụ thuộc được giữ đúng thứ tự:
- Trace Web recall alert: PHIEN-046;
- Inventory Reservation/stop-allocation thực tế: PHIEN-050;
- Order affected + customer notification theo order: sau PHIEN-051/052.

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
- [ ] Sản phẩm
- [ ] Kho
- [ ] Tồn kho
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

Không có lỗi source PHIEN-028.

Các phần chưa thể nối thật vì module nguồn chưa tồn tại theo chính master plan:

- PHIEN-050 mới tạo Inventory Reservation: chưa có allocation để release trong PHIEN-028;
- PHIEN-051/052 mới tạo Order/Order Allocation: chưa có order affected để truy vấn;
- notification tới đúng khách hàng bị ảnh hưởng cần quan hệ Order → Customer nên được nối sau khi Order tồn tại;
- PHIEN-046 mới tạo Customer Trace Web: PHIEN-028 chỉ cung cấp public recall warning contract.

Không tạo bảng/record giả cho Inventory hoặc Order để tránh phá thứ tự kiến trúc.

`THU_HOI` là terminal source-of-truth từ bây giờ; các module Inventory/Order về sau bắt buộc loại Lô này khỏi sale/allocation.

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

PHIEN-028 đã chạy thành công:

```text
fresh DB migration deploy PHIEN-001..027
Prisma format/validate/generate
migration ThuHoiLoSanPham
DB gate table/columns/FK/index
permission lo_san_pham.thu_hoi chỉ ADMIN
KHACH_HANG recall -> 403
NHAN_VIEN recall -> 403
ADMIN direct recall -> ledger + THU_HOI + Audit
lý do/thông báo khách hàng bắt buộc
hai recall đồng thời -> một thành công + một conflict
THU_HOI terminal, không undo
Quality RECALLED: NHAN_VIEN -> 403
Quality RECALLED: ADMIN -> THU_HOI + recall ledger
public trace recall warning
public trace không lộ lý do nội bộ/actor
legacy THU_HOI có generic public warning
OpenAPI recall protected
OpenAPI public trace vẫn không bearer
Orval thuHoiLoSanPham
Admin recall danger modal/detail
full API E2E isolated tối thiểu 19 suite
Redis/BullMQ namespace riêng từng suite
pnpm lint
pnpm typecheck
workspace tests
pnpm build
pnpm format:check
source SHA-256 trước/sau cập nhật docs
prettier --check 3 file docs
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
