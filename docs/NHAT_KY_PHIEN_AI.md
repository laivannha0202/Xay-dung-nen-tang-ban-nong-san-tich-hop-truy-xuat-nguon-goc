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
