# KẾ HOẠCH CÁC PHIÊN AI HOÀN THIỆN TOÀN BỘ DỰ ÁN AGRIMARKET

> **Mục tiêu của tài liệu này:**  
> Biến toàn bộ quá trình phát triển AgriMarket thành các phiên làm việc tuần tự, có đầu vào, đầu ra, tiêu chí hoàn thành và cơ chế bàn giao rõ ràng để có thể tiếp tục ở bất kỳ ChatGPT/tab/model mới nào mà không mất tính đồng nhất.
>
> **Tên đề tài:** Xây dựng nền tảng bán nông sản đa nền tảng tích hợp truy xuất nguồn gốc.
>
> **Actor chính:** Khách hàng – Nhân viên – Admin.
>
> **Ứng dụng:** Android khách hàng + Web khách hàng + Web quản trị + Backend dùng chung.
>
> **Stack chốt:**
>
> - Mobile: Expo + React Native + TypeScript + Expo Router + gluestack-ui v5 + UniWind
> - Customer Web: Next.js + TypeScript + Mantine + Mantine UI
> - Admin Web: Next.js + TypeScript + Ant Design + ProComponents
> - Backend: Node.js + NestJS + TypeScript
> - Database: MySQL 8.4 LTS
> - ORM: Prisma
> - API: REST + Swagger/OpenAPI
> - FE API client: Orval + TanStack Query
> - State: Zustand
> - Cache/Queue: Redis + BullMQ
> - File: MinIO/S3
> - Auth: JWT + Refresh Token + RBAC
> - Test: Jest + Supertest + Vitest + RTL + Playwright
> - DevOps: Docker + Docker Compose + GitHub Actions
>
> **Quy ước code:** nghiệp vụ bằng tiếng Việt không dấu; UI/comment/docs bằng tiếng Việt có dấu; tên công nghệ/framework giữ nguyên tiếng Anh.

---

# PHẦN I. CƠ CHẾ ĐỒNG BỘ GIỮA CÁC PHIÊN AI

## 1. Không để AI mới tự suy đoán dự án

Mỗi phiên mới phải đọc tối thiểu các file sau trước khi sửa code:

```text
docs/BOI_CANH_DU_AN_CHO_GPT.md
docs/TRANG_THAI_DU_AN.md
docs/QUYET_DINH_KIEN_TRUC.md
docs/KE_HOACH_CAC_PHIEN_AI.md
Quy_uoc_code_tieng_Viet_AgriMarket.md
Phan_tich_cong_nghe_AgriMarket_UI_hien_dai.md
Dac_ta_yeu_cau_va_UML_AgriMarket_3_Actor.md
```

Nếu một file chưa tồn tại thì phiên đầu tiên phải tạo.

---

# 2. Bốn file “nguồn sự thật” bắt buộc

## 2.1. `docs/BOI_CANH_DU_AN_CHO_GPT.md`

Chứa:

```text
Cây thư mục hiện tại
Package/version
Module đang tồn tại
Quy tắc code
Hướng dẫn cho AI
```

File này được script tự động tạo/cập nhật.

---

## 2.2. `docs/TRANG_THAI_DU_AN.md`

Đây là file quan trọng nhất để AI mới biết dự án đang ở đâu.

Mẫu:

```markdown
# TRẠNG THÁI DỰ ÁN

## Phiên hiện tại
PHIEN-012

## Phiên vừa hoàn thành
PHIEN-011

## Module hoàn thành
- Auth
- RBAC
- Khách hàng

## Module đang làm
- Nhà cung cấp

## Chưa làm
- Trang trại
- Lô
- Kho
...

## Lệnh chạy
...

## Test hiện tại
...

## Lỗi tồn đọng
...

## Quyết định mới nhất
...

## Phiên tiếp theo
PHIEN-012
```

Sau **mọi phiên**, AI phải cập nhật file này.

---

## 2.3. `docs/QUYET_DINH_KIEN_TRUC.md`

Ghi những quyết định không được tự ý đổi.

Ví dụ:

```text
ADR-001: Dùng Modular Monolith, không Microservices
ADR-002: Database là MySQL
ADR-003: ORM là Prisma
ADR-004: Customer Web dùng Mantine
ADR-005: Admin dùng Ant Design Pro
ADR-006: Mobile dùng gluestack-ui
ADR-007: REST + Swagger, không GraphQL
ADR-008: API client sinh bằng Orval
ADR-009: Backend là nguồn sự thật của giá/tồn/FEFO
ADR-010: Chỉ có 3 Actor nghiệp vụ
```

AI mới không được tự thay đổi trừ khi người dùng yêu cầu.

---

## 2.4. `docs/KE_HOACH_CAC_PHIEN_AI.md`

Chính là file master này.

Sau mỗi phiên:

```text
[ ] chưa làm
[~] đang làm
[x] hoàn thành
[!] có vấn đề
```

---

# 3. Quy tắc bắt buộc trước khi bắt đầu mỗi phiên

AI phải:

1. Đọc `BOI_CANH_DU_AN_CHO_GPT.md`.
2. Đọc `TRANG_THAI_DU_AN.md`.
3. Đọc phiên cần làm trong file này.
4. Kiểm tra code hiện tại thay vì giả định.
5. Kiểm tra package hiện tại trước khi cài thêm.
6. Không đổi stack.
7. Không đổi convention.
8. Không viết lại module đã hoàn thành nếu không cần.
9. Không thêm dependency nếu thư viện đang có đã giải quyết được.
10. Không làm ngoài phạm vi phiên hiện tại.

---

# 4. Quy tắc bắt buộc sau mỗi phiên

AI phải:

