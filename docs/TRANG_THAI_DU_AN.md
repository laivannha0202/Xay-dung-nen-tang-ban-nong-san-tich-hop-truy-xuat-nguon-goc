# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

28/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 1 – Khởi tạo 4 ứng dụng
Tiến độ code thực tế: Backend + Customer Web + Admin Web + Mobile foundation đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-009 – Khởi tạo Mobile Expo**

Đã thiết lập:

- Expo SDK 57 (`expo` ~57.0.18);
- React Native 0.86.3;
- React 19.2.3;
- Expo Router ~57.0.17;
- gluestack-ui v5 core ^5.0.15;
- UniWind ^1.11.0;
- TanStack Query;
- Zustand;
- `GluestackUIProvider`;
- `QueryClientProvider`;
- cấu trúc Expo SDK 57 hiện đại `src/app`;
- `(auth)` và `(tabs)`;
- 5 tab: Trang chủ / Khám phá / Quét QR / Đơn hàng / Tài khoản;
- login placeholder;
- TypeScript strict;
- khai báo type cho global CSS/CSS Module dưới TypeScript 6;
- Expo Doctor;
- `pnpm dedupe` cho native dependency graph;
- chỉ dùng `pnpm.overrides` cho `expo-constants` nếu Doctor vẫn phát hiện duplicate;
- Metro smoke;
- Android JS bundle export.

Lưu ý: repo local đang nằm trong đường dẫn có dấu cách. gluestack-ui v5
cảnh báo Expo + UniWind có thể kẹt bundler trong trường hợp này. PHIEN-009
đã validate Metro/Android export trong project tạm `/tmp` không dấu cách và
không tự ý rename repository.

## Phiên tiếp theo

**PHIEN-010 – Swagger → Orval → FE client**

Mục tiêu:

```text
NestJS Swagger /openapi-json
→ Orval
→ packages/api-client
→ TanStack Query
→ Customer Web / Admin Web / Mobile
```

Test đầu tiên bằng endpoint sức khỏe.

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
- [ ] MySQL schema
- [x] Swagger
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

Không có lỗi source PHIEN-009.

Tồn đọng môi trường:
- repo local có dấu cách trong tên thư mục;
- gluestack-ui v5 docs cảnh báo Expo + UniWind có thể kẹt bundler với path này;
- Metro và Android export đã được validate ở `/tmp` không dấu cách;
- nên rename thư mục repo sang tên không chứa dấu cách trước khi dev Mobile dài hạn.

Thiết bị Android thật vẫn cần được xác nhận trên thiết bị được kết nối/ủy quyền;
automation không thể tự chứng minh một thiết bị vật lý không được cung cấp.

## Lệnh chạy hiện tại

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
pnpm format:check

pnpm --filter @agrimarket/api start:dev
pnpm --filter @agrimarket/customer-web dev
pnpm --filter @agrimarket/admin-web dev

pnpm --filter @agrimarket/mobile start
pnpm --filter @agrimarket/mobile android
pnpm --filter @agrimarket/mobile web
pnpm --filter @agrimarket/mobile typecheck
```

## Test hiện tại

PHIEN-009 đã chạy thành công:

```text
Expo SDK 57 official template
gluestack-ui v5 CLI + UniWind
Expo Doctor
Mobile TypeScript strict
Expo Metro smoke
Expo export --platform android
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
