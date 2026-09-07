# MOBILE-FIX-010B — Complaint lint repair

- Thời gian: `2026-09-07T08:06:33`
- Kết quả: **PASS**

## Sửa lỗi

- Dùng `thongBaoLoiApi(mutation.error, ...)` thật sự trong màn tạo khiếu nại.
- Loại bỏ nhánh render `mutation.error instanceof Error ? ...` cũ.
- Không thay đổi contract review/complaint.

## File thay đổi

- Không có file cần sửa.

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Foundation apps/mobile/src/app/khieu-nai/tao.tsx | PASS | found |
| Foundation apps/mobile/src/components/orders/danh-gia-muc-don-hang.tsx | PASS | found |
| Foundation apps/mobile/src/lib/api-phan-hoi.ts | PASS | found |
| Foundation apps/mobile/src/app/tai-khoan/khieu-nai.tsx | PASS | found |
| Foundation apps/mobile/src/app/tai-khoan/khieu-nai/[id].tsx | PASS | found |
| Foundation apps/mobile/src/app/don-hang/[id].tsx | PASS | found |
| 010 Complaint cache synchronization | PASS | found |
| 010 Complaint success detail link | PASS | found |
| 010 Complaint returnTo | PASS | found |
| 010 Review revalidation | PASS | found |
| 010 Review shared error | PASS | found |
| Complaint API error import | PASS | Shared error normalizer imported |
| Complaint API error usage | PASS | Import is now actually used |
| Legacy raw Error message removed | PASS | Consistent mobile API error UX |
| Review still wired | PASS | Review flow preserved |
| Review revalidation preserved | PASS | Server truth after submit |
| Complaint eligibility preserved | PASS | Backend eligibility |
| Complaint evidence preserved | PASS | 5 files / 5 MiB / image MIME rules |
| Complaint cache synchronization preserved | PASS | History/detail refresh |
| Complaint success detail link preserved | PASS | Immediate complaint detail |
| Complaint friendly API error | PASS | No unused import |
| Complaint history preserved | PASS | Account history |
| Complaint detail preserved | PASS | Account detail |
| No fake complaint status | PASS | Backend contract has no processing status |
| No raw backend fetch | PASS | fetch(asset.uri) local Blob conversion is allowed |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-010 + 010B PASS.**

Phiên tiếp theo: **MOBILE-FIX-011 — Account Completion**.

## Command logs

### `pnpm lint`

Exit code: `0`

```text
$ eslint .

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/api/test/dong-goi.e2e-spec.ts
  66:17  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

✖ 1 problem (0 errors, 1 warning)

```

### `pnpm --filter @agrimarket/mobile typecheck`

Exit code: `0`

```text
$ pnpm --filter @agrimarket/api-client ensure
$ node tools/dam-bao-generated.mjs
$ tsc --noEmit
```

### `pnpm typecheck`

Exit code: `0`

```text
$ tsc --noEmit -p tsconfig.json && pnpm -r --filter './apps/**' --filter './packages/**' --if-present run typecheck
Scope: 8 of 9 workspace projects
apps/api typecheck$ prisma generate --config prisma7.config.ts && tsc --noEmit -p tsconfig.json
packages/api-client typecheck$ pnpm run ensure && tsc --noEmit -p tsconfig.json
packages/api-client typecheck: $ node tools/dam-bao-generated.mjs
apps/api typecheck: Loaded Prisma config from prisma7.config.ts.
apps/api typecheck: Prisma schema loaded from prisma/schema.prisma.
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 442ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/customer-web typecheck: Generating route types...
apps/customer-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Generating route types...
apps/admin-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Done
apps/customer-web typecheck: Done
apps/mobile typecheck: Done
```

### `git diff --check`

Exit code: `0`

```text

```
