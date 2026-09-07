# MOBILE-FIX-015B — Register Return-To Type Repair

- Thời gian: `2026-09-07T08:54:55`
- Kết quả: **PASS**

## Root cause

```text
1) Register:
   layMotParam(...) -> string | null
   chuanHoaReturnTo(...) không nhận null

2) Login/Register query param:
   chuanHoaReturnTo(...) có Href-like type
   Href type có thể gồm object route
   Expo Router params chỉ nhận primitive string/number/array/null
```

## Fix

- Truyền `undefined` thay vì `null` vào `chuanHoaReturnTo`.
- Trước khi đưa `returnTo` vào query params, narrow bằng `typeof returnTo === 'string'`.
- Không đổi central auth-navigation contract.
- Không bỏ validation chống open redirect.

## File thay đổi

- `apps/mobile/src/app/(auth)/dang-ky.tsx`
- `apps/mobile/src/app/(auth)/dang-nhap.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 015 register validation | PASS | Register alignment patch exists |
| 015 register returnTo | PASS | Register -> Login round-trip exists |
| 015 login -> register returnTo | PASS | Login detour patch exists |
| Shared auth API | PASS | MOBILE-FIX-002 boundary preserved |
| Register null -> undefined | PASS | chuanHoaReturnTo no longer receives null |
| Register query param narrowed | PASS | Only string enters Expo Router params |
| Register safe validation preserved | PASS | No open-redirect regression |
| Login query param narrowed | PASS | Href object cannot enter UnknownInputParams |
| Login success returnTo untouched | PASS | Successful login routing preserved |
| No raw returnTo object in register params | PASS | Primitive query param only |
| No raw returnTo object in login register params | PASS | Primitive query param only |
| Register DTO alignment preserved | PASS | MOBILE-FIX-015 validation unchanged |
| Register no auto-login | PASS | Backend registration returns user only |
| ReturnTo still validated | PASS | Internal-route validation preserved |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-015 + 015B PASS.**

Luồng cần nghiệm thu:

```text
Checkout -> Login(returnTo=/thanh-toan)
         -> Register(returnTo=/thanh-toan)
         -> Login(returnTo=/thanh-toan)
         -> /thanh-toan
```

Phiên tiếp theo: **MOBILE-FIX-016 — UI Production Cleanup**.

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 635ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
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
