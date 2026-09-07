# MOBILE-FIX-015 — Register Alignment

- Thời gian: `2026-09-07T08:48:27`
- Kết quả: **FAIL**

## Backend contract

```text
email       IsEmail + max 191
matKhau     10..128
hoTen       2..150
soDienThoai optional, ^[0-9+]{9,20}$
```

## Auth flow

```text
Protected route
 -> Login(returnTo)
 -> Register(returnTo)
 -> registration success
 -> Login(returnTo)
 -> original protected route
```

Registration không auto-login vì Backend register response không chứa token.

## File thay đổi

- `apps/mobile/src/app/(auth)/dang-ky.tsx`
- `apps/mobile/src/app/(auth)/dang-nhap.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 014 public facet endpoint | PASS | Backend facet complete |
| 014 mobile facet hook | PASS | Mobile dedicated facets |
| 014 old 100 facet removed | PASS | No incomplete facets |
| Email IsEmail | PASS | Backend email format |
| Email max 191 | PASS | Backend email length |
| Password 10..128 | PASS | Backend password length |
| Full name 2..150 | PASS | Backend name length |
| Phone optional | PASS | Backend phone optional |
| Phone exact pattern | PASS | Backend phone regex |
| Register returns user only | PASS | No login tokens from registration |
| Login owns token issuance | PASS | Correct post-register flow |
| Generated register client | PASS | @agrimarket/api-client |
| Shared response unwrap | PASS | MOBILE-FIX-002 boundary |
| Shared auth errors | PASS | Normalized Backend errors |
| Register normalization | PASS | Adapter normalization preserved |
| No raw auth fetch | PASS | Generated API only |
| Email max 191 | PASS | Matches DTO |
| Password 10..128 | PASS | Matches DTO |
| Name 2..150 | PASS | Matches DTO |
| Phone 9..20 pattern | PASS | Matches DTO |
| Normalized submit | PASS | No whitespace mismatch |
| Backend error preserved | PASS | Backend remains final validation source |
| Register returnTo | PASS | Register -> Login preserves protected destination |
| No auto-login after register | PASS | Matches Backend register response |
| Login validated returnTo foundation | PASS | MOBILE-FIX-004 preserved |
| Login -> Register returnTo | PASS | Protected destination survives register detour |
| Login success returnTo preserved | PASS | Login still returns to protected route |
| Register route remains public | PASS | No auth guard |
| No raw register fetch | PASS | apiDangKy only |
| Only DTO fields submitted | PASS | Confirmation password stays client-only |
| Adapter exact register fields | PASS | Generated body boundary |
| ReturnTo not open redirect | PASS | Uses MOBILE-FIX-004 validation |
| Login register link preserves returnTo | PASS | Round-trip auth flow |
| pnpm api-client:ensure | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | FAIL | exit=2 |
| pnpm typecheck | FAIL | exit=2 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-015 chưa đạt. Không chuyển sang 016.**

Các mục fail:

- [ ] pnpm --filter @agrimarket/mobile typecheck: exit=2
- [ ] pnpm typecheck: exit=2

## Command logs

### `pnpm api-client:ensure`

Exit code: `0`

```text
$ pnpm --filter @agrimarket/api-client ensure
$ node tools/dam-bao-generated.mjs
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

Exit code: `2`

```text
$ pnpm --filter @agrimarket/api-client ensure
$ node tools/dam-bao-generated.mjs
$ tsc --noEmit
src/app/(auth)/dang-ky.tsx(75,7): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'ThamSoRoute'.
  Type 'null' is not assignable to type 'ThamSoRoute'.
src/app/(auth)/dang-nhap.tsx(74,13): error TS2345: Argument of type '"/dang-ky" | { pathname: "/dang-ky"; params: { returnTo: RelativePathString | ExternalPathString | "/gio-hang" | `/gio-hang?${string}` | `/gio-hang#${string}` | ... 118 more ... | { ...; }; }; }' is not assignable to parameter of type 'RelativePathString | ExternalPathString | "/gio-hang" | `/gio-hang?${string}` | `/gio-hang#${string}` | "/thanh-toan" | `/thanh-toan?${string}` | `/thanh-toan#${string}` | "/_sitemap" | ... 114 more ... | { ...; }'.
  Type '{ pathname: "/dang-ky"; params: { returnTo: RelativePathString | ExternalPathString | "/gio-hang" | `/gio-hang?${string}` | `/gio-hang#${string}` | "/thanh-toan" | ... 117 more ... | { ...; }; }; }' is not assignable to type 'RelativePathString | ExternalPathString | "/gio-hang" | `/gio-hang?${string}` | `/gio-hang#${string}` | "/thanh-toan" | `/thanh-toan?${string}` | `/thanh-toan#${string}` | "/_sitemap" | ... 114 more ... | { ...; }'.
    Types of property 'params' are incompatible.
      Type '{ returnTo: RelativePathString | ExternalPathString | "/gio-hang" | `/gio-hang?${string}` | `/gio-hang#${string}` | "/thanh-toan" | `/thanh-toan?${string}` | `/thanh-toan#${string}` | "/_sitemap" | ... 114 more ... | { ...; }; }' is not assignable to type 'UnknownInputParams'.
        Property 'returnTo' is incompatible with index signature.
          Type 'RelativePathString | ExternalPathString | "/gio-hang" | `/gio-hang?${string}` | `/gio-hang#${string}` | "/thanh-toan" | `/thanh-toan?${string}` | `/thanh-toan#${string}` | "/_sitemap" | ... 114 more ... | { ...; }' is not assignable to type 'string | number | (string | number)[] | null | undefined'.
            Type '{ pathname: RelativePathString; params?: UnknownInputParams | undefined; }' is not assignable to type 'string | number | (string | number)[] | null | undefined'.
