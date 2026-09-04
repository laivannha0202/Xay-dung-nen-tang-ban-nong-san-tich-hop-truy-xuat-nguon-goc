# NHẬT KÝ CÁC PHIÊN AI

> Chỉ ghi tóm tắt. Không ghi chain-of-thought.

---

## PHIEN-001 – Chuẩn hóa tài liệu nguồn sự thật

**Trạng thái:** Hoàn thành

**Ngày:** 28/08/2026

### Đã thực hiện

- Tạo kế hoạch toàn bộ phiên AI.
- Chốt cơ chế đồng bộ giữa tab ChatGPT.
- Tạo file trạng thái dự án.
- Tạo quyết định kiến trúc.
- Tạo quy tắc cho AI.
- Tạo file “Bắt đầu ở đây”.
- Tạo README chính.

### Chưa code

Chưa khởi tạo:

```text
apps/api
apps/customer-web
apps/admin-web
apps/mobile
```

### Phiên tiếp theo

```text
PHIEN-002 – Chuẩn hóa cấu trúc Monorepo
```

---

## PHIEN-002 – Chuẩn hóa cấu trúc Monorepo

**Trạng thái:** Có vấn đề

**Ngày:** 28/08/2026

### Đã thực hiện

- Tạo skeleton `apps/` với `api`, `customer-web`, `admin-web`, `mobile`.
- Tạo skeleton `packages/` với `api-client`, `shared-constants`, `eslint-config`, `tsconfig`.
- Tạo `infra/`.
- Tạo `package.json` root tối thiểu.
- Tạo `pnpm-workspace.yaml` với `apps/*` và `packages/*`.
- Tạo `package.json` tối thiểu cho từng workspace để pnpm nhận diện.
- Không cài framework, UI library, database hoặc dependency nghiệp vụ ngoài scope.
- Không tạo `docker-compose.yml`; phần cấu hình Docker thuộc PHIEN-004.

### File tạo

```text
package.json
pnpm-workspace.yaml
apps/api/package.json
apps/customer-web/package.json
apps/admin-web/package.json
apps/mobile/package.json
packages/api-client/package.json
packages/shared-constants/package.json
packages/eslint-config/package.json
packages/tsconfig/package.json
infra/.gitkeep
```

### File sửa

```text
docs/TRANG_THAI_DU_AN.md
docs/NHAT_KY_PHIEN_AI.md
docs/BOI_CANH_DU_AN_CHO_GPT.md
```

### Test

```text
[x] JSON hợp lệ
[x] YAML hợp lệ
[x] Đủ 8 workspace package manifest
[x] Tên package duy nhất
[ ] pnpm install
```

Chưa chạy được `pnpm install` vì máy hiện chưa cài `pnpm`. Máy đang dùng Node.js v25.9.0, trong khi dự án chốt Node.js 24 LTS.

### Lỗi tồn đọng

Không có lỗi source đã phát hiện.

Cần xác nhận trên môi trường dự án:

```bash
pnpm install
```

GitHub connector hiện chỉ có quyền đọc nên thay đổi chưa thể push trực tiếp lên repository.

### Phiên tiếp theo

```text
PHIEN-002 – Hoàn tất xác nhận Monorepo
```

Sau khi `pnpm install` thành công mới chuyển sang:

```text
PHIEN-003 – Chuẩn hóa tooling toàn repo
```

---

---

## PHIEN-003 – Chuẩn hóa tooling toàn repo

**Trạng thái:** Hoàn thành
**Ngày:** 28/08/2026

### Đã thực hiện

- Thiết lập TypeScript strict dùng config chung.
- Thiết lập ESLint Flat Config dùng package workspace.
- Thiết lập Prettier và EditorConfig.
- Bổ sung root scripts lint/typecheck/test/build/format.
- Ghim bộ tooling tương thích với Node.js 24 LTS.
- Không khởi tạo application framework và không code nghiệp vụ.

### File tạo

- `.editorconfig`
- `.prettierignore`
- `.prettierrc.json`
- `eslint.config.mjs`
- `tsconfig.json`
- `tools/kiem-tra-typescript.ts`
- `packages/eslint-config/index.mjs`
- `packages/tsconfig/base.json`

### File sửa

- `package.json`
- `pnpm-lock.yaml`
- `packages/eslint-config/package.json`
- `packages/tsconfig/package.json`
- `docs/TRANG_THAI_DU_AN.md`
- `docs/BOI_CANH_DU_AN_CHO_GPT.md`
- `docs/NHAT_KY_PHIEN_AI.md`

### Dependency mới

- `typescript` 6.0.3
- `eslint` 10.9.1
- `prettier` 3.9.6
- `typescript-eslint` 8.68.0
- `@eslint/js` 10.0.1
- `globals` 17.11.0

### API mới

Không có.

### Database

Không thay đổi.

### Test

- `pnpm install`: thành công.
- `pnpm lint`: thành công.
- `pnpm typecheck`: thành công.
- `pnpm test`: thành công.
- `pnpm build`: thành công.
- `pnpm format:check`: thành công.
- `git diff --check`: thành công.

### Lỗi tồn đọng

Không có lỗi tooling.

### Phiên tiếp theo

PHIEN-004 – Docker môi trường local

---

## PHIEN-004 – Docker môi trường local

**Trạng thái:** Hoàn thành
**Ngày:** 28/08/2026

### Đã thực hiện

- Tạo Docker Compose cho MySQL, Redis, MinIO và Mailpit.
- MySQL: `mysql:8.4.11`.
- Redis: `redis:8.10.0-alpine`.
- MinIO local: `quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z`.
- Mailpit: `axllent/mailpit:v1.31.0`.
- Bind port local vào `127.0.0.1`.
- Healthcheck MySQL và Redis.
- Kiểm tra endpoint MinIO, Mailpit Web và Mailpit SMTP.
- Bổ sung root scripts quản lý Docker.
- Không khởi tạo application framework hoặc code nghiệp vụ.

### File tạo

- `docker-compose.yml`
- `.env.example`
- `infra/README.md`

### File sửa

- `package.json`
- `docs/TRANG_THAI_DU_AN.md`
- `docs/BOI_CANH_DU_AN_CHO_GPT.md`
- `docs/NHAT_KY_PHIEN_AI.md`

### Dependency mới

Không có package Node mới.

### API mới

Không có.

### Database

Chưa tạo Prisma schema hoặc migration.
Chỉ tạo MySQL 8.4 LTS local bằng Docker.

### Test

- `docker compose config`: thành công.
- `docker compose pull`: thành công.
- `docker compose up -d`: thành công.
- MySQL healthcheck: healthy.
- Redis healthcheck: healthy.
- MinIO health endpoint: thành công.
- Mailpit Web: thành công.
- Mailpit SMTP: thành công.
- `docker compose ps`: thành công.
- `pnpm lint`: thành công.
- `pnpm typecheck`: thành công.
- `pnpm test`: thành công.
- `pnpm build`: thành công.
- `pnpm format:check`: thành công.
- `git diff --check`: thành công.

### Lỗi tồn đọng

Không có lỗi PHIEN-004.

### Phiên tiếp theo

PHIEN-005 – Khởi tạo Backend NestJS


---

## PHIEN-005 – Khởi tạo Backend NestJS

**Trạng thái:** Hoàn thành
**Ngày:** 28/08/2026

### Đã thực hiện

- Khởi tạo NestJS tại `apps/api`.
- Thiết lập ConfigModule.
- Thiết lập ValidationPipe toàn cục.
- Thiết lập Helmet.
- Thiết lập ThrottlerGuard toàn cục.
- Thiết lập Swagger UI `/docs`.
- Thiết lập OpenAPI JSON `/openapi-json`.
- Tạo `GET /api/v1/suc-khoe`.
- Tạo e2e test bằng Jest + Supertest.
- Cài Prisma 7.10.0 nhưng chưa init/schema/migration.
- Không code nghiệp vụ ngoài endpoint foundation.

### Dependency chính

- `@nestjs/common`: 11.2.3
- `@nestjs/core`: 11.2.3
- `@nestjs/platform-express`: 11.2.3
- `@nestjs/swagger`: 11.4.7
- `@nestjs/config`: 4.0.4
- `@nestjs/throttler`: 6.5.0
- `helmet`: 8.3.0
- `class-validator`: 0.15.1
- `class-transformer`: 0.5.1
- `@prisma/client`: 7.10.0
- `prisma`: 7.10.0
- `jest`: 29.7.0
- `supertest`: 7.2.2
- `typescript`: 6.0.3

### Supply-chain policy

- `strictDepBuilds: true`.
- `@scarf/scarf`: không cho chạy install script.
- Prisma engine/client và `esbuild`: cho phép build rõ ràng.
- Không dùng `dangerouslyAllowAllBuilds`.

### API mới

```text
GET /api/v1/suc-khoe
GET /docs
GET /openapi-json
```

### Database

Chưa tạo Prisma schema/migration và chưa kết nối MySQL.
Thực hiện ở PHIEN-006.

### Test

- `pnpm lint`: thành công.
- `pnpm typecheck`: thành công.
- `pnpm test`: thành công.
- `pnpm build`: thành công.
- `pnpm format:check`: thành công.
- `git diff --check`: thành công.
- Jest + Supertest e2e: thành công.
- Production runtime smoke: thành công.
- `/api/v1/suc-khoe`: HTTP 200.
- `/docs`: HTTP 200.
- `/openapi-json`: hợp lệ.

### Lỗi tồn đọng

Không có lỗi PHIEN-005.

### Phiên tiếp theo

PHIEN-006 – Kết nối Prisma + MySQL


---

## PHIEN-006 – Kết nối Prisma + MySQL

**Trạng thái:** Hoàn thành
**Ngày:** 28/08/2026

### Đã thực hiện

- Giữ Prisma 7.10.0 đã cài từ PHIEN-005.
- Thêm `@prisma/adapter-mariadb` 7.10.0.
- Thêm `dotenv` 17.4.2 cho `prisma7.config.ts`.
- Chạy `prisma init` với provider MySQL.
- Tạo `PrismaModule` và `PrismaService`.
- Dùng driver adapter bắt buộc của Prisma 7.
- Tạo shadow database local `agrimarket_shadow`.
- Tạo migration foundation rỗng, không có model nghiệp vụ.
- Generate Prisma Client vào `src/generated/prisma`, không commit generated code.
- `importFileExtension = ""` để generated TypeScript không import nhầm `.js` khi Jest chạy.
- Jest e2e bật `--experimental-vm-modules` để Prisma 7 WASM query compiler có thể dynamic import runtime.
- Kiểm tra kết nối MySQL thật bằng `SELECT 1`.
- Áp dụng migration foundation.

### Database

```text
Main:
mysql://agrimarket:***@127.0.0.1:3307/agrimarket

Shadow local:
mysql://agrimarket:***@127.0.0.1:3307/agrimarket_shadow
```

Credential thật không được commit ngoài local default đã công khai trong
`.env.example` cho Docker development.

### Test

