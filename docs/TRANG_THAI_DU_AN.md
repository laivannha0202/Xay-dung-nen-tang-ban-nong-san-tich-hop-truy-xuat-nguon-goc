# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 3 – Quản lý nguồn cung
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-023 – Lô sản phẩm**

Đã thiết lập:

- enum trạng thái `MOI_TAO/CHO_KIEM_DINH/CO_THE_BAN/TAM_GIU/KHONG_DAT/THU_HOI/HET_HANG`;
- model MySQL/Prisma `lo_san_pham`;
- mapping tên nghiệp vụ:
  - `maLo` = `maLo`;
  - `thuHoachId` = `harvestId`;
  - `soLuong` = `quantity`;
  - `conLai` = `remaining`;
  - `phanHangChatLuong` = `qualityGrade`;
  - `ngayHetHan` = `expiryDate`;
  - `trangThai` = `status`;
- quan hệ bắt buộc Lô → Thu hoạch;
- mã Lô duy nhất;
- Lô chỉ được tạo từ Thu hoạch;
- một Thu hoạch có thể tách thành nhiều Lô;
- tổng số lượng các Lô không được vượt số lượng Thu hoạch;
- khóa dòng Thu hoạch `FOR UPDATE` khi phân bổ quantity để chống race condition;
- `remaining` khởi tạo bằng `quantity`;
- `qualityGrade` để `null` trước Kiểm định;
- ngày hết hạn không được trước ngày Thu hoạch;
- chỉ Lô `MOI_TAO` được sửa;
- sửa quantity ở `MOI_TAO` đồng bộ lại remaining;
- action `MOI_TAO → CHO_KIEM_DINH`;
- khóa dòng Lô khi sửa/gửi kiểm định để tránh race condition;
- chưa cho API PHIEN-023 tự đặt các state downstream;
- 3 permission `lo_san_pham.xem/tao/sua`;
- Nhân viên: xem/tạo/sửa;
- Admin: xem/tạo/sửa;
- Khách hàng: không có quyền quản trị;
- Audit tạo từ Thu hoạch/sửa/gửi kiểm định;
- Swagger/OpenAPI + Orval;
- Admin menu Lô sản phẩm;
- ProTable + Detail + Edit + Gửi kiểm định;
- action `Tạo lô` được nối thật vào màn hình Thu hoạch;
- không có form tạo Lô độc lập trên màn hình Lô.

## Phiên tiếp theo

**PHIEN-024 – Kiểm định chất lượng**

Theo master plan:

```text
lo
ngayKiemDinh
nguoiKiemDinh
ketQua
phanHang
ghiChu
anh
```

Rule:

```text
FAILED/HOLD/RECALLED không được bán
```

PHIEN-024 sẽ là nơi cập nhật kết quả/phân hạng và trạng thái chất lượng của Lô.

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

Không có lỗi source PHIEN-023.

`CO_THE_BAN`, `TAM_GIU`, `KHONG_DAT`, `THU_HOI`, `HET_HANG` đã được định nghĩa
trong enum để giữ state machine thống nhất, nhưng PHIEN-023 không cho client tự
đặt các trạng thái này.

PHIEN-023 chỉ chủ động:

```text
MOI_TAO
→ CHO_KIEM_DINH
```

PHIEN-024 Kiểm định chất lượng sẽ chịu trách nhiệm kết quả/phân hạng và các
transition chất lượng tương ứng. Các trạng thái kho/thu hồi tiếp tục do các
phiên chuyên trách sau quản lý.

`remaining` hiện bằng `quantity` vì chưa có luồng kho/tồn kho. Các phiên kho
sau mới được giảm `remaining`.

PHIEN-024 tiếp theo là Kiểm định chất lượng.

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

PHIEN-023 đã chạy thành công:

```text
migration lo_san_pham
enum 7 trạng thái Lô
1 foreign key Thu hoạch
unique maLo
3 permission Lô
6 role-permission mapping
regression mapping Nhà cung cấp = 7
regression mapping Trang trại = 7
regression mapping Chứng nhận = 7
regression mapping Mùa vụ = 6
regression mapping Nhật ký canh tác = 6
regression mapping Thu hoạch = 6
KHACH_HANG protected GET -> 403
không có POST tạo Lô trực tiếp
Thu hoạch không tồn tại -> 400
expiryDate trước ngày Thu hoạch -> 400
quantity vượt Thu hoạch -> 400
remaining = quantity khi tạo
qualityGrade = null trước kiểm định
duplicate maLo -> 409
một Thu hoạch chia nhiều Lô
tổng quantity Lô <= Thu hoạch
FOR UPDATE chống 2 request đồng thời vượt quantity
sửa Lô MOI_TAO
sửa quantity đồng bộ remaining
search + status filter
MOI_TAO -> CHO_KIEM_DINH
Lô CHO_KIEM_DINH không sửa được
Audit tạo/sửa/gửi kiểm định
Swagger/OpenAPI operationId
Orval generated client
Admin ProTable Lô
Admin Detail/Edit
Admin Gửi kiểm định
Admin Thu hoạch có action Tạo lô
không tạo Lô độc lập từ trang Lô
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
