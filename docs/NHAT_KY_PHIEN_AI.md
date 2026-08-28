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