- MySQL container healthy.
- `prisma validate`: thành công.
- `prisma generate`: thành công.
- Generated Prisma Client không còn relative import `.js`.
- Jest 29 + Prisma 7 chạy với `--experimental-vm-modules`.
- `prisma migrate dev`: thành công.
- `prisma migrate status`: thành công.
- PrismaService `SELECT 1`: thành công.
- `pnpm lint`: thành công.
- `pnpm typecheck`: thành công.
- `pnpm test`: thành công.
- `pnpm build`: thành công.
- production smoke test: thành công.
- `pnpm format:check`: thành công.
- `git diff --check`: thành công.

### Không làm trong phiên này

- Không tạo model nghiệp vụ.
- Không làm Auth/RBAC.
- Không khởi tạo Customer Web/Admin/Mobile.

### Phiên tiếp theo

PHIEN-007 – Khởi tạo Customer Web


---

## PHIEN-007 – Khởi tạo Customer Web

**Trạng thái:** Hoàn thành
**Ngày:** 28/08/2026

### Đã thực hiện

- Khởi tạo Next.js App Router tại `apps/customer-web`.
- React 19.2.8.
- Mantine Core/Hooks 9.5.2.
- TanStack Query 5.102.8.
- Zustand 5.0.15.
- Tạo theme Mantine.
- Tạo QueryClient provider.
- Tạo AppShell responsive.
- Dùng Zustand cho menu mobile của AppShell.
- Tạo error boundary cơ bản.
- Tạo trang chủ `/` bằng Mantine components.
- Không thêm CSS thủ công cho foundation.
- Không dùng `baseUrl` đã deprecated trong TypeScript 6.
- Alias `@/*` dùng `paths` trực tiếp tới `./src/*`.
- Typecheck chạy `next typegen && tsc --noEmit`; `next-env.d.ts` là generated file.

### Test

- `pnpm lint`: thành công.
- `pnpm typecheck`: thành công.
- Customer Web tsconfig không có `baseUrl` deprecated.
- `next typegen` sinh next-env.d.ts và file này bị Git/Prettier/ESLint ignore.
- `pnpm test`: thành công.
- `pnpm build`: thành công.
- `pnpm format:check`: thành công.
- `git diff --check`: thành công.
- Customer Web production runtime: thành công.
- `GET /`: HTTP 200.

### Không làm trong phiên này

- Không tích hợp Backend API.
- Không làm Auth/Cart/Checkout.
- Không khởi tạo Admin Web.
- Không khởi tạo Mobile.

### Phiên tiếp theo

PHIEN-008 – Khởi tạo Admin Web


---

## PHIEN-008 – Khởi tạo Admin Web

**Trạng thái:** Hoàn thành
**Ngày:** 28/08/2026

### Đã thực hiện

- Next.js 16.3.3 + React 19.2.8.
- Ant Design 5.29.3 stable.
- `@ant-design/v5-patch-for-react-19` 1.0.3.
- ProComponents 2.8.10 stable.
- Ant Design Next.js Registry 1.3.0.
- TanStack Query 5.102.8.
- ConfigProvider + QueryClientProvider.
- ProLayout và sidebar placeholder.
- Dashboard dùng ProComponents được đánh dấu Client Component.
- Dashboard placeholder `/`.
- Login placeholder `/dang-nhap`.
- Error boundary cơ bản.
- `next typegen && tsc --noEmit`.
- Không dùng `baseUrl` deprecated.
- Không commit `next-env.d.ts`.

### Test

- `pnpm lint`: thành công.
- `pnpm typecheck`: thành công.
- `pnpm test`: thành công.
- `pnpm build`: thành công.
- Checker RSC: mọi file import ProComponents đều là Client Component.
- `pnpm format:check`: thành công.
- `git diff --check`: thành công.
- Admin production runtime: thành công.
- `GET /`: HTTP 200.
- `GET /dang-nhap`: HTTP 200.

### Không làm trong phiên này

- Không làm Auth/RBAC thật.
- Không gọi Backend API.
- Không làm nghiệp vụ quản trị.
- Không khởi tạo Mobile.

### Phiên tiếp theo

PHIEN-009 – Khởi tạo Mobile Expo


---

## PHIEN-009 – Khởi tạo Mobile Expo

**Trạng thái:** Hoàn thành foundation
**Ngày:** 29/08/2026

### Đã thực hiện

- Expo SDK 57: `~57.0.18`.
- React Native: `0.86.3`.
- React: `19.2.3`.
- Expo Router: `~57.0.17`.
- gluestack-ui v5 core: `^5.0.15`.
- UniWind: `^1.11.0`.
- TanStack Query + Zustand.
- cấu trúc `src/app` của Expo SDK 57.
- `(auth)` + `(tabs)` + 5 tab.
- login placeholder.
- TypeScript strict.
- CSS/CSS Module declarations cho TypeScript 6.
- `metro.config.js` giữ CommonJS theo convention Expo/Metro; ESLint exception chỉ áp dụng cho file Metro.
- Generated gluestack UI được giữ ngoài Prettier nhưng phải sạch trailing whitespace trước commit.
- API e2e dùng MySQL thật: kiểm tra container healthy + SELECT 1 trước test; beforeAll/afterAll có timeout 20 giây để tránh false failure do cold-start.
- Dùng template Expo và gluestack CLI chính thức.
- Chỉ giữ gluestack components cần thiết; loại bỏ UI demo mặc định của Expo.

### Kiểm tra

- Expo Doctor: thành công.
- Native module duplicate check: sạch.
- `react-native-svg` được pin exact theo Expo SDK để pnpm workspace không nâng sai patch.
- TypeScript: thành công.
- Metro smoke: thành công.
- Android export: thành công.
- `pnpm lint`: thành công.
- `pnpm typecheck`: thành công.
- `pnpm test`: thành công.
- `pnpm build`: thành công.
- `pnpm format:check`: thành công.
- `git diff --check`: thành công.

### Ghi chú

Repo local có dấu cách trong tên thư mục. gluestack-ui docs cảnh báo UniWind/Expo
có thể kẹt bundler khi path có dấu cách. Automation validate ở `/tmp` không dấu
cách và không tự ý rename repo.

### Phiên tiếp theo

PHIEN-010 – Swagger → Orval → FE client


---

## PHIEN-010 – Swagger → Orval → FE client

**Trạng thái:** Hoàn thành
**Ngày:** 29/08/2026

### Đã thực hiện

- Cố định Swagger operationId `layTrangThaiSucKhoe`.
- E2E kiểm tra operationId của OpenAPI contract.
- Tạo OpenAPI snapshot versioned.
- Orval 8.26.0.
- React Query generator + Fetch HTTP client.
- Không thêm Axios.
- Tạo runtime API base URL.
- Customer/Admin/Mobile cùng dùng `@agrimarket/api-client`.
- Tích hợp health hook tối thiểu vào cả 3 frontend.
- Cấu hình CORS local cho hai web app.
- Customer dev 3001, Admin dev 3002.

### Kiểm tra

- Snapshot có `/api/v1/suc-khoe`.
- E2E contract có `operationId=layTrangThaiSucKhoe`.
- Orval generate thành công.
- Có `layTrangThaiSucKhoe`.
- Có `useLayTrangThaiSucKhoe`.
- Generated client gọi Backend thật thành công.
- CORS local thành công.
- `pnpm lint`: thành công.
- `pnpm typecheck`: thành công.
- `pnpm test`: thành công.
- `pnpm build`: thành công.
- `pnpm format:check`: thành công.
- `git diff --check`: thành công.

### Quy tắc codegen

`packages/api-client/generated/` không commit; `pnpm --filter @agrimarket/api-client ensure` sẽ sinh lại khi thiếu.
`packages/api-client/openapi/agrimarket.json` là snapshot contract được commit.

Khi Swagger thay đổi:

```text
Backend chạy
→ pnpm api-client:snapshot
→ pnpm api-client:generate
→ pnpm typecheck
```

### Phiên tiếp theo

PHIEN-011 – Thiết kế Prisma schema nền tảng


---

## Mẫu cho phiên tiếp theo

```markdown
## PHIEN-XXX – Tên phiên

**Trạng thái:** Hoàn thành / Có vấn đề
**Ngày:** DD/MM/YYYY

### Đã thực hiện
- ...

### File tạo
- ...

### File sửa
- ...

### Test
- ...

### Lỗi tồn đọng
- ...

### Phiên tiếp theo
PHIEN-YYY
```

---

## PHIEN-012 – Module xác thực

**Ngày:** 29/08/2026

### Đã làm

- Auth module NestJS.
- Argon2id.
- Access JWT + refresh rotation.
- HttpOnly cookie cho Web.
- Refresh token JSON cho Mobile.
- Logout, đổi mật khẩu.
- Forgot/reset password qua Mailpit.
- Migration `20260829012411_phien012_xac_thuc`.
- Cập nhật Swagger/OpenAPI/Orval.
- E2E MySQL + Mailpit.
- Quality gate toàn monorepo.

### Không làm

- Chưa RBAC/PermissionGuard.
- Chưa UI đăng nhập thật ở 3 frontend.
- Chưa OAuth/social login.

### Phiên tiếp theo

PHIEN-013 – RBAC


---

## PHIEN-014 – Audit Log

**Ngày:** 29/08/2026

### Đã làm

- Tạo Audit Log append-only.
- Migration `20260829014635_phien014_audit_log`.
- `audit.xem` cho ADMIN.
- Gán role + audit atomic.
- API đọc filter/pagination.
- E2E 403 + no-secret.
- OpenAPI/Orval.

### Phiên tiếp theo

PHIEN-015 – Upload file


---

## PHIEN-016 – Redis + BullMQ nền tảng

**Ngày:** 29/08/2026

### Đã làm

- RedisService cache foundation.
- Data-repair migration `20260829133756_phien016_sua_audit_rbac` sửa ADMIN -> audit.xem.
- Giữ strictDepBuilds; deny build script optional msgpackr-extract@3.0.4.
- `@nestjs/bullmq` 11.0.4.
- BullMQ 5.58.0.
- ioredis 5.11.1.
- Queue email/notification/system-job.
- Producer + worker foundation.
- Retry/backoff/retention defaults.
- Email test job gửi Mailpit thật.
- E2E Redis/BullMQ.
- Quality gate toàn monorepo.

### Không làm

- Chưa chuyển Auth email sang queue.
- Chưa notification nghiệp vụ.
- Chưa system-job nghiệp vụ.
- Chưa module Nhà cung cấp.

### Phiên tiếp theo

PHIEN-017 – Nhà cung cấp


---

## PHIEN-018 – Trang trại

**Ngày:** 29/08/2026

### Đã làm

- Migration `20260829150744_phien018_trang_trai`.
- Model Trang trại + bảng ảnh.
- Quan hệ Trang trại → Nhà cung cấp.
- GPS/địa chỉ/diện tích/trạng thái.
- 4 permission + least-privilege mapping.
- Backend CRUD/search/pagination/filter.
- Ảnh dùng TepTin/MinIO private + signed URL.
- Public farm detail không cần đăng nhập.
- Audit mutation.
- Swagger/OpenAPI/Orval.
- Admin ProTable/Detail/Create/Edit/upload ảnh/lock.
- Full E2E + monorepo quality gate.

### Không làm

- Chưa Chứng nhận.
- Chưa Mùa vụ.
- Chưa Nhật ký canh tác.

### Phiên tiếp theo