```text
1. Chạy lint
2. Chạy typecheck
3. Chạy test liên quan
4. Chạy build nếu phù hợp
5. Kiểm tra git diff
6. Cập nhật docs/TRANG_THAI_DU_AN.md
7. Cập nhật docs/BOI_CANH_DU_AN_CHO_GPT.md
8. Đánh dấu phiên hoàn thành
9. Ghi lỗi/tồn đọng
10. Ghi phiên tiếp theo
```

Không được nói “hoàn thành” nếu code không chạy qua bước kiểm tra tối thiểu.

---

# 5. Prompt chuẩn khi mở ChatGPT/tab mới

Dùng prompt này:

```text
Bạn đang tiếp tục dự án AgriMarket tại repository:

<LINK_GITHUB>

Trước khi làm bất kỳ thay đổi nào:
1. Đọc docs/BOI_CANH_DU_AN_CHO_GPT.md
2. Đọc docs/TRANG_THAI_DU_AN.md
3. Đọc docs/QUYET_DINH_KIEN_TRUC.md
4. Đọc docs/KE_HOACH_CAC_PHIEN_AI.md
5. Đọc Quy_uoc_code_tieng_Viet_AgriMarket.md

Không tự đổi stack, naming convention hoặc kiến trúc đã chốt.

Hãy xác định phiên tiếp theo chưa hoàn thành và chỉ thực hiện đúng phiên đó.

Sau khi làm:
- chạy lint/typecheck/test/build phù hợp;
- cập nhật TRANG_THAI_DU_AN.md;
- cập nhật BOI_CANH_DU_AN_CHO_GPT.md;
- ghi rõ file đã tạo/sửa;
- ghi lỗi còn tồn tại;
- đề xuất chính xác phiên tiếp theo.

Code nghiệp vụ dùng tiếng Việt không dấu.
UI/comment/docs dùng tiếng Việt có dấu.
Ưu tiên code ngắn gọn, rõ ràng, không abstraction thừa.
```

---

# 6. Prompt khẩn cấp khi AI có dấu hiệu làm lệch dự án

```text
Dừng thay đổi hiện tại.

Hãy đọc lại:
- docs/QUYET_DINH_KIEN_TRUC.md
- docs/TRANG_THAI_DU_AN.md
- Quy_uoc_code_tieng_Viet_AgriMarket.md

So sánh code bạn định làm với các quyết định đã chốt.
Không đổi stack hoặc convention.
Chỉ tiếp tục khi cách làm phù hợp với tài liệu nguồn sự thật.
```

---

# PHẦN II. TOÀN BỘ LỘ TRÌNH PHIÊN

---

# GIAI ĐOẠN 0 – CHUẨN HÓA REPOSITORY

---

## PHIEN-001 – Chuẩn hóa tài liệu nguồn sự thật

### Mục tiêu

Tạo nền tảng để mọi AI/tab mới đồng bộ.

### Phải tạo

```text
docs/TRANG_THAI_DU_AN.md
docs/QUYET_DINH_KIEN_TRUC.md
docs/KE_HOACH_CAC_PHIEN_AI.md
docs/QUY_TAC_CHO_AI.md
```

### Nội dung

`TRANG_THAI_DU_AN.md`:

```text
Phiên hiện tại
Stack
Module hoàn thành
Module chưa làm
Lệnh chạy
Lỗi
Phiên tiếp theo
```

`QUYET_DINH_KIEN_TRUC.md`:

ghi ADR.

### Tiêu chí hoàn thành

```text
[x] AI mới có thể hiểu dự án bằng docs
[x] Không cần đọc toàn lịch sử chat
[x] Có phiên tiếp theo rõ ràng
```

---

## PHIEN-002 – Chuẩn hóa cấu trúc Monorepo

### Mục tiêu

Tạo:

```text
apps/
packages/
infra/
docs/
```

### Cấu trúc đích

```text
agrimarket/
├── apps/
│   ├── api/
│   ├── customer-web/
│   ├── admin-web/
│   └── mobile/
├── packages/
│   ├── api-client/
│   ├── shared-constants/
│   ├── eslint-config/
│   └── tsconfig/
├── docs/
├── infra/
├── package.json
├── pnpm-workspace.yaml
└── docker-compose.yml
```

### Không làm

Chưa code nghiệp vụ.

### Tiêu chí

```text
pnpm install chạy được
workspace nhận đủ app/package
```

---

## PHIEN-003 – Chuẩn hóa tooling toàn repo

### Thiết lập

```text
TypeScript strict
ESLint
Prettier
EditorConfig
pnpm workspace
scripts root
```

### Script root

```text
lint
typecheck
test
build
format
```

### Tiêu chí

```text
pnpm lint
pnpm typecheck
```

chạy được trên project rỗng.

---

## PHIEN-004 – Docker môi trường local

### Service

```text
MySQL
Redis
MinIO
Mailpit
```

### Cần tạo

```text
docker-compose.yml
.env.example
infra/
```

### Healthcheck

Cần healthcheck cho MySQL/Redis.

### Tiêu chí

```bash
docker compose up -d
docker compose ps
```

tất cả service healthy.

---

# GIAI ĐOẠN 1 – KHỞI TẠO 4 ỨNG DỤNG

---

## PHIEN-005 – Khởi tạo Backend NestJS

### Tạo

```text
apps/api
```

### Cài

```text
NestJS
Swagger
Config
Validation
Helmet
Throttler
Prisma
```

### Tạo endpoint

```text
GET /api/v1/suc-khoe
```

### Swagger

```text
/docs
/openapi-json
```

### Tiêu chí

```text
Backend chạy
Swagger mở được
health endpoint trả 200
```

---

## PHIEN-006 – Kết nối Prisma + MySQL

### Công việc

```text
prisma init
DATABASE_URL
PrismaService
PrismaModule
migration đầu tiên
```

