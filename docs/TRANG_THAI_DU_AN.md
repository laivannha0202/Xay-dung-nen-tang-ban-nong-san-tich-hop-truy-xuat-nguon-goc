# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 4 – Lô, chất lượng, truy xuất
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-025 – QR Code**

Đã thiết lập:

- field `LoSanPham.maTruyXuat`;
- cột MySQL `lo_san_pham.ma_truy_xuat`;
- nullable trước khi generate;
- unique index `uk_lo_san_pham_ma_truy_xuat`;
- stable trace code dạng `AGM-` + 32 ký tự hex;
- mã truy xuất được tạo đúng một lần và không có API sửa/xóa;
- row lock Lô `FOR UPDATE` khi generate để chống race condition;
- `POST /api/v1/qr-code/lo/:loSanPhamId` idempotent:
  - chưa có mã thì tạo;
  - đã có mã thì trả lại đúng mã cũ;
- `GET /api/v1/qr-code/lo/:loSanPhamId` chỉ đọc QR đã tồn tại;
- QR payload chính xác bằng `maTruyXuat`;
- QR không nhúng toàn bộ dữ liệu Lô/chất lượng/tồn kho;
- render QR PNG data URL;
- render QR SVG;
- error correction level `M`;
- package Backend `qrcode@1.5.4`;
- typings `@types/qrcode@1.5.6`;
- không lưu ảnh QR vào MinIO;
- 2 permission `qr_code.xem/tao`;
- Nhân viên: xem/tạo;
- Admin: xem/tạo;
- Khách hàng: không có quyền quản trị;
- Audit `QR_CODE_LO_TAO` chỉ ghi lần tạo mã đầu tiên;
- Swagger/OpenAPI + Orval;
- Admin action QR ngay tại Lô sản phẩm;
- preview QR;
- tải PNG;
- tải SVG;
- in QR;
- không tạo menu QR riêng;
- không triển khai Trace Events;
- không triển khai API truy xuất công khai.

## Phiên tiếp theo

**PHIEN-026 – Trace Events**

Theo master plan:

```text
CANH_TAC
THU_HOACH
KIEM_DINH
DONG_GOI
NHAP_KHO
XUAT_KHO
GIAO_HANG
```

Fields:

```text
batchId
type
time
location
metadata
public
```

PHIEN-026 sẽ xây ledger sự kiện truy xuất cho Lô; PHIEN-027 mới mở API truy xuất công khai.

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

Không có lỗi source PHIEN-025.

QR hiện chỉ nhúng:

```text
maTruyXuat
```

Không nhúng JSON của Lô, thông tin giá, tồn kho, kiểm định hoặc dữ liệu riêng tư.

Stable trace code đã được lưu trên Lô để PHIEN-026 Trace Events và PHIEN-027 API truy xuất
cùng sử dụng một identifier bất biến.

QR hiện là chức năng quản trị được bảo vệ bằng JWT/RBAC. Chưa có endpoint truy xuất public.

PHIEN-026 tiếp theo là Trace Events.

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

PHIEN-025 đã chạy thành công:

```text
migration ma_truy_xuat
ma_truy_xuat nullable
unique stable trace code
2 permission QR
4 role-permission mapping
regression mapping Nhà cung cấp = 7
regression mapping Trang trại = 7
regression mapping Chứng nhận = 7
regression mapping Mùa vụ = 6
regression mapping Nhật ký canh tác = 6
regression mapping Thu hoạch = 6
regression mapping Lô = 6
regression mapping Kiểm định = 4
KHACH_HANG protected GET -> 403
GET trước generate -> 404
generate stable trace code
trace code regex AGM + 32 hex
QR payload = trace identifier
payload không chứa maLo
PNG data URL hợp lệ
PNG signature hợp lệ
SVG hợp lệ
generate lại trả đúng mã cũ
generate lại không tạo audit mới
hai Lô có trace code khác nhau
FOR UPDATE chống race condition generate
hai request đồng thời nhận cùng trace code
QR E2E beforeAll timeout 90 giây
QR E2E afterAll cleanup timeout 180 giây
cleanup log rõ MySQL và app.close
không có PATCH/DELETE QR
Audit QR_CODE_LO_TAO
Swagger/OpenAPI operationId
Orval generated client
Admin preview QR
Admin tải PNG
Admin tải SVG
Admin in QR
Admin escape HTML trước print
không có menu QR riêng
không có public trace API
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