PHIEN-019 – Chứng nhận


---

## PHIEN-020 – Mùa vụ

**Ngày:** 29/08/2026

### Đã làm

- Migration `20260829155236_phien020_mua_vu`.
- Enum + model Mùa vụ.
- Quan hệ Mùa vụ → Trang trại.
- Cây trồng/giống/ngày trồng/ngày dự kiến thu hoạch/sản lượng dự kiến kg.
- 3 permission + 6 mapping Nhân viên/Admin.
- Backend list/detail/create/update.
- Search/pagination/filter.
- Audit tạo/sửa.
- Swagger/OpenAPI/Orval.
- Admin ProTable/Create/Edit/Detail Timeline.
- Full E2E + monorepo quality gate.

### Không làm

- Chưa Thu hoạch thực tế.
- Chưa Nhật ký canh tác.
- Chưa Lô.

### Phiên tiếp theo

PHIEN-021 – Thu hoạch


---

## PHIEN-021 – Nhật ký canh tác

**Ngày:** 29/08/2026

### Đã làm

- Migration `20260829163213_phien021_nhat_ky_canh_tac`.
- Enum + model Nhật ký canh tác.
- Quan hệ Nhật ký canh tác → Mùa vụ.
- 6 loại event theo master plan.
- Thời gian/nội dung/`hienThiCongKhai`.
- 3 permission + 6 mapping Nhân viên/Admin.
- Backend list/detail/create/update.
- Search/pagination/filter.
- Audit tạo/sửa.
- Swagger/OpenAPI/Orval.
- Admin ProTable/Create/Edit/Detail + public Switch.
- Sửa trạng thái phiên tiếp theo bị lệch sau PHIEN-020.
- Full E2E + monorepo quality gate.

### Không làm

- Chưa Thu hoạch.
- Chưa Lô.
- Chưa public trace API.

### Phiên tiếp theo

PHIEN-022 – Thu hoạch


---

## PHIEN-023 – Lô sản phẩm

**Ngày:** 30/08/2026

### Đã làm

- Migration `20260830003155_phien023_lo_san_pham`.
- Enum + model Lô sản phẩm.
- Lô → Thu hoạch.
- `maLo/quantity/remaining/qualityGrade/expiryDate/status`.
- 3 permission + 6 mapping Nhân viên/Admin.
- Tạo Lô chỉ từ Thu hoạch.
- Tổng quantity Lô không vượt Thu hoạch.
- `FOR UPDATE` chống race condition phân bổ quantity.
- `remaining = quantity`, `qualityGrade = null`.
- Chỉ sửa Lô `MOI_TAO`.
- Action `MOI_TAO -> CHO_KIEM_DINH`.
- Row lock khi sửa/gửi kiểm định.
- Audit tạo/sửa/gửi kiểm định.
- Swagger/OpenAPI/Orval.
- Admin ProTable/Detail/Edit/Gửi kiểm định.
- Nối action Tạo lô vào màn hình Thu hoạch.
- Full E2E + monorepo quality gate.

### Không làm

- Chưa Kiểm định chất lượng.
- Chưa QR.
- Chưa Truy xuất.
- Chưa Kho/Tồn kho.

### Phiên tiếp theo

PHIEN-024 – Kiểm định chất lượng


---

## PHIEN-025 – QR Code

**Ngày:** 30/08/2026

### Đã làm

- Migration `20260830151944_phien025_qr_code`.
- `LoSanPham.maTruyXuat` nullable + unique.
- Stable trace code `AGM-` + 32 hex.
- QR payload chỉ bằng trace identifier.
- Generate QR idempotent.
- GET QR hiện có.
- Row lock Lô chống race condition.
- PNG data URL + SVG bằng `qrcode`.
- 2 permission + 4 mapping Nhân viên/Admin.
- Audit tạo stable trace code.
- Swagger/OpenAPI/Orval.
- Admin preview/download PNG/download SVG/print.
- Không tạo menu QR riêng.
- Full E2E + monorepo quality gate.

### Không làm

- Chưa Trace Events.
- Chưa API truy xuất công khai.
- Chưa public trace UI.
- Chưa Sản phẩm/Kho.

### Phiên tiếp theo

PHIEN-026 – Trace Events

---

## PHIEN-026 – Trace Events

**Trạng thái:** Hoàn thành

**Ngày:** 30/08/2026

### Đã làm

- Migration `20260830164414_phien026_su_kien_truy_xuat`.
- Enum `LoaiSuKienTruyXuat` đủ 7 loại:
  - `CANH_TAC`;
  - `THU_HOACH`;
  - `KIEM_DINH`;
  - `DONG_GOI`;
  - `NHAP_KHO`;
  - `XUAT_KHO`;
  - `GIAO_HANG`.
- Model `SuKienTruyXuat` gắn với `LoSanPham`.
- Fields:
  - `loSanPhamId`;
  - `loai`;
  - `thoiGian`;
  - `diaDiem`;
  - `metadata`;
  - `congKhai`.
- `congKhai` mặc định `false`.
- Ledger append-only: list/detail/create, không PATCH/DELETE.
- Timeline mặc định tăng dần theo thời gian.
- Filter theo Lô/loại/công khai.
- Search theo mã Lô/địa điểm/cây trồng/trang trại.
- Validation thời gian theo Mùa vụ/Thu hoạch.
- Metadata JSON object tối đa 8 KiB.
- 2 permission:
  - `su_kien_truy_xuat.xem`;
  - `su_kien_truy_xuat.tao`.
- Nhân viên/Admin có quyền xem/tạo.
- Khách hàng không có quyền quản trị.
- Audit `SU_KIEN_TRUY_XUAT_TAO`.
- Swagger/OpenAPI + Orval.
- Reusable OpenAPI enum `LoaiSuKienTruyXuat` đủ 7 giá trị.
- Admin `/su-kien-truy-xuat`:
  - ProTable;
  - Create;
  - Detail;
  - metadata JSON;
  - công khai Switch.
- Sửa regression QR PHIEN-025:
  - thay interactive transaction/FOR UPDATE bằng atomic compare-and-set;
  - giữ concurrency hai request nhận cùng một mã và chỉ một Audit;
  - QR E2E đóng HTTP idle/all connections trước `app.close()`.
- Full backend typecheck.
- 17/17 E2E suites pass.
- 143/143 tests pass.
- Full monorepo quality gate pass.
- Không thêm dependency.

### Không làm

- Chưa API truy xuất công khai.
- Chưa Customer Web/Mobile public trace.
- Chưa Sản phẩm/Kho/Tồn kho/FEFO.

### Phiên tiếp theo

PHIEN-027 – API truy xuất công khai


---

## PHIEN-027 – API truy xuất công khai

**Trạng thái:** Hoàn thành

**Ngày:** 31/08/2026

### Đã làm

- Public `GET /api/v1/truy-xuat/:ma`.
- Lookup bằng stable `LoSanPham.maTruyXuat`.
- Không JWT/RBAC.
- Explicit response whitelist.
- Public Lô/Trang trại/Mùa vụ/Thu hoạch.
- Chỉ chứng nhận `DA_XAC_MINH`, không public document.
- Kiểm định không lộ người kiểm định/ghi chú/ảnh.
- Chỉ Nhật ký canh tác `hienThiCongKhai=true`.
- Chỉ Trace Event `congKhai=true`.
- Không trả Trace Event `metadata`.
- Không trả quantity/remaining/GPS/supplier/internal IDs.
- E2E seed dữ liệu nhạy cảm và xác nhận không leak.
- Swagger/OpenAPI public operation không bearer security.
- Orval `layTruyXuatCongKhai`.
- Full monorepo quality gate.
- Không migration/dependency/permission mới.

### Không làm

- Chưa Customer Trace Web/Mobile.
- Chưa Thu hồi lô.
- Chưa Sản phẩm/Kho/Tồn kho/FEFO.

### Phiên tiếp theo

PHIEN-028 – Thu hồi lô


---

## PHIEN-028 – Thu hồi lô

**Trạng thái:** Hoàn thành

**Ngày:** 31/08/2026

### Đã làm

- `ThuHoiLoSanPham` ledger 1:1 với Lô.
- `lo_san_pham.thu_hoi` chỉ ADMIN.
- `POST /api/v1/lo-san-pham/:id/thu-hoi`.
- Atomic `FOR UPDATE` + ledger + `THU_HOI` + Audit.
- Recall terminal, không PATCH/DELETE/undo.
- Concurrency chỉ tạo một recall.
- `RECALLED` của Kiểm định dùng cùng permission/ledger.
- Public trace thêm warning `thuHoi`.
- Public warning không lộ lý do nội bộ/actor.
- Legacy `THU_HOI` có generic warning.
- Admin có danger recall modal + detail.
- OpenAPI/Orval.
- Full isolated E2E + Redis/BullMQ namespace isolation.
- Không thêm dependency.

### Phụ thuộc được hoãn đúng master plan

- Allocation thực tế: PHIEN-050 mới có Inventory Reservation.
- Order affected: PHIEN-051/052 mới có Order schema/Create Order.
- Customer notification theo order: nối sau khi Order tồn tại.
- Customer Trace Web recall alert: PHIEN-046.

### Không làm

- Không invent Product/Inventory/Order schema sớm.
- Chưa Customer Trace Web.
- Chưa Catalog.

### Phiên tiếp theo

PHIEN-029 – Danh mục sản phẩm


---

## PHIEN-029 – Danh mục sản phẩm

**Trạng thái:** Hoàn thành

**Ngày:** 31/08/2026

### Đã làm

- `DanhMucSanPham` với parent tùy chọn.
- Slug unique lowercase kebab-case.
- Status `TrangThaiBanGhi`.
- Ảnh qua `TepTin` hoạt động.
- Chặn self-parent và hierarchy cycle.
- 4 permissions / 7 mappings.
- Backend list/detail/create/update/status.
- Audit create/update/status.
- Admin ProTable + create/edit + parent + image upload/preview + status.
- Swagger/OpenAPI + Orval.
- Full isolated E2E + Redis/BullMQ namespace isolation.
- Không dependency mới.

### Không làm

- Không Product model/API trước phase kế tiếp.
- Không Customer/Mobile catalog UI.

### Phiên tiếp theo

PHIEN-030 – Sản phẩm


---

## PHIEN-030 – Sản phẩm

**Trạng thái:** Hoàn thành

**Ngày:** 31/08/2026

### Đã làm

- Model `SanPham`: tên, mô tả, farm, category, status.
- Product ≠ Batch.
- Farm/category bắt buộc hoạt động khi tạo/chuyển reference.
- 4 permissions / 8 mappings = KHACH_HANG 1 + NHAN_VIEN 3 + ADMIN 4.
- Protected API list/detail/create/update/status.
- Audit create/update/status.
- Admin ProTable + farm/category select + create/edit/status.
- Swagger/OpenAPI + Orval.
- Full isolated E2E tối thiểu 21 suites.
- Giữ QR teardown hardening.
- Không dependency mới.

### Không làm

- Không SKU/biến thể/giá/đơn vị trước PHIEN-031.
- Không ảnh sản phẩm trước PHIEN-032.
- Không public product API trước PHIEN-033.
- Không nối Product với Batch ở PHIEN-030.