### Tạo bảng thử nghiệm tối thiểu

Có thể chỉ tạo hệ thống migration trước.

### Tiêu chí

```text
prisma migrate dev
prisma generate
```

thành công.

---

## PHIEN-007 – Khởi tạo Customer Web

### Stack

```text
Next.js
Mantine
Mantine UI
TanStack Query
Zustand
```

### Tạo

```text
AppShell
Theme
QueryClient
Error boundary cơ bản
```

### Trang thử

```text
/
```

hiển thị AgriMarket.

### Tiêu chí

```text
pnpm dev
pnpm build
```

thành công.

---

## PHIEN-008 – Khởi tạo Admin Web

### Stack

```text
Next.js
Ant Design
ProComponents
TanStack Query
```

### Tạo

```text
Login placeholder
ProLayout
Sidebar placeholder
Dashboard placeholder
```

### Tiêu chí

build thành công.

---

## PHIEN-009 – Khởi tạo Mobile Expo

### Stack

```text
Expo
Expo Router
gluestack-ui
UniWind
TanStack Query
Zustand
```

### Route

```text
(auth)
(tabs)
```

### Tab

```text
Trang chủ
Khám phá
Quét QR
Đơn hàng
Tài khoản
```

### Tiêu chí

Expo chạy trên thiết bị thật.

---

## PHIEN-010 – Swagger → Orval → FE client

### Mục tiêu

Tạo luồng code generation.

### Flow

```text
NestJS Swagger
→ openapi-json
→ Orval
→ packages/api-client
```

### Test bằng endpoint

```text
GET /suc-khoe
```

### Tiêu chí

Customer Web/Admin/Mobile gọi được API qua generated client.

---

# GIAI ĐOẠN 2 – DATABASE VÀ NỀN TẢNG BACKEND

---

## PHIEN-011 – Thiết kế Prisma schema nền tảng

### Bảng

```text
nguoi_dung
khach_hang
nhan_vien
vai_tro
quyen
vai_tro_quyen
nguoi_dung_vai_tro
dia_chi
```

### Yêu cầu

```text
UUID
createdAt
updatedAt
status
unique indexes
foreign key
```

### Đầu ra

```text
schema.prisma
ERD cập nhật
migration
```

---

## PHIEN-012 – Module xác thực

### Chức năng

```text
Đăng ký khách hàng
Đăng nhập
Refresh token
Đăng xuất
Quên mật khẩu
Đổi mật khẩu
```

### Security

```text
Argon2
JWT
Refresh token rotation nếu phù hợp
rate limit
```

### Test

Unit + integration.

---

## PHIEN-013 – RBAC

### Chức năng

```text
Role
Permission
Gán Role
PermissionGuard
Decorator
```

### Permission mẫu

```text
san_pham.xem
san_pham.tao
don_hang.xu_ly
ton_kho.dieu_chinh
```

### Test

Nhân viên không có quyền phải nhận 403.

---

## PHIEN-014 – Audit Log

### Ghi

```text
actor
action
entity
before
after
timestamp
```

### Áp dụng thử

```text
khóa tài khoản
gán role
```

---

## PHIEN-015 – Upload file

### MinIO

Tạo module file.

### Hỗ trợ

```text
upload
delete
signed/public URL theo nhu cầu
mime validation
size validation
```

---

## PHIEN-016 – Redis + BullMQ nền tảng

### Queue

```text
email
notification
system-job
```

### Test job

gửi email thử tới Mailpit.

---

# GIAI ĐOẠN 3 – QUẢN LÝ NGUỒN CUNG

---

## PHIEN-017 – Nhà cung cấp

### Backend

CRUD:

```text
nha-cung-cap
```

### Trường

```text
mã
tên
người đại diện
điện thoại
email
địa chỉ
trạng thái
ghi chú
```

### Admin

```text
ProTable
Detail
Create/Edit
```

### Permission

```text
nha_cung_cap.xem
nha_cung_cap.tao
nha_cung_cap.sua
nha_cung_cap.khoa
```

---

## PHIEN-018 – Trang trại

### Backend + Admin

```text
Trang trại
GPS
Địa chỉ
Diện tích
Nhà cung cấp
Ảnh
Trạng thái
```

### Customer API

Public farm detail.

---

## PHIEN-019 – Chứng nhận

### Model

```text
loại
mã
đơn vị cấp
ngày cấp
hết hạn
file
trạng thái xác minh
```

### Job

cảnh báo:

```text
30 ngày
7 ngày
hết hạn
```

### Admin UI

list/detail/verify.

---

## PHIEN-020 – Mùa vụ

### Model

```text
farm
cây trồng
giống
ngày trồng
ngày dự kiến thu hoạch
sản lượng dự kiến
trạng thái
```

### Admin

ProTable + detail timeline.

---

## PHIEN-021 – Nhật ký canh tác

### Event

```text
tưới
bón phân
sâu bệnh
kiểm tra
thời tiết
khác
```

### Public flag

```text
hienThiCongKhai
```

để truy xuất sau này.

---

## PHIEN-022 – Thu hoạch

### Model

```text
mùa vụ
ngày
số lượng
đơn vị
phân loại
ghi chú
```

### Action

```text
Tạo lô từ thu hoạch
```

---

# GIAI ĐOẠN 4 – LÔ, CHẤT LƯỢNG, TRUY XUẤT

---

## PHIEN-023 – Lô sản phẩm

### Model

```text
maLo
harvestId
quantity
remaining
qualityGrade
expiryDate
status
```

### State

```text
MOI_TAO
CHO_KIEM_DINH
CO_THE_BAN
TAM_GIU
KHONG_DAT
THU_HOI
HET_HANG
```

---

## PHIEN-024 – Kiểm định chất lượng

