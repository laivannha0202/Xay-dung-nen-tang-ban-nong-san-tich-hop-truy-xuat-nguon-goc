# MOBILE-FIX-019E — Control Character Lint Repair

- Thời gian: `2026-09-07T11:16:08`
- Kết quả: **PASS**

## Root cause

- 019D đã đạt 11/11 Mobile tests.
- ESLint còn chặn hai regex control-range bởi rule `no-control-regex`.

## Repair

- Không disable `no-control-regex`.
- Thay regex bằng `hasControlCharacter()` dùng `charCodeAt(0)`.
- Vẫn phát hiện C0 control chars (0..31) và DEL (127).
- Không thay app/runtime/business.

## File thay đổi

- `apps/mobile/test/navigation-auth.test.cjs`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 019D safe-fallback test | PASS | Updated security assertion exists |
| Known no-control-regex source | PASS | Expected 019D lint leftover |
| Mobile Node test script | PASS | 019B test runner preserved |
| App auth sanitizer untouched | PASS | No runtime patch |
| Control regex removed | PASS | Replaced 2 no-control-regex occurrence(s) |
| CharCode helper added | PASS | Equivalent C0 + DEL detection |
| Security assertions preserved | PASS | Open-redirect coverage remains strict |
| Require lint-disable preserved | PASS | CJS require exception remains local |
| No no-control-regex pattern | PASS | No regex containing literal control range |
| Valid returnTo cases preserved | PASS | Positive auth navigation tests retained |
| Navigation tests preserved | PASS | 017 coverage retained |
| pnpm --filter @agrimarket/mobile test | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-019 + 019B + 019C + 019D + 019E PASS.**

Phiên tiếp theo: **MOBILE-FIX-020 — Mobile E2E**.

## Command logs

### `pnpm --filter @agrimarket/mobile test`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/navigation-auth.test.cjs test/api-response.test.cjs test/api-contract.test.cjs
✔ OpenAPI keeps critical Mobile operations (1.427013ms)
✔ Generated API client contains critical operations and facet hook (22.032758ms)
✔ Register DTO validation remains aligned with Mobile 015 (0.382198ms)
✔ Navigation and performance architecture remains wired (0.376952ms)
✔ duLieuApi unwraps generated HTTP response data (1.319697ms)
✔ duLieuApi preserves already-unwrapped values (0.165766ms)
✔ chuanHoaReturnTo accepts safe internal routes (0.932298ms)
✔ chuanHoaReturnTo normalizes absent or unsafe values to a safe internal fallback (0.469078ms)
✔ quayLaiHoacVe uses router.back when history exists (0.991846ms)
✔ quayLaiHoacVe replaces with fallback when history is empty (0.310978ms)
✔ moTabChinh uses navigate instead of push semantics (0.168238ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 383.684652
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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 608ms
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