### Phiên tiếp theo

PHIEN-031 – Biến thể và giá


---

## PHIEN-031 – Biến thể và giá

**Trạng thái:** Hoàn thành

**Ngày:** 31/08/2026

### Đã làm

- Model `BienTheSanPham`.
- SKU unique.
- Quy cách `khoiLuong + donVi` hỗ trợ 500g/1kg/2kg.
- Giá catalog hiện tại.
- Dùng lại RBAC `san_pham.*`, không tạo permission mới.
- Protected API list/create/update Variant.
- Audit create/update, lưu giá trước/sau.
- Admin quản lý Variant ngay trong Product page.
- Swagger/OpenAPI + Orval.
- Full isolated E2E tối thiểu 22 suites.
- Giữ QR teardown hardening.
- Không dependency mới.

### Rule phải giữ

Giá Order phải snapshot khi đặt hàng.
PHIEN-031 không tạo Order/OrderItem sớm; snapshot được implement ở phase Checkout/Order.

### Không làm

- Không ảnh sản phẩm trước PHIEN-032.
- Không public Product API trước PHIEN-033.
- Không nối Product/Variant với Batch.

### Phiên tiếp theo

PHIEN-032 – Ảnh sản phẩm


---

## PHIEN-032 – Ảnh sản phẩm

**Trạng thái:** Hoàn thành

**Ngày:** 31/08/2026

### Đã làm

- Model `SanPhamAnh` liên kết Product ↔ TepTin.
- Multiple upload bằng hạ tầng `TepTin`/MinIO hiện có.
- Cover image.
- Sort order bằng `thuTu`.
- Delete association, không xóa vật lý `TepTin`.
- Chỉ nhận JPEG/PNG/WebP đang hoạt động và thuộc actor tải lên.
- Dùng lại RBAC `san_pham.xem/sua`, không tạo permission ảnh riêng.
- Protected API list/attach/cover/reorder/delete.
- Audit add/cover/sort/delete.
- Admin quản lý ảnh ngay trong Product page.
- Swagger/OpenAPI + Orval.
- Full isolated E2E tối thiểu 23 suites.
- Giữ Variant PHIEN-031 và QR teardown hardening.
- Không dependency mới.

### Boundary phải giữ

- Product ≠ Batch.
- Giá Order phải snapshot khi đặt hàng.
- Không tạo Order/OrderItem/Inventory sớm.
- Public Product API thuộc PHIEN-033.

### Phiên tiếp theo

PHIEN-033 – API public sản phẩm

---

## PHIEN-033 – API public sản phẩm

**Trạng thái:** Hoàn thành
**Ngày:** 31/08/2026

### Đã thực hiện

- Mở public Product list/detail/category/farm/related không cần JWT.
- Public whitelist chỉ lấy Product/Farm/Supplier/Category hoạt động và Product có Variant.
- Response có giá, Farm, certificate badges, signed image, harvest context của Farm và availability trung thực.
- Không tạo relation giả Product ↔ Batch/Harvest.
- Không bịa tồn kho trước InventoryLot: số lượng khả dụng `null`, chưa cho đặt hàng.
- Giữ protected Product/Variant/Image API và RBAC hiện tại.
- Không đổi Prisma schema/migration, không dependency mới.
- Swagger/OpenAPI và Orval đã cập nhật.
- Supersede 4 stale E2E boundary public Product 404 → 200.

### Test

- Public Product focused E2E: PASS.
- Product/Variant/Image/Category regression: PASS.
- Full API E2E isolated: tối thiểu 24 suites PASS.
- lint/typecheck/build/format: PASS.

### Phiên tiếp theo

```text
PHIEN-034 – Kho
```

---

## PHIEN-034 – Kho

**Trạng thái:** Hoàn thành
**Ngày:** 31/08/2026

### Đã thực hiện

- Tạo model Kho: maKho / ten / diaChi / status.
- Tạo protected CRUD list/detail/create/update/status; không DELETE.
- Seed RBAC Kho riêng theo least privilege.
- Mutation Kho có Audit.
- Tạo Admin Web quản lý Kho bằng ProTable/ModalForm.
- Swagger/OpenAPI và Orval đã cập nhật.
- Supersede public Product boundary: có bảng Kho nhưng chưa InventoryLot.
- Không tạo relation Kho ↔ Batch/Variant và không tạo quantity/ledger/FEFO/Order sớm.

### Test

- Kho focused E2E: PASS.
- Public Product boundary: PASS.
- Full API E2E isolated: tối thiểu 25 suites PASS.
- lint/typecheck/build/format: PASS.

### Phiên tiếp theo

```text
PHIEN-035 – InventoryLot
```

---

## PHIEN-035 – InventoryLot

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Tạo InventoryLot/TonKhoLo theo Kho + Lô + Biến thể.
- Lưu onHand/reserved/blocked; available là giá trị dẫn xuất.
- DB CHECK giữ available không âm.
- Không seed permission mới; read dùng kho.xem.
- API /ton-kho read-only list/detail.
- Public Product availability chuyển từ placeholder sang tồn thật hợp lệ.
- Admin Web có trang Tồn kho read-only.
- Swagger/OpenAPI và Orval đã cập nhật.
- Supersede Kho/public Product boundary PHIEN-034.
- Không tạo ledger/movement/FEFO/Order sớm.

### Test

- Tồn kho E2E 9/9: PASS.
- Kho + public Product focused boundary: PASS.
- Full API E2E isolated: tối thiểu 26 suites PASS.
- lint/typecheck/build/format: PASS.

### Phiên tiếp theo

```text
PHIEN-036 – Inventory Transaction Ledger
```

---

## PHIEN-036 – Inventory Transaction Ledger

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Tạo enum 10 loại Inventory Transaction đúng master.
- Tạo GiaoDichTonKho/inventory_transaction gắn với TonKhoLo.
- Ledger không có updatedAt.
- CHECK quantity theo loại; ADJUSTMENT hỗ trợ signed non-zero.
- DB trigger cấm UPDATE/DELETE ledger cũ.
- API ledger read-only list/detail dùng kho.xem.
- Không seed permission mới.
- Admin Web có trang ledger read-only.
- Swagger/OpenAPI và Orval đã cập nhật.
- Supersede 3 stale boundary PHIEN-035.
- Không mutate InventoryLot khi append ledger trực tiếp.
- Không làm movement/FEFO/Order sớm.

### Test

- Ledger E2E 9/9: PASS.
- TonKho + Kho + public Product focused boundary: PASS.
- Full API E2E isolated: tối thiểu 27 suites PASS.
- lint/typecheck/build/format: PASS.

### Phiên tiếp theo

```text
PHIEN-037 – Nhập/Xuất/Chuyển kho
```

---

## PHIEN-037 – Nhập/Xuất/Chuyển kho

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Tạo 3 API movement nhập/xuất/chuyển.
- InventoryLot state + immutable ledger cùng DB transaction.
- Nhập dùng HARVEST_IN.
- Xuất dùng TRANSFER_OUT.
- Chuyển dùng TRANSFER_OUT + TRANSFER_IN.
- Conditional available update chống race/oversell.
- reserved/blocked không bị movement sửa.
- Mutation dùng ton_kho.dieu_chinh, không seed permission mới.
- Admin dùng ProForm.
- Không làm ADJUSTMENT/Audit/FEFO/Order sớm.

### Phiên tiếp theo

```text
PHIEN-038 – Điều chỉnh tồn kho
```

---

## PHIEN-038 – Điều chỉnh tồn kho

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Tạo POST /api/v1/ton-kho/:id/dieu-chinh.
- Body onHandMoi + lyDo bắt buộc.
- Dùng signed ADJUSTMENT ledger đã có, không sửa ledger cũ.
- InventoryLot + ledger + Audit Log cùng DB transaction.
- Audit đủ reason/actor/timestamp/before/after.
- Audit metadata có IP/userAgent/lyDo/delta/giaoDichId.
- Không sửa reserved/blocked.
- Reject no-op và onHand mới thấp hơn reserved + blocked.
- Optimistic conditional update chống silent lost-update.
- Admin /ton-kho thêm ProForm adjustment.
- Không schema/migration/permission mới.
- Không làm FEFO/Order sớm.

### Phiên tiếp theo

```text
PHIEN-039 – FEFO
```

---

## PHIEN-039 – FEFO

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Tạo `FefoService` nội bộ và export từ `TonKhoModule`.
- Lọc đúng rule public stock: Kho HOAT_DONG, Lô CO_THE_BAN, chưa hết hạn.
- Available = onHand - reserved - blocked.
- Sort expiry ASC với tie-break deterministic.
- Allocate từ nhiều batch/InventoryLot.
- Hỗ trợ filter khoId optional.
- Reject thiếu tồn hợp lệ, không trả partial.
- FEFO chỉ read-only planner: không mutate InventoryLot, không ghi ledger.
- Không ORDER_RESERVE/API/Admin/schema/migration.
- E2E kiểm tra batch invalid, multi-batch, warehouse filter và read-only.
- Không làm cảnh báo hết hạn sớm của PHIEN-040.

### Phiên tiếp theo

```text
PHIEN-040 – Cảnh báo hàng sắp hết hạn
```

---

## PHIEN-040 – Cảnh báo hàng sắp hết hạn

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Tạo CanhBaoHetHanTonKhoService.
- Mốc near-expiry mặc định 7 ngày.
- Tạo daily BullMQ system-job lúc 01:10.
- HeThongWorker trả count near-expiry/expired.
- API read-only GET /api/v1/ton-kho/canh-bao-het-han.
- API dùng kho.xem, không permission mới.
- Admin dashboard hiển thị metric + alert + danh sách.
- Alert dựa trên InventoryLot onHand > 0.
- Hạn hôm nay vẫn là sắp hết hạn.
- Không mutation lô, không EXPIRE ledger, không email/notification.
- Không schema/migration mới.

### Phiên tiếp theo

```text
PHIEN-041 – Customer Web layout + Design System
```

---

## PHIEN-041 – Customer Web layout + Design System

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Refactor Customer Web AppShell thành reusable layout.
- Tạo AgriHeader responsive.
- Tạo AgriFooter responsive.
- Tạo AgriContainer.
- Chuẩn hóa Mantine theme với palette agrimarket.
- Tạo ProductCard presentational.
- Tạo FarmCard presentational.
- Tạo AgriBadge.
- Trang `/` là Design System preview để kiểm visual primitives.
- Không gọi Product API, chưa làm Home thật.
- Không thêm dependency.
- Không đổi Backend/Admin/Mobile/OpenAPI/Prisma.

### Phiên tiếp theo

```text
PHIEN-042 – Trang chủ Customer Web
```

---

## PHIEN-041 – Fix-forward Design States

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Lý do

Exact master PHIEN-041 còn 3 primitive chưa có trong commit chính:
`Skeleton`, `EmptyState`, `ErrorState`.

### Đã bổ sung

- `AgriSkeleton`.
- `EmptyState`.
- `ErrorState`.
- Design System preview hiển thị đủ state primitives.
- Không amend/force-push commit PHIEN-041 đã public.
- Không đổi Backend/Admin/Mobile/OpenAPI/Prisma/dependency.
- PHIEN-041 sau fix-forward đáp ứng đủ 10 primitive master.