### Model

```text
lo
ngayKiemDinh
nguoiKiemDinh
ketQua
phanHang
ghiChu
anh
```

### Rule

`FAILED/HOLD/RECALLED` không được bán.

---

## PHIEN-025 – QR Code

### Chức năng

```text
generate QR
stable trace code
download/print QR
```

Không nhúng toàn bộ dữ liệu vào QR.

QR chứa trace identifier hoặc URL.

---

## PHIEN-026 – Trace Events

### Event

```text
CANH_TAC
THU_HOACH
KIEM_DINH
DONG_GOI
NHAP_KHO
XUAT_KHO
GIAO_HANG
```

### Fields

```text
batchId
type
time
location
metadata
public
```

---

## PHIEN-027 – API truy xuất công khai

### API

```text
GET /api/v1/truy-xuat/:ma
```

### Response

Chỉ public data.

### Bảo mật

Không lộ:

```text
cost
nhân viên nội bộ
ghi chú riêng
private document
```

---

## PHIEN-028 – Thu hồi lô

### Flow

```text
Recall batch
→ stop sale
→ stop allocation
→ tìm order affected
→ notification
```

### Admin UI

Cảnh báo rõ.

### Customer

Trace page hiển thị cảnh báo.

---

# GIAI ĐOẠN 5 – CATALOG VÀ SẢN PHẨM

---

## PHIEN-029 – Danh mục sản phẩm

### Backend/Admin

```text
category
parent category nếu cần
slug
status
image
```

---

## PHIEN-030 – Sản phẩm

### Model

```text
ten
moTa
farm
category
status
```

Phân biệt:

```text
Product ≠ Batch
```

---

## PHIEN-031 – Biến thể và giá

### Model

```text
SKU
500g
1kg
2kg
gia
donVi
```

### Rule

Giá order phải snapshot khi đặt hàng.

---

## PHIEN-032 – Ảnh sản phẩm

### Chức năng

```text
multiple upload
cover image
sort order
delete
```

---

## PHIEN-033 – API public sản phẩm

### API

```text
list
detail
category
farm
related
```

### Response

Cần:

```text
price
farm
certificate badges
harvest info
availability
```

---

# GIAI ĐOẠN 6 – KHO VÀ TỒN KHO

---

## PHIEN-034 – Kho

### Model

```text
maKho
ten
diaChi
status
```

---

## PHIEN-035 – InventoryLot

### Key

```text
warehouse + batch + variant
```

### Quantity

```text
onHand
reserved
blocked
available
```

Rule:

```text
available = onHand - reserved - blocked
```

---

## PHIEN-036 – Inventory Transaction Ledger

### Type

```text
HARVEST_IN
TRANSFER_IN
TRANSFER_OUT
ORDER_RESERVE
ORDER_RELEASE
ORDER_SHIP
RETURN_IN
DAMAGE
EXPIRE
ADJUSTMENT
```

Không sửa ledger cũ.

---

## PHIEN-037 – Nhập/Xuất/Chuyển kho

### Transaction

mọi action phải atomic.

### Admin

form dùng ProForm.

---

## PHIEN-038 – Điều chỉnh tồn kho

### Rule

Bắt buộc:

```text
reason
actor
timestamp
before
after
```

Audit Log.

---

## PHIEN-039 – FEFO

### Service

```text
lọc batch hợp lệ
sort expiry ASC
allocate
```

### Test

phân bổ từ nhiều batch.

---

## PHIEN-040 – Cảnh báo hàng sắp hết hạn

### Job

```text
near expiry
expired
```

### Admin dashboard

alert.

---

# GIAI ĐOẠN 7 – CUSTOMER WEB CORE

---

## PHIEN-041 – Customer Web layout + Design System

### Xây

```text
Header
Footer
Container
Theme
ProductCard
FarmCard
Badge
Skeleton
EmptyState
ErrorState
```

### Không làm business sâu.

---

## PHIEN-042 – Trang chủ Customer Web

### Section

```text
Hero
Danh mục
Mới thu hoạch
Organic
Trang trại nổi bật
Theo mùa
Gợi ý
```

Ban đầu recommendation có thể rule-based.

---

## PHIEN-043 – Search/List/Filter

### Chức năng

```text
keyword
category
price
farm
province
certificate
harvest date
rating
availability
sort
pagination
```

URL phải giữ filter state.

---

## PHIEN-044 – Product Detail

### Section

```text
gallery
price
variant
stock
farm
harvest
certificate
trace
review
related
```

---

## PHIEN-045 – Farm Detail

### Tabs

```text
Giới thiệu
Sản phẩm
Chứng nhận
Mùa vụ
Đánh giá
```

---

## PHIEN-046 – Trace Web

### Chức năng

```text
nhập mã
timeline
farm
certificate
batch
recall alert
```

---

# GIAI ĐOẠN 8 – GIỎ HÀNG VÀ CHECKOUT

---

## PHIEN-047 – Cart Backend

### Model

```text
cart
cart_item
```

### Rule

Một khách một cart active.

---

## PHIEN-048 – Cart Customer Web

### Chức năng

```text
add
update qty
remove
group supplier
sync
```

---

## PHIEN-049 – Checkout Preview

### Backend tính

```text
items
price
promotion
shipping
points
total
```

Frontend không tự tính nguồn sự thật.

---

## PHIEN-050 – Inventory Reservation

### Flow

```text
available
→ reserve
→ TTL
→ sold/release
```

### Concurrency test

10 request tranh hàng cuối.

---

## PHIEN-051 – Order schema

### Tables

```text
order
supplier_order
order_item
order_allocation
```

### Snapshot

```text
price
product name
variant
farm
```

---

## PHIEN-052 – Create Order

### Transaction

