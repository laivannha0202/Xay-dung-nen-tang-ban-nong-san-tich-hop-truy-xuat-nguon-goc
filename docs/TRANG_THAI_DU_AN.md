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

**PHIEN-003 – Chuẩn hóa tooling toàn repo**

Đã thiết lập:

- TypeScript strict dùng cấu hình chung trong `packages/tsconfig`;
- ESLint Flat Config dùng `packages/eslint-config`;
- Prettier;
- EditorConfig;
- root scripts `lint`, `typecheck`, `test`, `build`, `format`, `format:check`;
- ghim Node.js 24 và pnpm 11 ở `package.json`.

Chưa khởi tạo NestJS, Next.js hoặc Expo; chưa code nghiệp vụ.

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

**PHIEN-004 – Docker môi trường local**

Mục tiêu:

```text
MySQL 8.4 LTS
Redis
MinIO
Mailpit
docker-compose.yml
.env.example
healthcheck MySQL/Redis
```

Không khởi tạo application framework trong PHIEN-004.

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
- [x] ESLint chung
- [x] Prettier chung
- [x] TypeScript config chung
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

Không có lỗi tooling sau PHIEN-003.

Bốn application chính vẫn chưa được khởi tạo theo đúng kế hoạch; việc này thuộc PHIEN-005 đến PHIEN-009.

## Lệnh chạy hiện tại

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
pnpm format:check
```

Môi trường đã chốt:

```text
Node.js 24 LTS
pnpm 11.x
```

## Test hiện tại

PHIEN-003 đã chạy thành công:

```text
pnpm install
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
