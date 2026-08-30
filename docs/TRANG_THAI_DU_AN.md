# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 4 – Lô, chất lượng, truy xuất
Tiến độ code thực tế: Foundation + Nhà cung cấp + Trang trại + Chứng nhận + Mùa vụ + Nhật ký canh tác + Thu hoạch + Lô sản phẩm + Kiểm định chất lượng + QR Code + Trace Events Backend/Admin đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-026 – Trace Events**

Đã thiết lập:

- enum `LoaiSuKienTruyXuat`;
- đủ 7 loại event master plan:
  - `CANH_TAC`;
  - `THU_HOACH`;
  - `KIEM_DINH`;
  - `DONG_GOI`;
  - `NHAP_KHO`;
  - `XUAT_KHO`;
  - `GIAO_HANG`;
- model `SuKienTruyXuat`;
- relation `SuKienTruyXuat -> LoSanPham`;
- fields:
  - `loSanPhamId`;
  - `loai`;
  - `thoiGian`;
  - `diaDiem`;
  - `metadata`;
  - `congKhai`;
- `congKhai` mặc định `false`;
- ledger append-only, không PATCH/DELETE;
- regression QR PHIEN-025: thay interactive transaction/FOR UPDATE bằng atomic compare-and-set;
- QR concurrency vẫn đảm bảo hai request nhận cùng mã và chỉ một Audit;
- QR E2E chủ động đóng HTTP idle/all connections trước `app.close()`;
- list/detail/create;
- list mặc định theo timeline tăng dần;
- filter theo Lô/loại/công khai;
- search theo mã Lô/địa điểm/cây trồng/trang trại;
- không cho thời gian ở tương lai;
- `CANH_TAC` phải nằm từ ngày trồng đến hết ngày Thu hoạch;
- `THU_HOACH` phải đúng ngày Thu hoạch nguồn của Lô;
- event sau Thu hoạch không được trước ngày Thu hoạch;
- địa điểm bắt buộc và tối đa 255 ký tự;
- metadata phải là JSON object tối đa 8 KiB;
- 2 permission `su_kien_truy_xuat.xem/tao`;
- Nhân viên: xem/tạo;
- Admin: xem/tạo;
- Khách hàng: không có quyền quản trị;
- Audit `SU_KIEN_TRUY_XUAT_TAO`;
- Swagger/OpenAPI + Orval;
- reusable OpenAPI enum `LoaiSuKienTruyXuat` đủ 7 giá trị;
- Admin route `/su-kien-truy-xuat`;
- ProTable + Create + Detail;
- metadata JSON editor/validator;
- công khai dùng Switch;
- thay placeholder `/lo-truy-xuat` bằng route Sự kiện truy xuất thật;
- không thêm dependency;
- chưa mở API truy xuất công khai.

## Phiên tiếp theo

**PHIEN-027 – API truy xuất công khai**

Theo master plan:

```text
GET /api/v1/truy-xuat/:ma
```

Response chỉ chứa public data và không được lộ:

```text
cost
nhân viên nội bộ
ghi chú riêng
private document
```

PHIEN-026 chưa tạo endpoint public và chưa sửa Customer Web/Mobile.

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
- [ ] Truy xuất (Trace Events đã xong; API truy xuất công khai PHIEN-027 chưa làm)
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

Không có lỗi source PHIEN-026.

Ledger hiện là append-only:

```text
LoSanPham
  -> SuKienTruyXuat[]
```

Sự kiện có thể được đánh dấu `congKhai=true`, nhưng chưa có endpoint public ở PHIEN-026.

Các event `DONG_GOI/NHAP_KHO/XUAT_KHO/GIAO_HANG` hiện có contract ledger sẵn sàng;
các module nghiệp vụ đóng gói/kho/giao hàng ở các phiên sau sẽ ghi event khi luồng thật được triển khai.

PHIEN-027 tiếp theo là API truy xuất công khai.

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

PHIEN-026 đã chạy thành công:

```text
migration su_kien_truy_xuat
enum 7 loại Trace Events
model SuKienTruyXuat
FK SuKienTruyXuat -> LoSanPham
3 index ledger
2 permission Trace Events
4 role-permission mapping
regression mapping Nhà cung cấp = 7
regression mapping Trang trại = 7
regression mapping Chứng nhận = 7
regression mapping Mùa vụ = 6
regression mapping Nhật ký canh tác = 6
regression mapping Thu hoạch = 6
regression mapping Lô = 6
regression mapping Kiểm định = 4
regression mapping QR = 4
KHACH_HANG protected GET -> 403
future event -> 400
CANH_TAC trước ngày trồng -> 400
THU_HOACH sai ngày nguồn -> 400
KIEM_DINH trước Thu hoạch -> 400
metadata > 8 KiB -> 400
tạo đủ CANH_TAC/THU_HOACH/KIEM_DINH/DONG_GOI/NHAP_KHO/XUAT_KHO/GIAO_HANG
congKhai mặc định false
list timeline tăng dần
filter Lô + loại + public
search địa điểm
detail metadata
append-only không PATCH/DELETE
Audit SU_KIEN_TRUY_XUAT_TAO
QR regression atomic compare-and-set
QR concurrency 2 request -> cùng mã + 1 audit
QR E2E đóng HTTP idle/all connections trước app.close
không có public trace API
Swagger/OpenAPI operationId
Orval generated client
Admin ProTable Trace Events
Admin Create
Admin Detail
Admin metadata JSON validation
Admin public Switch
placeholder /lo-truy-xuat được thay bằng /su-kien-truy-xuat
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