```text
validate cart
validate price
reserve
create order
create suborders
create items
allocate
```

---

# GIAI ĐOẠN 9 – THANH TOÁN

---

## PHIEN-053 – Payment Domain

### Entity

```text
payment
payment_transaction
```

### State

```text
CREATED
PENDING
PAID
FAILED
CANCELLED
PARTIALLY_REFUNDED
REFUNDED
```

---

## PHIEN-054 – COD + Mock Payment

Tạo flow hoàn chỉnh không phụ thuộc cổng thật trước.

---

## PHIEN-055 – Payment Gateway Adapter

### Interface

```text
createPayment
verifyCallback
refund
```

### Implementation

```text
Mock
VNPay Sandbox
```

---

## PHIEN-056 – Payment Callback Idempotency

### Test

callback gửi 2–5 lần nhưng chỉ ghi nhận một lần.

---

## PHIEN-057 – Checkout UI Customer Web

### Sections

```text
address
items
shipping
voucher
payment
summary
```

---

## PHIEN-058 – Payment Result UI

```text
success
failure
pending
```

---

# GIAI ĐOẠN 10 – ĐƠN HÀNG VÀ GIAO HÀNG

---

## PHIEN-059 – Order State Machine

### State

```text
CHO_THANH_TOAN
DA_XAC_NHAN
DANG_CHUAN_BI
DA_DONG_GOI
DANG_GIAO
DA_GIAO
HOAN_THANH
DA_HUY
```

### Rule

Transition validation.

---

## PHIEN-060 – Customer Order List/Detail

Customer Web:

```text
list
filter
detail
timeline
cancel action
```

---

## PHIEN-061 – Admin Order List/Detail

ProTable + ProDescriptions.

---

## PHIEN-062 – Packing Workflow

### Checklist

```text
đúng sản phẩm
đúng batch
đúng qty
đóng gói
QR
```

---

## PHIEN-063 – Shipment Domain

### Entity

```text
shipment
tracking_event
```

### State

```text
CREATED
PICKED_UP
IN_TRANSIT
OUT_FOR_DELIVERY
DELIVERED
FAILED
RETURNED
```

---

## PHIEN-064 – Shipping Adapter

Mock trước, API hãng vận chuyển sau nếu cần.

---

# GIAI ĐOẠN 11 – ĐÁNH GIÁ VÀ KHIẾU NẠI

---

## PHIEN-065 – Review Backend

Rule:

```text
chỉ delivered item
một review/order item
```

---

## PHIEN-066 – Review UI

Customer Web.

---

## PHIEN-067 – Complaint Domain

### Entity

```text
complaint
complaint_evidence
```

### Reason

```text
hỏng
dập
sai
thiếu
hết hạn
chất lượng
chứng nhận
```

---

## PHIEN-068 – Complaint Customer Web

Wizard:

```text
item
reason
description
evidence
confirm
```

---

## PHIEN-069 – Complaint Admin

### Detail

```text
order
item
batch
shipment
evidence
timeline
resolution
```

---

## PHIEN-070 – Refund

### Rule

```text
refund <= paid amount
```

### Integration

Payment adapter.

---

# GIAI ĐOẠN 12 – KHÁCH HÀNG, YÊU THÍCH, THEO DÕI, LOYALTY

---

## PHIEN-071 – Customer Profile

Backend + Customer Web.

---

## PHIEN-072 – Address Book

CRUD địa chỉ + default.

---

## PHIEN-073 – Wishlist

```text
favorite product
```

---

## PHIEN-074 – Follow Farm

```text
follow/unfollow
new harvest notification
```

---

## PHIEN-075 – Loyalty

### Model

```text
loyalty_account
loyalty_transaction
```

---

## PHIEN-076 – Voucher/Promotion

### Rule engine vừa đủ

```text
platform
category
product
min order
date
usage limit
```

Không tạo generic engine quá phức tạp.

---

# GIAI ĐOẠN 13 – ADMIN SYSTEM

---

## PHIEN-077 – Quản lý khách hàng

Admin:

```text
list
detail
lock/unlock
orders
complaints
```

---

## PHIEN-078 – Quản lý nhân viên

```text
create
edit
lock
reset password
role assignment
```

---

## PHIEN-079 – Role/Permission UI

Permission Matrix.

---

## PHIEN-080 – Audit UI

Filter:

```text
actor
action
entity
date
```

---

## PHIEN-081 – System Settings

```text
reservation TTL
complaint window
near-expiry threshold
```

---

# GIAI ĐOẠN 14 – TÀI CHÍNH NHÀ CUNG CẤP

---

## PHIEN-082 – Commission Rules

```text
percentage
category
supplier
effective date
```

---

## PHIEN-083 – Seller Balance

```text
pending
available
withheld
paid
```

---

## PHIEN-084 – Settlement

### Formula

```text
revenue
- commission
- refunds
- adjustments
= payable
```

---

## PHIEN-085 – Payout

```text
REQUESTED
PROCESSING
PAID
FAILED
```

---

## PHIEN-086 – Finance Admin UI

```text
payments
refunds
settlements
payouts
```

---

# GIAI ĐOẠN 15 – DASHBOARD VÀ BÁO CÁO

---

## PHIEN-087 – Dashboard API

KPI:

```text
revenue
orders
customers
products
inventory alerts
complaints
```

---

## PHIEN-088 – Admin Dashboard

```text
4–6 KPI
2–4 charts
alerts
```

---

## PHIEN-089 – Inventory Reports

```text
stock
near expiry
expired
waste
```

---

## PHIEN-090 – Order/Revenue Reports

Filter ngày/farm/category.

---

## PHIEN-091 – Traceability Reports

```text
batch
recall
affected orders
```

---

