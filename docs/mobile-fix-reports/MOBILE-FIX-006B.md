# MOBILE-FIX-006B — Checkout Contract V2 corrective patch

- Thời gian: `2026-09-06T23:30:54`
- Kết quả: **PASS**

## Blocker đã sửa

1. Guard `macDinh` trước khi đọc `.id` để thỏa TypeScript strict.
2. Static money scan không còn coi `===` là assignment.

## File thay đổi

- `apps/mobile/src/app/thanh-toan.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Default address guard | PASS | Đã guard undefined trước khi đọc macDinh.id |
| Backend address query | PASS | Checkout vẫn dùng Address Book Backend |
| Default address guard | PASS | No TS18048 path |
| No local address form | PASS | Không quay lại draft local |
| Backend total source | PASS | Tổng hiển thị từ preview |
| Backend shipping source | PASS | Shipping từ preview |
| Create-order adapter | PASS | Generated client |
| Idempotency key preserved | PASS | POST /don-hang contract |
| Backend address id preserved | PASS | POST /don-hang contract |
| Expected unit price only | PASS | Backend re-validates current price |
| UI still not submitting order | PASS | Submit remains MOBILE-FIX-007 |
| No manual checkout money calculation | PASS | Không thấy assignment/arithmetic tiền ở Checkout screen; comparison === không còn bị bắt nhầm |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-006 + 006B PASS.**

Checkout Contract V2 đã đạt static/type validation:

- Address Book Backend thật.
- Backend preview là source of truth cho price/shipping/total.
- Create-order adapter đúng contract.
- Mobile không tự tính final total.
- UI chưa submit order ở phiên này.

Phiên tiếp theo: **MOBILE-FIX-007 — COD End-to-End**.

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 1.94s
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/admin-web typecheck: Generating route types...
apps/admin-web typecheck: ✓ Types generated successfully
apps/customer-web typecheck: Generating route types...
apps/customer-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Done
apps/customer-web typecheck: Done
apps/mobile typecheck: Done
```

### `git diff --check`

Exit code: `0`

```text

```