### Phiên tiếp theo

```text
PHIEN-042 – Trang chủ Customer Web
```

---

## PHIEN-042 – Trang chủ Customer Web

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Xây Hero.
- Derive Danh mục từ public Product feed.
- Xây Mới thu hoạch bằng Product detail harvest data thật.
- Xây Organic từ certificate badges.
- Xây Trang trại nổi bật rule-based.
- Xây Theo mùa bằng category diversity rule-based.
- Xây Gợi ý rule-based.
- Reuse AgriSkeleton/EmptyState/ErrorState.
- Dùng Orval + TanStack Query generated hooks.
- Không thêm Backend endpoint hay dependency.
- Chưa làm Search/List/Filter/URL state.

### Phiên tiếp theo

```text
PHIEN-043 – Search/List/Filter
```

---

## PHIEN-043 – Search/List/Filter

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Mở rộng public Product query DTO.
- Server-side keyword/category/price/farm/province/certificate/harvest date.
- Availability theo tồn khả dụng thật.
- Sort trước pagination.
- Tạo `/san-pham`.
- URL query string giữ filter state.
- Rating control disabled vì chưa có data model.
- Focused E2E + public Product regression.
- Refresh OpenAPI + Orval.
- Không schema/migration.
- Chưa Product Detail.

### Phiên tiếp theo

```text
PHIEN-044 – Product Detail
```

---

## PHIEN-044 – Product Detail

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Tạo `/san-pham/[id]`.
- Gallery tương tác.
- Giá theo biến thể.
- Variant selector.
- Stock theo `soLuongKhaDung`.
- Farm section + backlink về PHIEN-043 filter.
- Harvest.
- Certificate.
- Trace section giữ Product ≠ Batch.
- Review EmptyState vì chưa có Review Backend.
- Related products từ public related endpoint.
- Không Backend/OpenAPI/schema/dependency.
- Chưa Cart/Checkout và chưa Farm Detail.

### Phiên tiếp theo

```text
PHIEN-045 – Farm Detail
```

---

## PHIEN-045 – Farm Detail

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Enrich public Farm detail bằng chứng nhận hợp lệ + mùa vụ.
- Focused public Farm E2E.
- Refresh OpenAPI + Orval.
- Tạo `/trang-trai/[id]`.
- Tabs Giới thiệu/Sản phẩm/Chứng nhận/Mùa vụ/Đánh giá.
- Review dùng EmptyState vì chưa có Review Backend.
- Không Trace Web sớm.
- Không schema/migration/dependency.

### Phiên tiếp theo

```text
PHIEN-046 – Trace Web
```

---

## PHIEN-046 – Trace Web

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Tạo `/truy-xuat`.
- Form nhập mã + URL query state.
- Public trace hook.
- Batch.
- Farm.
- Certificate.
- Timeline hợp nhất dữ liệu công khai.
- Recall alert.
- Loading/empty/error state.
- Không Backend/OpenAPI/schema/dependency.
- Chưa Cart Backend.

### Phiên tiếp theo

```text
PHIEN-047 – Cart Backend
```

---

## PHIEN-047 – Cart Backend

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Prisma `GioHang` -> `cart`.
- Prisma `MucGioHang` -> `cart_item`.
- Một customer một active cart bằng unique constraint.
- Item unique theo cart + variant.
- Authenticated GET/add/update/remove API.
- Add cùng variant cộng quantity.
- Validate quantity theo tồn khả dụng hiện tại.
- Không inventory reservation trong Cart.
- Response có current price/stock/farm/supplier.
- Focused E2E.
- OpenAPI + Orval Cart hooks.
- Đúng một migration.

### Phiên tiếp theo

```text
PHIEN-048 – Cart Customer Web
```

---

## PHIEN-048 – Cart Customer Web

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Login bridge khách hàng dùng Auth Backend WEB.
- SessionStorage access token + bearer helper.
- Cart API wrapper từ generated client.
- `/gio-hang`.
- Add selected Product variant + quantity.
- Update quantity.
- Remove item.
- Group supplier.
- Backend sync/refetch bằng TanStack Query.
- Header link Giỏ hàng.
- Không guest cart.
- Không Checkout Preview/Reservation sớm.
- Không Backend/OpenAPI/schema/dependency.

### Phiên tiếp theo

```text
PHIEN-049 – Checkout Preview
```

---

## PHIEN-049 – Checkout Preview

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Authenticated `GET /gio-hang/checkout-preview`.
- Backend đọc current cart/current price/current availability.
- Tính item line total + subtotal.
- Trả đủ items/price/promotion/shipping/points/total.
- Không fake promotion/shipping/points khi chưa có source-of-truth module.
- `tongThanhToan` nullable và chưa xác nhận.
- Preview read-only, không reserve inventory.
- Focused E2E.
- OpenAPI + Orval `useLayCheckoutPreview`.
- Không schema/migration.
- Không Customer/Admin/Mobile changes.

### Phiên tiếp theo

```text
PHIEN-050 – Inventory Reservation
```

---

## PHIEN-050 – Inventory Reservation

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Durable reservation + allocation-by-lot schema.
- FEFO `FOR UPDATE`.
- available -> reserve.
- `ORDER_RESERVE`.
- TTL persisted + delayed BullMQ + recovery sweep.
- expire/release -> `ORDER_RELEASE`.
- sold -> `ORDER_SHIP`.
- 10 concurrent caller tranh một hàng cuối.
- Focused + FEFO + ledger regression E2E.
- Đúng một migration.
- Không public API/Customer/Admin/Mobile.
- Chưa Order.

### Phiên tiếp theo

```text
PHIEN-051 – Order schema
```

---

## PHIEN-051 – Order schema

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- `DonHang` -> `order`.
- `DonHangNhaCungCap` -> `supplier_order`.
- `MucDonHang` -> `order_item`.
- `PhanBoDonHang` -> `order_allocation`.
- Order state theo state diagram UML.
- Snapshot price/product name/variant/farm.
- Allocation nối OrderItem với InventoryLot/Batch.
- DB unique/check constraints.
- Focused schema E2E chứng minh snapshot bất biến.
- Đúng một migration.
- Không Order service/API/Create transaction.
- Không Payment/Shipment/UI/OpenAPI.

### Phiên tiếp theo

```text
PHIEN-052 – Create Order
```

---

## PHIEN-052 – Create Order

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Authenticated POST `/don-hang`.
- `maYeuCau` UUID idempotency.
- Validate exact cart/quantity/current price.
- FEFO Inventory Reservation.
- Lock/revalidate cart sau reserve.
- Create Order transaction.
- Supplier split.
- Order item snapshot.
- Allocation từ reservation lot.
- Release reservation nếu create transaction rollback.
- Focused Create Order E2E + Reservation/Order regression.
- OpenAPI + Orval `useTaoDonHang`.
- Không schema/migration mới.
- Chưa Payment/Shipment/State Machine.

### Phiên tiếp theo

```text
PHIEN-053 – Payment Domain
```

---

## PHIEN-053 – Payment Domain

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- `ThanhToan` -> `payment`.
- `GiaoDichThanhToan` -> `payment_transaction`.
- Payment liên kết Order.
- Lưu amount/method/status.
- Transaction lưu code/amount/method/time/status.
- Exact state:
  CREATED/PENDING/PAID/FAILED/CANCELLED/
  PARTIALLY_REFUNDED/REFUNDED.
- Transaction code unique.
- Amount > 0 DB CHECK.
- Focused schema/state E2E + Order/Create Order regression.
- Đúng một migration.
- Không payment service/controller/API.
- Chưa COD/Mock/Gateway/Callback.

### Phiên tiếp theo

```text
PHIEN-054 – COD + Mock Payment
```

---

## PHIEN-054 – COD + Mock Payment

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Authenticated POST `/thanh-toan`.
- COD + Mock local flow không cần gateway thật.
- Amount lấy từ Order.
- Ownership check.
- UUID `maYeuCau` idempotency.
- Payment + transaction initial CREATED.
- COD -> PENDING + reservation sold.
- Mock success -> PAID + reservation sold.
- Mock fail -> FAILED + reservation release.
- Retry không duplicate.
- OpenAPI + Orval `useTaoThanhToan`.
- Focused E2E + Payment/Reservation/CreateOrder regression.
- Không schema/migration.
- Chưa Gateway/Callback/Refund/Order State Machine.

### Phiên tiếp theo

```text
PHIEN-055 – Payment Gateway Adapter
```

---

## PHIEN-055 – Payment Gateway Adapter

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Exact `PaymentGatewayAdapter` interface:
  `createPayment`, `verifyCallback`, `refund`.
- `PaymentGatewayRegistry`.
- `MockPaymentGateway`.
- `VnPaySandboxGateway`.
- VNPay v2.1.0 payment URL + HMACSHA512.
- VNPay callback checksum verification.
- VNPay response success requires ResponseCode/TransactionStatus = 00.
- VNPay refund POST JSON sandbox.
- Refund request/response checksum.
- `.env.example` sandbox placeholders.
- Focused adapter tests + PHIEN-054/053 regression.
- Không schema/migration.
- Không public API/OpenAPI mới.
- Chưa callback lifecycle/idempotency.

### Phiên tiếp theo

```text
PHIEN-056 – Payment Callback Idempotency
```

---

## PHIEN-056 – Payment Callback Idempotency

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Public GET `/thanh-toan/callback/:gateway`.
- Gateway callback verify trước business mutation.
- Lookup transaction hiện hữu bằng external reference.
- Verify amount + gateway method.
- Success -> reservation sold + Payment/Transaction PAID.
- Fail -> reservation release + Payment/Transaction FAILED.
- Không insert payment_transaction khi callback.
- Duplicate terminal callback idempotent.
- 5 success callback -> đúng 1 ORDER_SHIP.
- 3 failed callback -> đúng 1 ORDER_RELEASE.
- Invalid signature/amount mismatch không gây effect.
- OpenAPI + Orval `useXuLyCallbackThanhToan`.
- Không schema/migration.
- Chưa Order State Machine/Shipment/UI.

### Phiên tiếp theo

```text
PHIEN-057 – Checkout UI Customer Web
```

---

## PHIEN-057 – Checkout UI Customer Web

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Route `/thanh-toan` theo thin-page + content component convention.
- `api-checkout.ts` dùng generated `layCheckoutPreview`.
- Đủ master sections: address/items/shipping/voucher/payment/summary.
- Address là draft UI, chưa persist.
- Items/subtotal lấy từ Backend Checkout Preview.
- Shipping/promotion/points hiển thị đúng trạng thái chưa có source of truth.
- COD hiển thị khả dụng.
- VNPay Sandbox disabled vì mới có adapter, chưa nối lifecycle.
- MOCK không expose như customer payment method.
- Summary không tự dựng final total khi Backend trả `tongThanhToan=null`.
- Cart có CTA sang Checkout.
- Không gọi Create Order/Payment/Callback/Inventory từ PHIEN-057.
- Không Backend/OpenAPI/schema/migration/Admin/Mobile changes.

### Phiên tiếp theo

```text
PHIEN-058 – Payment Result UI
```

---

