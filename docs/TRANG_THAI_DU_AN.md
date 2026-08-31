# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 4 – Lô, chất lượng, truy xuất
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events + API truy xuất công khai Backend đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-027 – API truy xuất công khai**

Đã thiết lập:

- endpoint public `GET /api/v1/truy-xuat/:ma`;
- không cần JWT/RBAC;
- vẫn chịu global Throttler của AppModule;
- lookup bằng stable `LoSanPham.maTruyXuat`;
- input được chuẩn hóa uppercase;
- mã sai format/không tồn tại trả 404;
- response dùng explicit whitelist;
- public Lô:
  - `maLo`;
  - `maTruyXuat`;
  - `phanHangChatLuong`;
  - `ngayHetHan`;
  - `trangThai`;
- public Trang trại:
  - `ten`;
  - `diaChi`;
- public Mùa vụ:
  - `cayTrong`;
  - `giong`;
  - `ngayTrong`;
- public Thu hoạch:
  - `ngayThuHoach`;
  - `phanLoai`;
- chỉ chứng nhận `DA_XAC_MINH`;
- chứng nhận không trả `tepTinId`, object key hoặc document private;
- kiểm định chỉ trả ngày/kết quả/phân hạng;
- kiểm định không trả người kiểm định, ghi chú hoặc ảnh;
- Nhật ký canh tác chỉ trả bản ghi `hienThiCongKhai=true`;
- Trace Event chỉ trả event `congKhai=true`;
- public Trace Event chỉ trả `loai/thoiGian/diaDiem`;
- không trả Trace Event `metadata` vì đây là JSON tự do có thể chứa dữ liệu nhạy cảm;
- không trả `soLuong`, `conLai`, `sanLuongDuKienKg`;
- không trả supplier contact/GPS/internal IDs;
- không lộ cost, nhân viên nội bộ, ghi chú riêng, private document;
- Swagger/OpenAPI operation `layTruyXuatCongKhai`;
- OpenAPI public operation không có bearer security;
- Orval generated client;
- không migration;
- không permission mới;
- không dependency mới;
- chưa làm Customer Trace Web/Mobile.

## Phiên tiếp theo

**PHIEN-028 – Thu hồi lô**

Theo master plan:

```text
Recall batch
→ stop sale
→ stop allocation
→ tìm order affected
→ notification
```

PHIEN-027 chỉ hoàn thành public backend API.
Customer Trace Web thuộc PHIEN-046.

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

Không có lỗi source PHIEN-027.

Public API hiện chỉ trả whitelist an toàn.

Cố ý không trả `metadata` của `SuKienTruyXuat` dù event có `congKhai=true`,
vì metadata là JSON tự do và chưa có schema phân loại field public/private.

Không trả quantity/remaining/sản lượng dự kiến, dữ liệu nhân viên,
ghi chú nội bộ hoặc file chứng nhận private.

PHIEN-028 tiếp theo là Thu hồi lô.
Trace Web cho khách hàng thuộc PHIEN-046.

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

PHIEN-027 đã chạy thành công:

```text
fresh DB migration deploy PHIEN-001..026
Prisma validate/generate
GET /api/v1/truy-xuat/:ma không Authorization -> 200
lowercase trace code normalize -> 200
malformed code -> 404
unknown stable code -> 404
maLo không được dùng thay trace code -> 404
exact public response whitelist
public Lô không quantity/remaining
public Trang trại không GPS/supplier
chỉ chứng nhận DA_XAC_MINH
không certificate file/objectKey/tepTinId
kiểm định không người kiểm định/ghi chú/ảnh
chỉ Nhật ký canh tác hienThiCongKhai=true
chỉ Trace Event congKhai=true
Trace Event public không metadata
seed cost/internal employee/private notes/private docs và xác nhận không leak
OpenAPI public operation không bearer security
OpenAPI exact public DTO properties
Orval layTruyXuatCongKhai
pnpm lint
pnpm typecheck
pnpm test
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