# GIAI ĐOẠN 16 – MOBILE CUSTOMER

---

## PHIEN-092 – Mobile Design System

Tạo:

```text
theme
spacing
typography
ProductCard
FarmCard
Badge
Skeleton
Empty/Error
```

---

## PHIEN-093 – Mobile Auth

```text
login
register
forgot
SecureStore
refresh
```

---

## PHIEN-094 – Mobile Home

Sections giống Customer Web nhưng native layout.

---

## PHIEN-095 – Mobile Search/Filter

BottomSheet.

---

## PHIEN-096 – Mobile Product Detail

Sticky CTA.

---

## PHIEN-097 – Mobile Farm Detail

---

## PHIEN-098 – Mobile QR Scanner

Expo Camera.

---

## PHIEN-099 – Mobile Trace Detail

Timeline + recall alert.

---

## PHIEN-100 – Mobile Cart

Đồng bộ Backend.

---

## PHIEN-101 – Mobile Checkout

Địa chỉ/giao hàng/voucher/payment.

---

## PHIEN-102 – Mobile Payment

Deep link/return flow nếu dùng gateway.

---

## PHIEN-103 – Mobile Orders

List/detail/timeline.

---

## PHIEN-104 – Mobile Complaint/Review

Camera/gallery evidence.

---

## PHIEN-105 – Mobile Account

```text
profile
address
wishlist
farm follows
loyalty
voucher
complaint
```

---

## PHIEN-106 – Push Notification

Expo Notifications.

### Event

```text
order
shipment
refund
new harvest
recall
```

---

# GIAI ĐOẠN 17 – ĐỒNG BỘ ĐA NỀN TẢNG

---

## PHIEN-107 – Cart Sync Test

```text
add mobile
→ web sees item
```

---

## PHIEN-108 – Order Sync Test

```text
order mobile
→ web customer sees
→ admin sees
```

---

## PHIEN-109 – Profile/Address Sync

---

## PHIEN-110 – Notification Sync

In-app + push.

---

# GIAI ĐOẠN 18 – SEARCH NÂNG CAO

---

## PHIEN-111 – MySQL Search Optimization

```text
indexes
FULLTEXT nếu phù hợp
query explain
```

---

## PHIEN-112 – Search Ranking Rule-based

Factor:

```text
text
stock
freshness
rating
distance
```

---

# GIAI ĐOẠN 19 – AI MODULE (CHỌN MỘT MODULE CHÍNH)

> Không làm cả 4 nếu thời gian không đủ.

---

## PHIEN-113 – Chốt AI Module

Chọn một:

```text
Recommendation System
Semantic Search
Demand Forecast
Computer Vision Quality
```

### Deliverable

```text
problem
dataset
baseline
metrics
architecture
integration plan
```

---

## PHIEN-114 – Chuẩn bị dữ liệu AI

Tùy module.

---

## PHIEN-115 – Baseline AI

Có metric.

---

## PHIEN-116 – Tích hợp API AI

Không để core phụ thuộc AI.

---

## PHIEN-117 – AI UI

Chỉ nơi cần.

---

## PHIEN-118 – AI Evaluation

Metrics + bảng kết quả + latency.

---

# GIAI ĐOẠN 20 – TÍNH NĂNG NÂNG CAO OPTIONAL

---

## PHIEN-119 – Subscription Box

Chỉ làm nếu core hoàn thiện.

---

## PHIEN-120 – Pre-order mùa vụ

---

## PHIEN-121 – Adopt a Tree/Crop

---

# GIAI ĐOẠN 21 – TEST TOÀN HỆ THỐNG

---

## PHIEN-122 – Unit Test Coverage Review

Tập trung business logic.

---

## PHIEN-123 – Integration Test Backend

Các flow:

```text
auth
inventory
order
payment
refund
trace
```

---

## PHIEN-124 – Concurrency Test Inventory

Scenario:

```text
1kg cuối
10 checkout đồng thời
```

Không oversell.

---

## PHIEN-125 – Payment Idempotency Test

---

## PHIEN-126 – Permission Security Test

---

## PHIEN-127 – Customer Web E2E

Playwright:

```text
search
cart
checkout
order
complaint
```

---

## PHIEN-128 – Admin E2E

```text
batch
inventory
order
complaint
refund
```

---

## PHIEN-129 – Mobile Functional Test

Thiết bị thật.

---

# GIAI ĐOẠN 22 – PERFORMANCE VÀ SECURITY

---

## PHIEN-130 – Database Index Review

Dùng EXPLAIN.

---

## PHIEN-131 – API Performance

Đo:

```text
P50
P95
P99
```

---

## PHIEN-132 – Security Review

Checklist:

```text
JWT
refresh
RBAC
CORS
helmet
rate limit
upload
SQL injection
XSS
CSRF nếu cookie
secret
logging
```

---

## PHIEN-133 – Dependency Audit

```text
pnpm audit
outdated
```

Không nâng major bừa.

---

# GIAI ĐOẠN 23 – OBSERVABILITY

---

## PHIEN-134 – Structured Logging

Pino.

---

## PHIEN-135 – Error Tracking

Có thể dùng Sentry hoặc giải pháp phù hợp.

---

## PHIEN-136 – Health/Readiness

```text
API
DB
Redis
Storage
```

---

# GIAI ĐOẠN 24 – CI/CD

---

## PHIEN-137 – GitHub Actions CI

Pipeline:

```text
install
lint
typecheck
test
build
```

---

## PHIEN-138 – Migration CI/CD

Không chạy migration nguy hiểm tự động không kiểm soát.

---

## PHIEN-139 – Docker Production Build

Backend/Web.

---

# GIAI ĐOẠN 25 – SEED VÀ DỮ LIỆU DEMO

---

