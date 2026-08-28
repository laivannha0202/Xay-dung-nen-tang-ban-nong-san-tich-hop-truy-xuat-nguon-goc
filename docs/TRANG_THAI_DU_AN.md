# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

28/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Chuẩn bị repository / foundation
Tiến độ code thực tế: Đã dựng skeleton Monorepo cho PHIEN-002, chưa khởi tạo 4 application framework
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-001 – Chuẩn hóa tài liệu nguồn sự thật**

Đã chuẩn bị:

- kế hoạch toàn bộ các phiên AI;
- quy tắc tiếp tục giữa các tab;
- quyết định kiến trúc;
- trạng thái dự án;
- hướng dẫn bắt đầu;
- nhật ký phiên.

## Phiên đang thực hiện

**PHIEN-002 – Chuẩn hóa cấu trúc Monorepo**

**Trạng thái:** Chưa hoàn tất tiêu chí cuối vì máy hiện chưa cài `pnpm` và đang dùng Node.js v25.9.0 thay vì Node.js 24 LTS của dự án.

Đã dựng:

```text
apps/
├── api/
├── customer-web/
├── admin-web/
└── mobile/
packages/
├── api-client/
├── shared-constants/
├── eslint-config/
└── tsconfig/
infra/
package.json
pnpm-workspace.yaml
```

Mỗi app/package có `package.json` tối thiểu để pnpm workspace nhận diện, nhưng chưa cài framework hoặc dependency nghiệp vụ.

## Phiên tiếp theo

**PHIEN-002 – Hoàn tất xác nhận Monorepo**

Cần chạy trên môi trường Node.js 24 LTS có `pnpm`:

```bash
pnpm install
```

Nếu thành công, đánh dấu PHIEN-002 hoàn thành và chuyển sang:

```text
PHIEN-003 – Chuẩn hóa tooling toàn repo
```

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
- [~] Skeleton Monorepo
- [~] pnpm workspace (đã cấu hình, chưa xác nhận bằng `pnpm install`)

## Chưa làm

### Foundation

- [ ] Hoàn tất xác nhận Monorepo bằng `pnpm install`
- [ ] ESLint chung
- [ ] Prettier chung
- [ ] TypeScript config chung
- [ ] Docker Compose

### Applications

- [ ] NestJS Backend
- [ ] Customer Web
- [ ] Admin Web
- [ ] Mobile Expo

### Backend

- [ ] Prisma
- [ ] MySQL schema
- [ ] Swagger
- [ ] Auth
- [ ] RBAC
- [ ] Audit
- [ ] File upload
- [ ] Redis/BullMQ

### Nghiệp vụ

- [ ] Nhà cung cấp
- [ ] Trang trại
- [ ] Chứng nhận
- [ ] Mùa vụ
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

Không phát hiện lỗi cấu trúc trong các file PHIEN-002.

Môi trường thực thi hiện tại:

```text
Node.js: v25.9.0 (không đúng Node.js 24 LTS của dự án)
pnpm: chưa cài
Mạng/npm registry: chưa kiểm tra trong lần chạy này
GitHub connector: chỉ có quyền đọc, không có quyền push
```

Vì vậy chưa thể xác nhận tiêu chí bắt buộc `pnpm install chạy được` và chưa được đánh dấu PHIEN-002 hoàn thành.

Việc dọn tên file có `(1)` là việc vệ sinh repository, không chặn PHIEN-002.

## Lệnh chạy hiện tại

Trên máy phát triển đúng môi trường:

```bash
node --version
pnpm --version
pnpm install
python3 tao-boi-canh-du-an-cho-gpt.py
```

## Test hiện tại

Đã kiểm tra cục bộ:

```text
[x] Tất cả package.json là JSON hợp lệ
[x] pnpm-workspace.yaml là YAML hợp lệ
[x] Có đủ 4 workspace trong apps/*
[x] Có đủ 4 workspace trong packages/*
[x] Tên package không trùng
[x] Chưa thêm dependency/framework ngoài phạm vi PHIEN-002
[ ] pnpm install — chưa chạy được do môi trường không có pnpm/network
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
