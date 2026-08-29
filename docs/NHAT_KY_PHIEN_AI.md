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
