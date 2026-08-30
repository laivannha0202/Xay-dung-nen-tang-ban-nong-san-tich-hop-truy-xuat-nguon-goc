# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 4 – Lô, chất lượng, truy xuất
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-024 – Kiểm định chất lượng**

Đã thiết lập:

- enum kết quả `PASSED/FAILED/HOLD/RECALLED`;
- model MySQL/Prisma `kiem_dinh_chat_luong`;
- model ảnh `kiem_dinh_chat_luong_anh`;
- quan hệ Kiểm định → Lô;
- quan hệ Kiểm định → Người kiểm định;
- quan hệ Ảnh kiểm định → Tệp tin private;
- ngày kiểm định;
- người kiểm định lấy từ access token;
- kết quả;
- phân hạng;
- ghi chú;
- tối đa 10 ảnh JPEG/PNG/WebP;
- signed URL ảnh qua module Tệp tin hiện có;
- lịch sử kiểm định append-only, không sửa/xóa;
- `PASSED` bắt buộc có phân hạng;
- mapping kết quả → trạng thái Lô:
  - `PASSED → CO_THE_BAN`;
  - `FAILED → KHONG_DAT`;
  - `HOLD → TAM_GIU`;
  - `RECALLED → THU_HOI`;
- rule master plan `FAILED/HOLD/RECALLED` không được bán được enforce bằng trạng thái Lô;
- Lô `CHO_KIEM_DINH/TAM_GIU` có thể kiểm định;
- `RECALLED` còn áp dụng được cho Lô `CO_THE_BAN`;
- `KHONG_DAT/THU_HOI/HET_HANG` không được kiểm định lại ở PHIEN-024;
- row lock Lô `FOR UPDATE` trước khi tạo kết quả và đổi trạng thái;
- `PASSED` sau ngày hết hạn bị từ chối;
- 2 permission `kiem_dinh_chat_luong.xem/tao`;
- Nhân viên: xem/tạo;
- Admin: xem/tạo;
- Khách hàng: không có quyền quản trị;
- Audit `KIEM_DINH_CHAT_LUONG_TAO`;
- Audit `LO_SAN_PHAM_CAP_NHAT_CHAT_LUONG`;
- Swagger/OpenAPI + Orval;
- Admin menu Kiểm định chất lượng;
- ProTable + Create + Detail;
- upload/preview ảnh kiểm định;
- không cài dependency mới.

## Phiên tiếp theo

**PHIEN-025 – QR Code**

Theo master plan:

```text
generate QR
stable trace code
download/print QR
```

Rule:

```text
Không nhúng toàn bộ dữ liệu vào QR.
```

PHIEN-024 không triển khai QR/public trace.

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

Không có lỗi source PHIEN-024.

State machine chất lượng hiện tại:

```text
CHO_KIEM_DINH/TAM_GIU
  PASSED -> CO_THE_BAN
  FAILED -> KHONG_DAT
  HOLD   -> TAM_GIU

CHO_KIEM_DINH/TAM_GIU/CO_THE_BAN
  RECALLED -> THU_HOI
```

`FAILED/HOLD/RECALLED` không được bán vì không tạo trạng thái `CO_THE_BAN`.

Kết quả kiểm định là append-only. Kiểm định lại Lô `TAM_GIU` tạo bản ghi lịch sử mới,
không sửa kết quả cũ.

`remaining` vẫn chưa thay đổi trong PHIEN-024. Luồng Kho/Tồn kho sau này mới được
giảm `remaining`.

PHIEN-025 tiếp theo là QR Code.

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

PHIEN-024 đã chạy thành công:

```text
migration kiem_dinh_chat_luong
migration kiem_dinh_chat_luong_anh
enum PASSED/FAILED/HOLD/RECALLED
4 foreign key
2 permission Kiểm định
4 role-permission mapping
regression mapping Nhà cung cấp = 7
regression mapping Trang trại = 7
regression mapping Chứng nhận = 7
regression mapping Mùa vụ = 6
regression mapping Nhật ký canh tác = 6
regression mapping Thu hoạch = 6
regression mapping Lô = 6
KHACH_HANG protected GET -> 403
không có PATCH/DELETE lịch sử Kiểm định
PASSED thiếu phân hạng -> 400
Lô MOI_TAO -> 400
PDF không được gắn làm ảnh Kiểm định
ảnh Kiểm định dùng MinIO/Tệp tin private
PASSED -> CO_THE_BAN + quality grade
FAILED -> KHONG_DAT
HOLD -> TAM_GIU
TAM_GIU kiểm định lại PASSED -> CO_THE_BAN
RECALLED từ CO_THE_BAN -> THU_HOI
FAILED/HOLD/RECALLED không ở CO_THE_BAN
FOR UPDATE chống 2 kết quả đồng thời chốt cùng Lô
người kiểm định lấy từ access token
search + result filter
Audit Kiểm định + transition Lô
signed image URL
Swagger/OpenAPI operationId
Orval generated client
Admin ProTable Kiểm định
Admin Create
Admin Detail
Admin upload/preview ảnh
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
