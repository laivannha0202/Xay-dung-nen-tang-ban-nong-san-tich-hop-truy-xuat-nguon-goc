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