## PHIEN-058 – Payment Result UI

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Tạo route `/thanh-toan/ket-qua` cho Customer Web.
- Exact master states: `success`, `failure`, `pending`.
- `trangThai` được normalize; thiếu/sai giá trị fallback `pending`.
- Có thể hiển thị `maDonHang`/`maGiaoDich` khi caller cung cấp.
- Không tự bịa mã đơn/mã giao dịch.
- UI nói rõ repository chưa có GET Payment Status endpoint.
- Không dùng URL query như Backend source of truth.
- Không gọi Create Order/Payment/Gateway callback/Inventory.
- Không Backend/OpenAPI/API-client/schema/migration/Admin/Mobile changes.

### Phiên tiếp theo

```text
PHIEN-059 – Order State Machine
```

---

## PHIEN-059 – Order State Machine

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Tạo pure domain state machine cho exact 8 core states master.
- Transition graph tuần tự từ `CHO_THANH_TOAN` đến `HOAN_THANH`.
- Cho phép `DA_HUY` chỉ từ `CHO_THANH_TOAN` hoặc `DA_XAC_NHAN`.
- Reject self-transition, skip và backward transition.
- `HOAN_THANH` và `DA_HUY` là terminal core states.
- Giữ `KHIEU_NAI`/refund states trong Prisma nhưng không đưa vào core PHIEN-059.
- Focused Jest kiểm toàn bộ ma trận 8x8 và future-state boundary.
- Không persistence/API/OpenAPI/API-client/schema/migration.
- Không nối Payment/Callback/Inventory vào Order state.
- Không Customer Web/Admin/Mobile changes.

### Phiên tiếp theo

```text
PHIEN-060 – Customer Order List/Detail
```

---

## PHIEN-060 – Customer Order List/Detail

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Customer Web đủ exact master `list/filter/detail/timeline/cancel action`.
- Tạo GET list, GET detail và POST cancel authenticated customer Order API.
- List filter theo core status + pagination; luôn scope theo khách hàng hiện tại.
- Detail trả supplier/item snapshot và progression timeline không fake timestamp.
- Cancel reuse PHIEN-059 validator; chỉ trước preparation.
- Active/paid payment chặn cancel; không tự payment mutation/refund.
- Reservation `DANG_GIU` release atomic cùng Order/Suborder -> `DA_HUY`.
- OpenAPI snapshot + Orval generated client đồng bộ.
- Tạo `/don-hang`, `/don-hang/[id]` và expose desktop navigation.
- Không schema/migration; không Admin/Packing/Shipment/Mobile.

### Phiên tiếp theo

```text
PHIEN-061 – Admin Order List/Detail
```

---

## PHIEN-061 – Admin Order List/Detail

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Exact master `ProTable + ProDescriptions`.
- Tạo admin read-only GET list/detail tại `/api/v1/quan-tri/don-hang`.
- Reuse `don_hang.xu_ly`, không seed permission/migration mới.
- List hỗ trợ pagination + filter `maDonHang`/`trangThai` và trả customer/payment summary.
- Detail trả customer, supplier/item snapshot, payment transaction và reservation state.
- Admin `/don-hang` dùng ProTable; Drawer detail dùng ProDescriptions.
- OpenAPI snapshot + Orval generated client đồng bộ.
- Không Order/Payment/Callback/Inventory mutation.
- Không Customer Web/Mobile/Packing/Shipment.

### Phiên tiếp theo

```text
PHIEN-062 – Packing Workflow
```


---

## PHIEN-062 – Packing Workflow

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Exact checklist: đúng sản phẩm, đúng batch, đúng qty, đóng gói, QR.
- Packing theo supplier order, reuse `don_hang.xu_ly` + PHIEN-059.
- Backend validate allocation variant/batch/qty và QR `maTruyXuat`.
- Start `DA_XAC_NHAN -> DANG_CHUAN_BI`.
- Complete `DANG_CHUAN_BI -> DA_DONG_GOI`.
- Parent Order aggregate multi-supplier.
- Audit start/complete.
- Admin `/don-hang` tích hợp Packing Workflow.
- OpenAPI + Orval.

### Boundary

- Không schema/migration/new permission.
- Không Payment/Callback/Inventory quantity mutation.
- Không auto confirm Order.
- Không Customer Web/Mobile.
- Không Shipment/DANG_GIAO.

### Phiên tiếp theo

```text
PHIEN-063 – Shipment Domain
```


---

## PHIEN-063 – Shipment Domain

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Exact entity: `shipment`, `tracking_event`.
- Exact state: CREATED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED, RETURNED.
- Prisma `VanChuyen` gắn `DonHangNhaCungCap` cho multi-supplier.
- `maVanDon` unique; default CREATED.
- `SuKienTheoDoiVanChuyen` lưu lịch sử trạng thái/vị trí/thời gian.
- Cho phép nhiều shipment trên một supplier order để hỗ trợ attempt mới sau FAILED/RETURNED.
- Migration deterministic + Shipment Domain E2E.

### Boundary

- Không Shipping Adapter/provider API.
- Không controller/OpenAPI/api-client/UI.
- Không Order/Payment/Inventory mutation.
- Không tự chuyển DANG_GIAO/DA_GIAO.

### Phiên tiếp theo

```text
PHIEN-064 – Shipping Adapter
```


---

## PHIEN-064 – Shipping Adapter

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Exact master: Mock trước; API hãng vận chuyển để sau nếu cần.
- Tạo `ShippingAdapter` contract: `createShipment`, `getTracking`.
- Tạo `MockShippingAdapter` deterministic, state CREATED, không bịa tracking event.
- Tạo `ShippingAdapterRegistry`, hiện chỉ có MOCK.
- Map đủ 7 Shipment states từ PHIEN-063.
- Focused test + Shipment Domain regression.

### Boundary

- Không carrier API/HTTP.
- Không Prisma/schema/migration.
- Không Shipment/TrackingEvent/Order/Payment/Inventory mutation.
- Không controller/OpenAPI/api-client/UI.
- Không DANG_GIAO/DA_GIAO transition.

### Phiên tiếp theo

```text
PHIEN-065 – Review Backend
```


---

## PHIEN-065 – Review Backend

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Exact rule: chỉ delivered item; một review/order item.
- Tạo `review` schema/migration, unique theo `order_item_id`, rating 1..5.
- Customer ownership được xác minh từ Order source-of-truth.
- Delivered eligibility lấy từ Shipment `DELIVERED`, không tin client.
- API create + order-item eligibility/status + public product reviews.
- OpenAPI + Orval contract cho PHIEN-066.
- Focused test + Shipment Domain + Shipping Adapter regression.

### Boundary

- Không Review UI/Admin/Mobile.
- Không review image/sub-rating ngoài exact master.
- Không Shipment/Order/Payment/Inventory mutation.

### Phiên tiếp theo

```text
PHIEN-066 – Review UI
```


---

## PHIEN-066 – Review UI

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Exact master: Review UI – Customer Web.
- Order Detail có eligibility/status + form review theo từng order item.
- Không suy luận delivered ở frontend; Backend PHIEN-065 là source-of-truth.
- Rating 1..5 + bình luận optional; review đã tạo hiển thị read-only.
- Product Detail có average/total + danh sách review public + pagination.
- Reuse generated Orval Review API từ PHIEN-065.

### Boundary

- Không sửa Backend/schema/migration/OpenAPI.
- Không Admin/Mobile, không image/sub-rating.
- Không Complaint Domain và không Shipment/Order/Payment/Inventory mutation.

### Phiên tiếp theo

```text
PHIEN-067 – Complaint Domain
```


---

## PHIEN-067 – Complaint Domain

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Exact entity: `complaint` + `complaint_evidence`.
- Exact reason: hỏng, dập, sai, thiếu, hết hạn, chất lượng, chứng nhận.
- Complaint gắn order_item; evidence gắn file upload.
- Customer ownership + Shipment DELIVERED được xác minh Backend.
- Evidence chỉ nhận active image/video do chính khách upload.
- Customer create/eligibility/list/detail + Admin read-only list/detail.
- Detail expose order/item/batch allocation/shipment/evidence để PHIEN-068/069 dùng.
- OpenAPI + Orval generated contract.
- Focused test + Review Backend + Shipment Domain regression.

### Boundary

- Không Customer Web wizard.
- Không Complaint Admin UI.
- Không status/resolution workflow ngoài exact master.
- Không Refund.
- Không Shipment/Order/Payment/Inventory mutation.

### Phiên tiếp theo

```text
PHIEN-068 – Complaint Customer Web
```


---

## PHIEN-068 – Complaint Customer Web

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Exact wizard: item -> reason -> description -> evidence -> confirm.
- Order Detail mở wizard theo order item.
- Eligibility do Backend PHIEN-067 quyết định; frontend không tự suy luận delivered.
- Dùng đúng 7 complaint reasons.
- Mô tả 10..2000 ký tự.
- Evidence optional tối đa 5 ảnh/video; upload qua Tệp tin Backend ở confirm.
- Sau upload gửi `tepTinIds` vào `taoKhieuNai`.

### Boundary

- Không sửa Backend/schema/migration/OpenAPI.
- Không Complaint Admin/Mobile, không status/resolution workflow.
- Không Refund và không Shipment/Order/Payment/Inventory mutation.

### Phiên tiếp theo

```text
PHIEN-069 – Complaint Admin
```


---

## PHIEN-069 – Complaint Admin

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Exact detail: order -> item -> batch -> shipment -> evidence -> timeline -> resolution.
- Admin menu + ProTable danh sách khiếu nại.
- Filter reason và Drawer chi tiết dùng Complaint Admin API PHIEN-067.
- Timeline chỉ dùng timestamp complaint/evidence/shipment snapshot có thật.
- Resolution chỉ hiển thị chưa có quyết định xử lý; không tạo workflow giả.
- Reuse quyền `don_hang.xu_ly`.

### Boundary

- Không sửa Backend/schema/migration/OpenAPI.
- Không Customer/Mobile UI.
- Không complaint status/resolution mutation.
- Không Refund và không Shipment/Order/Payment/Inventory mutation.

### Phiên tiếp theo

```text
PHIEN-070 – Refund
```


---

## PHIEN-070 – Refund

**Trạng thái:** Hoàn thành
**Ngày:** 01/09/2026

### Đã thực hiện

- Exact rule `refund <= paid amount`.
- Tích hợp qua `PaymentGatewayAdapter.refund()` hiện có; không sửa gateway contract.
- Admin Refund API protected bằng `don_hang.xu_ly`.
- Reuse payment transaction + PARTIALLY_REFUNDED/REFUNDED, không migration mới.
- Row lock + refund reservation để chặn concurrent over-refund.
- Idempotency theo `maYeuCau`; retry outcome chưa chắc chắn bằng cùng request id.
- Partial/full refund cập nhật Payment + refund transaction tương ứng.

### Boundary

- Không Refund UI.
- Không Complaint resolution/status mutation.
- Không sửa gateway implementation/schema/migration.
- Không Order/Shipment/Inventory mutation.
- Không Customer Profile PHIEN-071.

### Phiên tiếp theo

```text
PHIEN-071 – Customer Profile
```


---

## PHIEN-071 – Customer Profile

**Trạng thái:** Hoàn thành
**Ngày:** 02/09/2026

### Đã thực hiện