## PHIEN-140 – Seed dữ liệu cơ bản

```text
roles
permissions
admin
categories
```

---

## PHIEN-141 – Seed dữ liệu demo thực tế

```text
farms
suppliers
crops
harvests
batches
products
inventory
customers
orders
```

---

## PHIEN-142 – Demo QR Data

Tạo QR thật để scan khi bảo vệ.

---

# GIAI ĐOẠN 26 – TÀI LIỆU KỸ THUẬT

---

## PHIEN-143 – README chính

Tiếng Việt.

---

## PHIEN-144 – Database Design Doc

ERD + bảng + relationship + index.

---

## PHIEN-145 – API Spec Review

Swagger đầy đủ.

---

## PHIEN-146 – Architecture Doc

```text
system context
container
module
deployment
```

---

## PHIEN-147 – Business Rules Doc

Tập trung rule thật.

---

## PHIEN-148 – Use Case Specification

Hoàn thiện Use Case quan trọng.

---

# GIAI ĐOẠN 27 – BÁO CÁO ĐỒ ÁN

---

## PHIEN-149 – Chương 1

```text
bối cảnh
vấn đề
mục tiêu
phạm vi
```

---

## PHIEN-150 – Chương 2

```text
cơ sở lý thuyết
khảo sát hệ thống
```

---

## PHIEN-151 – Chương 3

```text
yêu cầu
actor
use case
business rule
```

---

## PHIEN-152 – Chương 4

```text
architecture
database
API
security
```

---

## PHIEN-153 – Chương 5

```text
implementation
screens
backend
```

---

## PHIEN-154 – Chương AI

Nếu có.

---

## PHIEN-155 – Chương Test/Evaluation

---

## PHIEN-156 – Kết luận/Hướng phát triển

---

# GIAI ĐOẠN 28 – KIỂM TRA CUỐI

---

## PHIEN-157 – Full Code Review

Tìm:

```text
dead code
duplicate
any
TODO
console.log
unused dependency
```

---

## PHIEN-158 – Full UX Review

Customer Web/Admin/Mobile.

---

## PHIEN-159 – Full Business Flow Review

7 flow:

```text
supplier/farm
batch
trace
cart/order
payment
shipping
complaint/refund
```

---

## PHIEN-160 – Full Security Review

---

## PHIEN-161 – Full Build From Clean Clone

Quan trọng.

Flow:

```text
git clone
copy .env.example
docker compose
pnpm install
migration
seed
run
```

Nếu không chạy được từ clean clone thì chưa hoàn thiện.

---

# GIAI ĐOẠN 29 – DEMO BẢO VỆ

---

## PHIEN-162 – Demo Scenario 1: nguồn hàng

```text
Farm
→ crop
→ harvest
→ batch
→ QC
→ product
```

---

## PHIEN-163 – Demo Scenario 2: QR

```text
Mobile scan
→ trace
```

---

## PHIEN-164 – Demo Scenario 3: mua hàng

```text
Mobile
→ cart
→ checkout
→ payment
```

---

## PHIEN-165 – Demo Scenario 4: đồng bộ Web

```text
Order tạo trên Mobile
→ Customer Web thấy
```

---

## PHIEN-166 – Demo Scenario 5: Admin xử lý

```text
FEFO
→ packing
→ shipping
```

---

## PHIEN-167 – Demo Scenario 6: complaint/refund

---

## PHIEN-168 – Demo Scenario 7: recall

---

# GIAI ĐOẠN 30 – HOÀN THIỆN BẢO VỆ

---

## PHIEN-169 – Slide bảo vệ

Khoảng:

```text
15–25 slide
```

---

## PHIEN-170 – Script thuyết trình

---

## PHIEN-171 – Câu hỏi phản biện

Chuẩn bị câu hỏi:

```text
Tại sao MySQL?
Tại sao NestJS?
Tại sao không Microservices?
Tại sao 3 Actor?
Tại sao Product ≠ Batch?
Tại sao FEFO?
Tại sao QR không dùng blockchain?
Tại sao AI chỉ là module phụ?
```

---

## PHIEN-172 – Final Release

Tag:

```text
v1.0.0
```

Checklist:

```text
code
docs
database
swagger
demo data
QR
test
build
report
slides
video backup
```

---

# PHẦN III. MỨC ƯU TIÊN

## MUST HAVE

Không được bỏ:

```text
PHIEN-001 → PHIEN-118
```

trừ AI optional thì có thể dời.

Đặc biệt bắt buộc:

```text
Auth
RBAC
Farm
Batch
Traceability
Product
Inventory
FEFO
Cart
Checkout
Order
Payment
Admin
Mobile
Complaint
Refund
Test
```

---

## SHOULD HAVE

```text
Loyalty
Promotion
Dashboard
Finance
Reporting
Push notification
```

---

## COULD HAVE

```text
AI
Subscription
Pre-order
Adoption
Advanced search
```

---

# PHẦN IV. CÁCH CHẠY DỰ ÁN THEO PHIÊN

Không yêu cầu AI làm:

```text
“Hãy code toàn bộ project”
```

Đây là cách dễ hỏng nhất.

Nên:

```text
PHIEN-001
→ review
→ commit

PHIEN-002
→ review
→ commit

PHIEN-003
→ review
→ commit
```

Mỗi phiên nên tương ứng:

```text
1 mục tiêu
1 nhóm thay đổi
1 commit hoặc 1 PR
```

---

# PHẦN V. QUY TẮC COMMIT THEO PHIÊN

Ví dụ:

```text
feat(phien-017): hoan thien quan ly nha cung cap

feat(phien-023): them module lo san pham

feat(phien-039): them phan bo ton kho theo FEFO

test(phien-124): them kiem thu tranh oversell
```

---

