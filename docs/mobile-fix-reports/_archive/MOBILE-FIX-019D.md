# MOBILE-FIX-019D — Test Assertion + Lint Repair

- Thời gian: `2026-09-07T11:12:56`
- Kết quả: **FAIL**

## 019D runner repair

- 019C crash trước khi patch vì `re.sub()` parse `\u0000` trong replacement string.
- 019D dùng callback `lambda _match: replacement` để replacement được chèn nguyên văn.
- Không thay đổi app/runtime/business logic.

## Root cause

1. Test 019B giả định `chuanHoaReturnTo(undefined)` phải trả falsy.
2. Contract thực tế cho phép sanitizer trả một route fallback nội bộ an toàn.
3. Ba test `.cjs` dùng `require()` và bị rule TypeScript ESLint chung chặn.

## Repair

- Không sửa `auth-navigation.ts`.
- Test unsafe input theo security invariant của output.
- Không cho dangerous input sống sót nguyên trạng.
- Chỉ disable `@typescript-eslint/no-require-imports` trong đúng 3 file CJS test.
- Không thay ESLint config chung.

## File thay đổi

- `apps/mobile/test/navigation-auth.test.cjs`
- `apps/mobile/test/api-response.test.cjs`
- `apps/mobile/test/api-contract.test.cjs`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 019B Mobile test script | PASS | Node test runner already added |
| 019B three test files | PASS | Unit/contract tests exist |
| Known failing assertion present | PASS | Expected pre-019C assertion |
| Auth sanitizer preserved | PASS | App code not modified |
| Navigation helper preserved | PASS | 017 behavior remains |
| ReturnTo safe-fallback assertion | PASS | Test matches current sanitizer contract |
| Open-redirect security assertions | PASS | Security coverage remains strict |
| navigation-auth.test.cjs require lint | PASS | Local eslint disable only |
| api-response.test.cjs require lint | PASS | Local eslint disable only |
| api-contract.test.cjs require lint | PASS | Local eslint disable only |
| No shared ESLint config change | PASS | 019C touches test files only |
| Safe returnTo tests still include valid routes | PASS | Positive sanitizer cases preserved |
| Navigation behavior tests preserved | PASS | 017 unit coverage preserved |
| API response tests preserved | PASS | 002 unit coverage preserved |
| Contract integration tests preserved | PASS | Cross-layer coverage preserved |
| All CJS lint disables narrow | PASS | Only no-require-imports suppressed in CJS tests |
| pnpm --filter @agrimarket/mobile test | PASS | exit=0 |
| pnpm lint | FAIL | exit=1 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-019D chưa đạt. Không chuyển sang 020.**

Các mục fail:

- [ ] pnpm lint: exit=1

## Command logs

### `pnpm --filter @agrimarket/mobile test`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/navigation-auth.test.cjs test/api-response.test.cjs test/api-contract.test.cjs
✔ OpenAPI keeps critical Mobile operations (1.220936ms)
✔ Generated API client contains critical operations and facet hook (83.664401ms)
✔ Register DTO validation remains aligned with Mobile 015 (3.616997ms)
✔ Navigation and performance architecture remains wired (2.288898ms)
✔ duLieuApi unwraps generated HTTP response data (1.088365ms)
✔ duLieuApi preserves already-unwrapped values (0.210918ms)
✔ chuanHoaReturnTo accepts safe internal routes (1.079816ms)
✔ chuanHoaReturnTo normalizes absent or unsafe values to a safe internal fallback (0.326616ms)
✔ quayLaiHoacVe uses router.back when history exists (0.672129ms)
✔ quayLaiHoacVe replaces with fallback when history is empty (0.167055ms)
✔ moTabChinh uses navigate instead of push semantics (0.253888ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 406.075922
```

### `pnpm lint`

Exit code: `1`

```text
$ eslint .

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/api/test/dong-goi.e2e-spec.ts
  66:17  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile/test/navigation-auth.test.cjs
  161:9   error  Unexpected control character(s) in regular expression: \x00, \x1f  no-control-regex
  189:14  error  Unexpected control character(s) in regular expression: \x00, \x1f  no-control-regex

✖ 3 problems (2 errors, 1 warning)

[ELIFECYCLE] Command failed with exit code 1.
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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 574ms
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
apps/customer-web typecheck: Generating route types...
apps/customer-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Done
apps/customer-web typecheck: Done
apps/mobile typecheck: Done
```

### `git diff --check`

Exit code: `0`

```text

```