/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @agrimarket/mobile@0.0.0 typecheck: `tsc --noEmit`
Exit status 2
```

### `pnpm typecheck`

Exit code: `2`

```text
$ tsc --noEmit -p tsconfig.json && pnpm -r --filter './apps/**' --filter './packages/**' --if-present run typecheck
Scope: 8 of 9 workspace projects
apps/api typecheck$ prisma generate --config prisma7.config.ts && tsc --noEmit -p tsconfig.json
packages/api-client typecheck$ pnpm run ensure && tsc --noEmit -p tsconfig.json
packages/api-client typecheck: $ node tools/dam-bao-generated.mjs
apps/api typecheck: Loaded Prisma config from prisma7.config.ts.
apps/api typecheck: Prisma schema loaded from prisma/schema.prisma.
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 2.47s
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
apps/mobile typecheck: src/app/(auth)/dang-ky.tsx(75,7): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'ThamSoRoute'.
apps/mobile typecheck:   Type 'null' is not assignable to type 'ThamSoRoute'.
apps/mobile typecheck: src/app/(auth)/dang-nhap.tsx(74,13): error TS2345: Argument of type '"/dang-ky" | { pathname: "/dang-ky"; params: { returnTo: RelativePathString | ExternalPathString | "/gio-hang" | `/gio-hang?${string}` | `/gio-hang#${string}` | ... 118 more ... | { ...; }; }; }' is not assignable to parameter of type 'RelativePathString | ExternalPathString | "/gio-hang" | `/gio-hang?${string}` | `/gio-hang#${string}` | "/thanh-toan" | `/thanh-toan?${string}` | `/thanh-toan#${string}` | "/_sitemap" | ... 114 more ... | { ...; }'.
apps/mobile typecheck:   Type '{ pathname: "/dang-ky"; params: { returnTo: RelativePathString | ExternalPathString | "/gio-hang" | `/gio-hang?${string}` | `/gio-hang#${string}` | "/thanh-toan" | ... 117 more ... | { ...; }; }; }' is not assignable to type 'RelativePathString | ExternalPathString | "/gio-hang" | `/gio-hang?${string}` | `/gio-hang#${string}` | "/thanh-toan" | `/thanh-toan?${string}` | `/thanh-toan#${string}` | "/_sitemap" | ... 114 more ... | { ...; }'.
apps/mobile typecheck:     Types of property 'params' are incompatible.
apps/mobile typecheck:       Type '{ returnTo: RelativePathString | ExternalPathString | "/gio-hang" | `/gio-hang?${string}` | `/gio-hang#${string}` | "/thanh-toan" | `/thanh-toan?${string}` | `/thanh-toan#${string}` | "/_sitemap" | ... 114 more ... | { ...; }; }' is not assignable to type 'UnknownInputParams'.
apps/mobile typecheck:         Property 'returnTo' is incompatible with index signature.
apps/mobile typecheck:           Type 'RelativePathString | ExternalPathString | "/gio-hang" | `/gio-hang?${string}` | `/gio-hang#${string}` | "/thanh-toan" | `/thanh-toan?${string}` | `/thanh-toan#${string}` | "/_sitemap" | ... 114 more ... | { ...; }' is not assignable to type 'string | number | (string | number)[] | null | undefined'.
apps/mobile typecheck:             Type '{ pathname: RelativePathString; params?: UnknownInputParams | undefined; }' is not assignable to type 'string | number | (string | number)[] | null | undefined'.
apps/mobile typecheck: Failed
/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @agrimarket/mobile@0.0.0 typecheck: `tsc --noEmit`
Exit status 2
[ELIFECYCLE] Command failed with exit code 2.
```

### `git diff --check`

Exit code: `0`

```text

```