# PHẦN VI. MẪU BÁO CÁO CUỐI MỖI PHIÊN

AI phải trả:

```markdown
## Phiên đã hoàn thành
PHIEN-xxx

## Đã làm
- ...

## File đã tạo
- ...

## File đã sửa
- ...

## API mới
- ...

## Database thay đổi
- ...

## Test đã chạy
- pnpm lint: PASS
- pnpm typecheck: PASS
- test: PASS
- build: PASS

## Lỗi/tồn đọng
- ...

## Quyết định mới
- ...

## Phiên tiếp theo
PHIEN-yyy
```

---

# PHẦN VII. MẪU `TRANG_THAI_DU_AN.md`

```markdown
# TRẠNG THÁI DỰ ÁN AGRIMARKET

## Cập nhật lần cuối

28/08/2026

## Phiên vừa hoàn thành

PHIEN-001

## Phiên tiếp theo

PHIEN-002

## Tình trạng

### Hoàn thành

- Phân tích nghiệp vụ
- Actor
- UI design
- Technology stack
- Code convention

### Đang thực hiện

- Repository foundation

### Chưa làm

- Backend
- Customer Web
- Admin
- Mobile
- Database

## Stack

...

## Lệnh chạy

...

## Test

...

## Lỗi đang tồn tại

Không có.

## Quyết định cần giữ

- 3 Actor
- Modular Monolith
- MySQL
...
```

---

# PHẦN VIII. MẪU `QUYET_DINH_KIEN_TRUC.md`

```markdown
# QUYẾT ĐỊNH KIẾN TRÚC

## ADR-001 – Modular Monolith

Trạng thái: Chấp nhận

Quyết định:
Backend dùng một NestJS application chia module.

Lý do:
Đồ án nhóm nhỏ, transaction phức tạp, không cần Microservices.

Không được đổi sang Microservices nếu chưa có yêu cầu.
```

Tạo tương tự cho tất cả quyết định chính.

---

# PHẦN IX. NGUYÊN TẮC CHỐNG “AI PHÁ CODE”

AI không được:

```text
Đổi MySQL sang PostgreSQL
Đổi NestJS sang Express
Đổi Mantine sang shadcn
Đổi gluestack sang Paper
Đổi REST sang GraphQL
Đổi Prisma sang TypeORM
Đổi naming sang tiếng Anh
Thêm Redux khi Zustand đã đủ
Thêm Microservices
Thêm Kafka
Viết lại module đang chạy chỉ vì thích style khác
```

trừ khi người dùng yêu cầu.

---

# PHẦN X. NGUYÊN TẮC CHỐNG “AI LÀM QUÁ PHẠM VI”

Nếu phiên là:

```text
PHIEN-023 – Lô sản phẩm
```

AI không được tự tiện:

```text
viết luôn order
viết luôn payment
viết luôn recommendation
```

Chỉ tạo dependency tối thiểu để phiên chạy.

---

# PHẦN XI. NGUYÊN TẮC CHỐNG TRÙNG CODE

Trước khi tạo:

```text
helper
hook
component
service
DTO
enum
```

AI phải search repository xem đã có chưa.

---

# PHẦN XII. QUY TẮC PACKAGE

Trước khi:

```bash
pnpm add ...
```

AI phải:

1. kiểm tra `package.json`;
2. xác định thư viện hiện tại có đáp ứng không;
3. tránh package trùng chức năng;
4. giải thích ngắn gọn nếu thêm dependency mới.

---

# PHẦN XIII. ĐIỀU KIỆN ĐƯỢC COI LÀ “DỰ ÁN HOÀN THIỆN”

Dự án chỉ hoàn thành khi:

```text
[x] Clean clone chạy được
[x] Database migration chạy được
[x] Seed chạy được
[x] Backend chạy
[x] Swagger chạy
[x] Customer Web build
[x] Admin Web build
[x] Mobile chạy
[x] Auth/RBAC
[x] Farm
[x] Product
[x] Batch
[x] QR trace
[x] Inventory
[x] FEFO
[x] Cart
[x] Checkout
[x] Payment
[x] Order
[x] Shipping
[x] Review
[x] Complaint
[x] Refund
[x] Dashboard
[x] Audit
[x] Test critical flows
[x] Demo data
[x] Report
[x] Slides
[x] Demo script
```

---

# PHẦN XIV. BẮT ĐẦU TỪ ĐÂU?

Với trạng thái repository hiện tại, phiên đúng để bắt đầu là:

```text
PHIEN-001
Chuẩn hóa tài liệu nguồn sự thật
```

Sau khi PHIEN-001 hoàn thành:

```text
PHIEN-002
Chuẩn hóa Monorepo
```

Không nhảy thẳng vào code sản phẩm/order trước khi foundation được chuẩn hóa.

---

# KẾT LUẬN

Từ đây dự án AgriMarket phải được phát triển theo nguyên tắc:

```text
MỘT REPOSITORY
+
MỘT BỘ TÀI LIỆU NGUỒN SỰ THẬT
+
MỘT DANH SÁCH PHIÊN TUẦN TỰ
+
MỖI PHIÊN CÓ ĐẦU VÀO/ĐẦU RA/TEST
+
MỖI PHIÊN CẬP NHẬT TRẠNG THÁI
```

Nhờ đó:

```text
ChatGPT A làm PHIEN-017
        ↓
commit + update trạng thái
        ↓
ChatGPT B mở tab mới
        ↓
đọc docs
        ↓
biết PHIEN-018 là tiếp theo
        ↓
tiếp tục đúng kiến trúc
```

Không cần phụ thuộc vào lịch sử chat cũ.

Repository và các file trạng thái trở thành **bộ nhớ lâu dài của toàn bộ quá trình phát triển**.
