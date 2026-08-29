# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 3 – Quản lý nguồn cung
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-022 – Thu hoạch**

Đã thiết lập:

- model MySQL/Prisma `thu_hoach`;
- quan hệ bắt buộc Thu hoạch → Mùa vụ;
- ngày thu hoạch;
- số lượng dạng decimal, bắt buộc > 0;
- đơn vị;
- phân loại;
- ghi chú tùy chọn;
- cho phép nhiều đợt thu hoạch trên cùng một Mùa vụ;
- ngày thu hoạch không được trước ngày trồng;
- ngày thu hoạch thực tế không được ở tương lai;
- không ghi Thu hoạch cho Mùa vụ `HUY`;
- Backend list/detail/create/update;
- search + pagination;
- filter Mùa vụ/phân loại/đơn vị;
- 3 permission `thu_hoach.xem/tao/sua`;
- Nhân viên: xem/tạo/sửa;
- Admin: xem/tạo/sửa;
- Khách hàng: không có quyền quản trị;
- Audit cho tạo/sửa trong cùng transaction;
- Swagger/OpenAPI + Orval;
- Admin menu Thu hoạch;
- ProTable + Create/Edit + Detail.

Master plan có action `Tạo lô từ thu hoạch`, nhưng model/trạng thái Lô được
định nghĩa ở PHIEN-023. PHIEN-022 không tạo sớm model/bảng Lô; PHIEN-023 sẽ
tạo Lô sản phẩm và nối action tạo Lô từ bản ghi Thu hoạch.

## Phiên tiếp theo

**PHIEN-023 – Lô sản phẩm**

Theo master plan:

```text
maLo
harvestId
quantity
remaining
qualityGrade
expiryDate
status
```

Trạng thái:

```text
MOI_TAO
CHO_KIEM_DINH
CO_THE_BAN
TAM_GIU
KHONG_DAT
THU_HOI
HET_HANG
```

PHIEN-023 sẽ nối action tạo Lô từ Thu hoạch vào model Lô thật.

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
- [ ] Lô
- [ ] Kiểm định
- [ ] QR
- [ ] Truy xuất
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

Không có lỗi source PHIEN-022.

Master plan đặt action `Tạo lô từ thu hoạch` tại PHIEN-022 nhưng model Lô
chỉ được định nghĩa ở PHIEN-023. Để không làm vượt phạm vi và không tạo
model Lô nửa vời, PHIEN-022 hoàn thiện dữ liệu Thu hoạch; PHIEN-023 sẽ tạo
model/trạng thái Lô và nối action tạo Lô từ Thu hoạch trong cùng transaction.

Một Mùa vụ có thể có nhiều lần Thu hoạch.

PHIEN-023 tiếp theo là Lô sản phẩm.

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

PHIEN-022 đã chạy thành công:

```text
migration thu_hoach
1 foreign key Mùa vụ
3 permission Thu hoạch
6 role-permission mapping
regression mapping Nhà cung cấp = 7
regression mapping Trang trại = 7
regression mapping Chứng nhận = 7
regression mapping Mùa vụ = 6
regression mapping Nhật ký canh tác = 6
không tạo bảng/model Lô trước PHIEN-023
KHACH_HANG protected GET -> 403
Mùa vụ không tồn tại -> 400
số lượng <= 0 -> 400
ngày Thu hoạch trước ngày trồng -> 400
Mùa vụ HUY -> 400
NHAN_VIEN ghi nhiều đợt Thu hoạch cùng Mùa vụ
đơn vị được chuẩn hóa uppercase
search + season/classification/unit filter
NHAN_VIEN cập nhật số lượng/phân loại/ghi chú
Audit tạo/sửa
Swagger/OpenAPI operationId
Orval generated client
Admin ProTable Thu hoạch
Admin Create/Edit
Admin Detail
không có action Lô giả trước PHIEN-023
pnpm lint
pnpm typecheck
pnpm test
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
