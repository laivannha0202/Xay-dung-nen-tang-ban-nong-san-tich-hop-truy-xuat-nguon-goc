# MOBILE-FIX-016C — Final UI Copy Repair

- Thời gian: `2026-09-07T09:12:33`
- Kết quả: **PASS**

## Root cause

- 016B dùng exact string replacement.
- Hai câu còn lại có format whitespace/newline khác nên exact match không chạy.
- 016C dùng regex semantic + whitespace-tolerant.

## Fixed

- Order Detail: bỏ câu implementation về Review/Khiếu nại + Backend.
- Checkout: bỏ câu technical về deep link/custom scheme/development build.
- Quét lại toàn bộ customer-visible Text/Badge/props.
- Dọn trailing whitespace lần cuối.

## File thay đổi

- `apps/mobile/src/app/don-hang/[id].tsx`
- `apps/mobile/src/app/thanh-toan.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Remaining Order technical copy | PASS | Expected leftover from 016B |
| Remaining Checkout technical copy | PASS | Expected leftover from 016B |
| Order technical copy removed | PASS | Customer wording only |
| Order feedback behavior preserved | PASS | Review/complaint routes unchanged |
| Checkout technical copy removed | PASS | Customer payment-return wording only |
| Checkout online payment preserved | PASS | VNPay return logic unchanged |
| No TSX trailing whitespace | PASS | Cleaned 0 additional file(s) |
| No customer-facing implementation markers | PASS | No visible PHIEN/Backend/Expo/EAS/development-build implementation copy remains |
| Order review integration preserved | PASS | MOBILE-FIX-010 preserved |
| Checkout VNPay preserved | PASS | MOBILE-FIX-008 preserved |
| No PHIEN marker anywhere | PASS | 016 cleanup preserved |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-016 + 016B + 016C PASS.**

Phiên tiếp theo: **MOBILE-FIX-017 — Navigation Polish**.

## Command logs

### `pnpm --filter @agrimarket/mobile typecheck`

Exit code: `0`

```text
$ pnpm --filter @agrimarket/api-client ensure
$ node tools/dam-bao-generated.mjs
$ tsc --noEmit
```

### `pnpm lint`

Exit code: `0`

```text
$ eslint .

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/api/test/dong-goi.e2e-spec.ts
  66:17  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

✖ 1 problem (0 errors, 1 warning)

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 693ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
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
