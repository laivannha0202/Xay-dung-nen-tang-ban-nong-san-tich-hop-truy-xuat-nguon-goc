# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 3 – Quản lý nguồn cung
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-021 – Nhật ký canh tác**

Đã thiết lập:

- enum sự kiện `TUOI/BON_PHAN/SAU_BENH/KIEM_TRA/THOI_TIET/KHAC`;
- model MySQL/Prisma `nhat_ky_canh_tac`;
- quan hệ bắt buộc Nhật ký canh tác → Mùa vụ;
- thời gian sự kiện;
- nội dung sự kiện;
- cờ `hienThiCongKhai` mặc định `false`;
- Backend list/detail/create/update;
- search + pagination;
- filter Mùa vụ/loại sự kiện/cờ công khai;
- 3 permission `nhat_ky_canh_tac.xem/tao/sua`;
- Nhân viên: xem/tạo/sửa;
- Admin: xem/tạo/sửa;
- Khách hàng: không có quyền quản trị;
- Audit cho tạo/sửa trong cùng transaction;
- Swagger/OpenAPI + Orval;
- Admin menu Nhật ký canh tác;
- ProTable + Create/Edit + Detail;
- Admin có thể bật/tắt `hienThiCongKhai`;
- chưa tạo public trace API; cờ công khai được dành cho các phiên truy xuất sau.

## Phiên tiếp theo

**PHIEN-022 – Thu hoạch**

Theo master plan:

```text
mùa vụ
ngày
số lượng
đơn vị
phân loại
ghi chú
```

Action dự kiến:

```text
Tạo lô từ thu hoạch
```

PHIEN-021 không triển khai Thu hoạch hoặc Lô.

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
- [ ] Thu hoạch
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

Không có lỗi source PHIEN-021.

`docs/TRANG_THAI_DU_AN.md` sau PHIEN-020 từng ghi nhầm PHIEN-021 là Thu hoạch.
Master plan `docs/KE_HOACH_CAC_PHIEN_AI.md` xác định đúng:

```text
PHIEN-021 – Nhật ký canh tác
PHIEN-022 – Thu hoạch
```

PHIEN-021 đã đồng bộ lại trạng thái dự án theo master plan.

`hienThiCongKhai` hiện chỉ là cờ dữ liệu. Chưa có public trace API ở phiên này;
các phiên truy xuất sau phải chỉ lấy những event được phép công khai.

PHIEN-022 tiếp theo là Thu hoạch.

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

PHIEN-021 đã chạy thành công:

```text
migration nhat_ky_canh_tac
enum 6 loại sự kiện canh tác
1 foreign key Mùa vụ
3 permission Nhật ký canh tác
6 role-permission mapping
regression mapping Nhà cung cấp = 7
regression mapping Trang trại = 7
regression mapping Chứng nhận = 7
regression mapping Mùa vụ = 6
KHACH_HANG protected GET -> 403
Mùa vụ không tồn tại -> 400
NHAN_VIEN tạo đủ 6 loại sự kiện
hienThiCongKhai mặc định false
filter public=true
search + season + event filter
NHAN_VIEN cập nhật nội dung + public flag
Audit tạo/sửa + snapshot public flag
Swagger/OpenAPI operationId
Orval generated client
Admin ProTable Nhật ký canh tác
Admin Create/Edit
Admin Detail
Admin public Switch
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
