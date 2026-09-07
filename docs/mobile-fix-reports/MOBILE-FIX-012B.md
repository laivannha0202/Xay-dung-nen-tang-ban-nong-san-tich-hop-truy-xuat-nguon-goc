# MOBILE-FIX-012B — Push TypeScript Repair

- Thời gian: `2026-09-07T08:24:37`
- Kết quả: **PASS**

## Root cause

`noUncheckedIndexedAccess` khiến `batch[index]` có kiểu `Device | undefined`.
012 dùng trực tiếp `batch[index].id` ở hai vị trí nên API typecheck phát sinh TS2532.

## Fix

```ts
const device = batch[index];

if (!device) {
  continue;
}

// dùng device.id thay cho batch[index].id
```

## File thay đổi

- `apps/api/src/modules/thong-bao-push/thong-bao-push.service.ts`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Prisma push model | PASS | found |
| Expo sender exists | PASS | found |
| DeviceNotRegistered handling | PASS | found |
| NEW_HARVEST producer sender | PASS | found |
| Mobile Backend registration | PASS | found |
| Remote diagnostic UI | PASS | found |
| Strict index guard | PASS | noUncheckedIndexedAccess-safe |
| No unsafe batch[index].id | PASS | Both TS2532 sites removed |
| DeviceNotRegistered preserved | PASS | Dead-token cleanup unchanged |
| Push ticket logging preserved | PASS | Error telemetry unchanged |
| Expo batch size | PASS | Sender batching preserved |
| Expo HTTPS endpoint | PASS | Remote sender preserved |
| Optional Expo access token | PASS | Enhanced-security support preserved |
| Dead token deactivation | PASS | Invalid device cleanup |
| Mobile backend token registration | PASS | No client-only token regression |
| Cold-start deep-link | PASS | Push tap launch preserved |
| Safe internal deep-link | PASS | Open redirect prevention preserved |
| Remote diagnostic screen | PASS | Manual E2E surface preserved |
| pnpm --filter @agrimarket/api typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-012 + 012B PASS phần code/static/type validation.**

Các prerequisite production vẫn là manual:

- EAS project link/projectId.
- `apps/mobile/google-services.json`.
- FCM V1 credential trên EAS.
- `prisma migrate deploy` cho migration push device.
- Development build Android để nghiệm thu remote push thật.

Chỉ sau khi manual production acceptance hoàn tất mới chuyển sang **MOBILE-FIX-013 — Home Semantics**.

## Command logs

### `pnpm --filter @agrimarket/api typecheck`

Exit code: `0`

```text
$ prisma generate --config prisma7.config.ts && tsc --noEmit -p tsconfig.json
Loaded Prisma config from prisma7.config.ts.

Prisma schema loaded from prisma/schema.prisma.

✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 362ms

```

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 479ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
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
apps/mobile typecheck: Done
apps/customer-web typecheck: Done
apps/admin-web typecheck: Done
```

### `git diff --check`

Exit code: `0`

```text

```