- Backend GET/PATCH Customer Profile bằng JWT.
- Reuse field hiện có, không migration.
- Email read-only; update họ tên, số điện thoại, ngày sinh.
- Customer Web `/tai-khoan` với Mantine + generated Orval client.
- Đồng bộ tên mới vào customer session.

### Boundary

- Không Address Book/DiaChi; PHIEN-072 mới CRUD địa chỉ + default.
- Không Favorites/Follow/Loyalty.
- Không Admin/Mobile.
- Không đổi email/password/auth lifecycle.

### Phiên tiếp theo

```text
PHIEN-072 – Address Book
```


---

## PHIEN-072 – Address Book

**Trạng thái:** Hoàn thành
**Ngày:** 02/09/2026

### Đã thực hiện

- Backend CRUD sổ địa chỉ bằng JWT customer ownership.
- Reuse `DiaChi`, không schema/migration.
- Row lock + atomic default để tối đa một địa chỉ mặc định active.
- Delete soft, không tự promote default khác.
- Fix kết nối local MySQL 8.4 RSA public-key retrieval theo loopback/explicit opt-in.
- Customer Web `/tai-khoan` có Sổ địa chỉ Mantine.

### Boundary

- Không tích hợp Checkout.
- Không Wishlist/favorite product; PHIEN-073 mới làm.
- Không Favorites/Follow/Loyalty khác.
- Không Admin/Mobile.

### Phiên tiếp theo

```text
PHIEN-073 – Wishlist
```


---

## PHIEN-073 – Wishlist

**Trạng thái:** Hoàn thành
**Ngày:** 02/09/2026

### Đã thực hiện

- Thêm `SanPhamYeuThich` + migration với unique customer/product.
- Backend list/status/favorite/unfavorite theo JWT customer ownership.
- Favorite/unfavorite idempotent.
- Chỉ favorite sản phẩm đang công khai.
- Customer Web có WishlistButton ở Product Detail và route `/yeu-thich`.

### Boundary

- Không Follow Farm/follow-unfollow.
- Không new harvest notification; PHIEN-074 mới làm.
- Không Loyalty, Admin, Mobile.

### Phiên tiếp theo

```text
PHIEN-074 – Follow Farm
```


---

## PHIEN-074 – Follow Farm

**Trạng thái:** Hoàn thành
**Ngày:** 02/09/2026

### Đã thực hiện

- Thêm `TheoDoiTrangTrai` + `ThongBaoThuHoach` với deterministic migration.
- Backend follow/unfollow idempotent theo JWT customer ownership.
- Chỉ follow trang trại công khai.
- `ThuHoachService.tao()` sinh in-app notification cho follower trong cùng transaction.
- Unfollow không xóa notification lịch sử.
- Customer Web có FollowFarmButton tại Farm Detail và route `/theo-doi`.

### Boundary

- Không mở rộng email/push notification framework.
- Không Loyalty; PHIEN-075 mới làm.
- Không Admin/Mobile.

### Phiên tiếp theo

```text
PHIEN-075 – Loyalty
```


---

## PHIEN-075 – Loyalty

**Trạng thái:** Hoàn thành
**Ngày:** 02/09/2026

### Đã thực hiện

- Thêm `TaiKhoanLoyalty` map `loyalty_account`.
- Thêm `GiaoDichLoyalty` map `loyalty_transaction`.
- Deterministic migration với unique 1 account/customer, FK cascade và DB CHECK cơ bản.
- E2E xác minh account/ledger invariants.

### Boundary

- Không tự invent earning/redeem ratio, expiry/tier hoặc Order/Payment trigger vì exact master không mô tả.
- Không Loyalty API/UI.
- Không Voucher/Promotion; PHIEN-076 mới làm.
- Không Admin/Mobile.

### Phiên tiếp theo

```text
PHIEN-076 – Voucher/Promotion
```


---

## PHIEN-076 – Voucher/Promotion

**Trạng thái:** Hoàn thành
**Ngày:** 02/09/2026

### Đã thực hiện

- Thêm `PhamViKhuyenMai` = PLATFORM/DANH_MUC/SAN_PHAM.
- Thêm `KhuyenMai` map `khuyen_mai` với min order/date/usage limit/current usage.
- Deterministic migration với FK category/product; scope-target được fail-closed ở service do giới hạn MySQL 8.4 CHECK/FK; DB CHECK giữ min/date/usage.
- Thêm `KhuyenMaiService` eligibility engine đúng sáu rule dimension exact master.
- E2E xác minh DB constraints + platform/category/product/min/date/usage behavior.

### Boundary

- Không invent kiểu/giá trị giảm.
- Không consume usage/redemption vì master không định nghĩa lifecycle.
- Không Checkout/Order/Payment/Loyalty integration.
- Không API/OpenAPI/UI; PHIEN-077 mới Admin Customer Management.

### Phiên tiếp theo

```text
PHIEN-077 – Quản lý khách hàng
```


---

## PHIEN-077 – Quản lý khách hàng

**Trạng thái:** Hoàn thành
**Ngày:** 02/09/2026

### Đã thực hiện

- Backend Customer Admin: list/detail/orders/complaints/lock/unlock.
- Reuse schema hiện có, không migration.
- JWT + `phan_quyen.quan_ly`.
- Lock/unlock idempotent, row lock, audit; lock revoke refresh sessions.
- Admin Web `/khach-hang` với ProTable + Drawer detail/orders/complaints.

### Boundary

- Không làm quản lý nhân viên, reset password hoặc role assignment của PHIEN-078.
- Không sửa global JWT guard.

### Phiên tiếp theo

```text
PHIEN-078 – Quản lý nhân viên
```


---

## PHIEN-078 – Quản lý nhân viên

**Trạng thái:** Hoàn thành
**Ngày:** 02/09/2026

### Đã thực hiện

- Backend Employee Admin: list/detail/create/edit/lock/reset-password/role-assignment.
- Reuse NguoiDung + NhanVien + RBAC hiện có; không migration.
- JWT + phan_quyen.quan_ly.
- Create tự gán NHAN_VIEN.
- Reset password dùng Argon2id và revoke sessions.
- Admin Web `/nhan-vien`.

### Boundary

- Không Permission Matrix PHIEN-079.
- Không sửa role→permission.
- Không Customer Web/Mobile.

### Phiên tiếp theo

```text
PHIEN-079 – Role/Permission UI
```


---

## PHIEN-079 – Role/Permission UI

**Trạng thái:** Hoàn thành
**Ngày:** 02/09/2026

### Đã thực hiện
- Permission Matrix trên `VaiTro` / `Quyen` / `VaiTroQuyen`.
- GET matrix + PUT replace permission set.
- JWT + `phan_quyen.quan_ly`.
- Row lock + idempotent + audit before/after.
- `ADMIN` luôn giữ `phan_quyen.quan_ly`.
- Admin Web `/phan-quyen`.

### Boundary
- Không CRUD role/permission.
- Không PHIEN-080 Audit UI.
- Không migration.

### Phiên tiếp theo
PHIEN-080 – Audit UI


---

## PHIEN-080 – Audit UI

**Trạng thái:** Hoàn thành
**Ngày:** 02/09/2026

### Đã thực hiện
- Reuse Audit PHIEN-014, không migration.
- GET Audit read-only + `audit.xem`.
- Filter actor/action/entity/date.
- Actor hỗ trợ `tacNhan` text, giữ `tacNhanId`.
- Pagination fallback an toàn.
- Admin Web `/nhat-ky-kiem-toan` với ProTable + Drawer before/after/metadata.

### Boundary
- Không PHIEN-081 System Settings.
- Không Customer Web/Mobile.

### Phiên tiếp theo
PHIEN-081 – System Settings


---

## PHIEN-081 – System Settings

**Trạng thái:** Hoàn thành
**Ngày:** 02/09/2026

### Exact master
- reservation TTL: default 15 phút.
- complaint window: default 7 ngày, rule mới được enforce từ DELIVERED.
- near-expiry threshold: default 7 ngày.

### Backend
- Singleton `system_settings` + Prisma migration.
- GET/PUT `/api/v1/quan-tri/cau-hinh` với `phan_quyen.quan_ly`.
- PUT ghi Audit Log.
- Wire đúng 3 business consumers, giữ override hiện hữu cho reservation/near-expiry.

### Admin
- `/cau-hinh` chỉnh 3 tham số.

### Boundary
- Không upload limit.
- Không Commission Rules; PHIEN-082 xử lý rule hoa hồng.

### Phiên tiếp theo
PHIEN-082 – Commission Rules


## PHIEN-082 – Commission Rules

- Base: `49f177227a28062827986946946ee180936f9af5` – `feat: xay dung cau hinh he thong`.
- Exact master: `percentage / category / supplier / effective date`.
- DB: thêm `commission_rule` với unique supplier/category/effective date.
- API Admin: GET/POST `/api/v1/quan-tri/quy-tac-hoa-hong`, PUT `/api/v1/quan-tri/quy-tac-hoa-hong/:id`.
- Permission: `phan_quyen.quan_ly`.
- Audit: `QUY_TAC_HOA_HONG_TAO`, `QUY_TAC_HOA_HONG_CAP_NHAT`.
- Rule resolver: exact supplier/category, latest effective date không vượt thời điểm cần tính.
- Rule đã có hiệu lực là immutable; thay đổi bằng rule mới có effective date mới.
- Admin: `/hoa-hong`.
- Boundary: không triển khai Seller Balance/pending/available/withheld/paid; PHIEN-083 xử lý.


## PHIEN-083 – Seller Balance

- Exact master: `pending / available / withheld / paid`.
- Tạo Prisma `seller_balance`, một row/supplier, bốn Decimal(18,2) default 0.
- API đọc: `GET /api/v1/quan-tri/so-du-nha-cung-cap` và `GET /api/v1/quan-tri/so-du-nha-cung-cap/:nhaCungCapId`.
- Supplier chưa có row được project 0/0/0/0, không tạo dữ liệu khi chỉ đọc.
- Quyền quản trị: `phan_quyen.quan_ly`.
- Không Settlement, không payout, không Finance Admin UI.
- PHIEN-084 tiếp theo: Settlement (`revenue - commission - refunds - adjustments = payable`).


## PHIEN-084 – Settlement

- Exact formula: `revenue - commission - refunds - adjustments = payable`.
- Tạo `settlement` theo supplier + khoảng `[period_start, period_end)`, immutable và chặn overlap.
- Revenue lấy supplier order `HOAN_THANH`; current `supplier_order.updatedAt` là completion anchor do schema chưa có completed_at.
- Bổ sung/backfill `order_item.category_id_snapshot` để commission ổn định theo lịch sử.
- Commission dùng rule effective tại supplier-order createdAt; thiếu rule thì reject.
- Refund là supplier-attributed input vì refund hiện ở payment-level và chưa có supplier allocation.
- Adjustment có dấu: dương là deduction, âm là credit.
- Payable không được âm và được cộng atomically vào `seller_balance.available`.
- API: GET list/detail + POST `/api/v1/quan-tri/doi-soat`.
- Audit: `DOI_SOAT_TAO`; quyền `phan_quyen.quan_ly`.
- Không Payout lifecycle, không Finance Admin UI.
- PHIEN-085 tiếp theo: Payout (`REQUESTED / PROCESSING / PAID / FAILED`).


## PHIEN-085 – Payout

- Tạo Prisma `payout` với exact lifecycle `REQUESTED / PROCESSING / PAID / FAILED`.
- `request_key` UUID unique giúp create retry idempotent và không reserve balance hai lần.
- REQUESTED: `seller_balance.available -> withheld`.
- PROCESSING: chỉ thay trạng thái.
- PAID: `seller_balance.withheld -> paid`.
- FAILED: `seller_balance.withheld -> available`, lưu `failure_reason`.
- Chặn transition ngoài `REQUESTED -> PROCESSING -> PAID/FAILED`.
- API GET list/detail + POST create + PUT trạng thái dưới `/api/v1/quan-tri/chi-tra-nha-cung-cap`.
- Audit: `PAYOUT_REQUESTED`, `PAYOUT_PROCESSING`, `PAYOUT_PAID`, `PAYOUT_FAILED`.
- Không làm Finance Admin UI; PHIEN-086 sở hữu UI tài chính.


## PHIEN-086 – Finance Admin UI

- Tạo `/tai-chinh` gồm 4 tab exact master: payments / refunds / settlements / payouts.
- Thêm 2 endpoint read-only `/api/v1/quan-tri/tai-chinh/thanh-toan` và `/api/v1/quan-tri/tai-chinh/hoan-tien` để UI có nguồn list tập trung.
- Payment tab hiển thị payment + tổng refund thành công và gọi refund API PHIEN-070, không viết lại refund lifecycle.
- Settlement tab dùng nguyên API PHIEN-084 để list/tạo kỳ đối soát.
- Payout tab dùng nguyên API PHIEN-085 để list/tạo/chuyển REQUESTED -> PROCESSING -> PAID/FAILED.
- Không sửa Prisma schema/migration và không làm Dashboard API; PHIEN-087 sở hữu Dashboard API.


## PHIEN-087 – Dashboard API

- Tạo `GET /api/v1/quan-tri/dashboard` với exact 6 KPI: revenue / orders / customers / products / inventory alerts / complaints.
- Revenue lấy từ successful Payment gross trừ successful refund transaction, không cộng FAILED/CANCELLED/PENDING.
- Customers/Products chỉ đếm bản ghi `HOAT_DONG`; Orders đếm tổng Order.
- Inventory alerts reuse `CanhBaoHetHanTonKhoService` + System Settings threshold; trả cả sắp hết hạn và hết hạn.
- Complaints đếm tổng bản ghi do complaint domain hiện chưa có lifecycle status.
- Không Prisma migration, không Admin Dashboard UI/charts; PHIEN-088 sở hữu Admin Dashboard.


## PHIEN-088 – Admin Dashboard

- Thay root Admin `/` placeholder bằng Dashboard thực dùng `GET /api/v1/quan-tri/dashboard`.
- Hiển thị 6 KPI: revenue / orders / customers / products / inventory alerts / complaints.
- Thêm đúng 2 chart bằng Ant Design/ProComponents hiện có, không thêm dependency: operational-volume bars + inventory-alert composition.
- Thêm alert cards cho near-expiry, expired và complaints; giữ semantic System Settings/Complaint của PHIEN-087.
- Quyền `phan_quyen.quan_ly`, có loading/error/refresh/updated-at.
- Không sửa backend/OpenAPI/Prisma; PHIEN-089 sở hữu Inventory Reports.


## PHIEN-089 – Inventory Reports

- Hoàn thành exact master `stock / near expiry / expired / waste`.
- Backend read-only: `/api/v1/quan-tri/bao-cao-ton-kho/{ton-kho,sap-het-han,het-han,hao-hut}` với quyền `kho.xem`.
- Near-expiry dùng System Settings; expired chỉ tính lô còn tồn vật lý.
- Waste chỉ dựa trên ledger `DAMAGE`/`EXPIRE`, không đánh đồng signed `ADJUSTMENT` với waste.
- Admin `/bao-cao-ton-kho` có 4 tab report, search/pagination và filter waste type.
- Không Prisma/migration; không làm Order/Revenue Reports.
- Phiên tiếp theo: PHIEN-090 – Order/Revenue Reports.


## PHIEN-090 – Order/Revenue Reports

- Exact master: Order/Revenue Reports; filter ngày/farm/category.
- API read-only: `GET /api/v1/quan-tri/bao-cao-don-hang-doanh-thu`.
- Date filter dùng `order.created_at` theo UTC-day inclusive.
- Farm filter dùng `order_item.trang_trai_id`; category dùng `category_id_snapshot`.
- Revenue là gross order-item snapshot của order có successful payment `PAID/PARTIALLY_REFUNDED/REFUNDED`.
- Không tự phân bổ refund payment-level xuống farm/category.
- Admin `/bao-cao-don-hang-doanh-thu` có KPI + ProTable filter ngày/farm/category.
- Permission `phan_quyen.quan_ly`.
- Không Prisma/migration, không mutation.
- Next: PHIEN-091 – Traceability Reports.


## PHIEN-091 – Traceability Reports

- Exact master: batch / recall / affected orders.
- API read-only: `/api/v1/quan-tri/bao-cao-truy-xuat/{lo,thu-hoi,don-hang-anh-huong}`.
- Batch lineage: LoSanPham -> ThuHoach -> MuaVu -> TrangTrai.
- Recall report: ThuHoiLoSanPham + lý do/thông báo/người thu hồi + affected order stats.
- Affected orders: historical `order_allocation` nối recalled batch tới order item/supplier order/order.
- Không loại order `DA_HUY`: allocation lịch sử vẫn phải truy vết được.
- Admin `/bao-cao-truy-xuat` có 3 tab exact master.
- Permission `lo_san_pham.xem`.
- Không Prisma/migration, không mutation.
- Next: PHIEN-092 – Mobile Design System.


## PHIEN-092 – Mobile Design System

- Exact master: theme / spacing / typography / ProductCard / FarmCard / Badge / Skeleton / Empty/Error.
- Đổi semantic mobile theme từ grayscale foundation sang AgriMarket green, vẫn giữ UniWind light/dark runtime theme.
- Tạo type-safe tokens tại `apps/mobile/src/theme` cho colors/radius/spacing/typography.
- Tạo reusable `ProductCard`, `FarmCard`, `Badge`, `Skeleton`, `ProductCardSkeleton`, `FarmCardSkeleton`, `EmptyState`, `ErrorState`.
- Component foundation không gọi API và chưa bind navigation/domain route để PHIEN-093+ tái sử dụng.
- Không thêm package; reuse Expo 57, React Native 0.86, gluestack-ui v5, UniWind và expo-image đang có.
- Boundary: PHIEN-093 mới Mobile Auth; không sửa backend/Admin/Customer Web/OpenAPI/Prisma.
- Phiên tiếp theo PHIEN-093 – Mobile Auth: login / register / forgot / SecureStore / refresh.

## PHIEN-093 – Mobile Auth

- Exact master: login / register / forgot / SecureStore / refresh.
- Reuse generated client: `dangKyKhachHang`, `dangNhap`, `yeuCauDatLaiMatKhau`, `lamMoiToken`, `dangXuat`; không sửa backend/OpenAPI.
- Login gửi `nenTang=MOBILE`; access token chỉ giữ memory, refresh token lưu `expo-secure-store` trên Android/iOS.
- Startup đọc refresh token và gọi refresh endpoint để rotate/cấp access token mới.
- Web export quality gate không lưu refresh token vào localStorage; chỉ dùng memory fallback.
- Routes: `/dang-nhap`, `/dang-ky`, `/quen-mat-khau`.
- Boundary: không Mobile Home/Search; PHIEN-094 mới Mobile Home.
- Phiên tiếp theo PHIEN-094 – Mobile Home: sections giống Customer Web nhưng native layout.

## PHIEN-094 – Mobile Home

- Exact master: sections giống Customer Web nhưng native layout.
- Mobile Home thay placeholder bằng dữ liệu thật từ `useLayDanhSachSanPhamCongKhai` (`trang=1`, `gioiHan=24`).
- Parity với Customer Web: Hero / Danh mục / Mới thu hoạch / Organic / Trang trại nổi bật / Theo mùa / Gợi ý.
- “Mới thu hoạch” dùng `useLayChiTietSanPhamCongKhai` cho tối đa 3 sản phẩm để đọc `thuHoachGanNhatTaiTrangTrai`.
- Reuse ProductCard / FarmCard / Badge / Skeleton / EmptyState / ErrorState của PHIEN-092.
- Hero điều hướng sang tab Khám phá và Quét QR; không tạo Search/Filter hoặc Product/Farm Detail sớm.
- Không thêm dependency; không sửa backend/OpenAPI/Prisma/Auth.
- Boundary: PHIEN-095 mới Mobile Search/Filter BottomSheet; PHIEN-096 Product Detail; PHIEN-097 Farm Detail.
- Phiên tiếp theo PHIEN-095 – Mobile Search/Filter: BottomSheet.

## PHIEN-095 – Mobile Search/Filter

- Exact master: Mobile Search/Filter + BottomSheet.
- Thay tab `Khám phá` placeholder bằng search/list/filter thật từ `useLayDanhSachSanPhamCongKhai`.
- Pagination native dùng 12 sản phẩm/trang và nút Trang trước/Trang sau.
- Search keyword nằm trên screen; bộ lọc mở bằng native Modal BottomSheet.
- Filter parity với Customer Web: danh mục / farm / tỉnh-thành / chứng nhận / giá / ngày thu hoạch / khả dụng / sort.
- Facet options lấy từ feed công khai `gioiHan=100`; không hard-code category/farm/certificate.
- Reuse ProductCard / ProductCardSkeleton / EmptyState / ErrorState của PHIEN-092.
- Không tạo navigation Product Detail trong card; PHIEN-096 sở hữu Product Detail.
- Không thêm dependency; không sửa backend/OpenAPI/Prisma/Auth/Home.
- Phiên tiếp theo PHIEN-096 – Mobile Product Detail: Sticky CTA.

## PHIEN-096 – Mobile Product Detail

- Exact master: Mobile Product Detail + Sticky CTA.
- Tạo route `/san-pham/[id]` dùng `useLayChiTietSanPhamCongKhai` và `useLaySanPhamLienQuanCongKhai`.
- Nội dung: gallery / danh mục-chứng nhận / mô tả / giá / biến thể / tồn / trang trại / thu hoạch / chứng nhận / Product ≠ Batch / related products.
- Sticky CTA nằm ngoài ScrollView: luôn hiển thị biến thể, giá và trạng thái tồn đã chọn.
- CTA “Thêm vào giỏ” ở PHIEN-096 chỉ phản ánh purchase readiness và thông báo boundary; không mutate cart vì PHIEN-100 mới Mobile Cart đồng bộ Backend.
- ProductCard ở Home / Search / Mới thu hoạch bắt đầu mở `/san-pham/[id]`.
- Không tạo Farm Detail; PHIEN-097 mới sở hữu Mobile Farm Detail.
- Không thêm dependency; không sửa backend/OpenAPI/Prisma.
- Phiên tiếp theo PHIEN-097 – Mobile Farm Detail.
