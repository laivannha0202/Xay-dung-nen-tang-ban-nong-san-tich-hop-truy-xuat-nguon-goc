# MOBILE-FIX-022 — Docs Sync

- Thời gian: `2026-09-07T11:31:30`
- Kết quả: **PASS**

## Docs authority

- Root `README.md` giữ overview hệ thống.
- `docs/MOBILE-APP.md` là tài liệu authoritative cho Mobile runtime/development/test/deploy readiness.

## Nội dung đã đồng bộ

- runtime versions + app identity;
- generated API client architecture;
- API base URL cho localhost/emulator/LAN;
- navigation/public/protected routes;
- auth refresh/returnTo/logout;
- checkout/COD/VNPay;
- order/payment/shipment;
- review/complaint;
- account;
- push production prerequisites;
- performance;
- unit/integration tests;
- Maestro E2E;
- GitHub Actions CI;
- remaining Security/Android/Final Demo sessions.

## File thay đổi

- `docs/MOBILE-APP.md`
- `README.md`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 021 ci:validate | PASS | CI validator exists |
| 019 Mobile tests | PASS | Unit/contract suite exists |
| 020 E2E validator | PASS | Maestro config suite exists |
| 021 Mobile CI workflow | PASS | GitHub Actions exists |
| 020 EAS E2E workflow | PASS | Cloud E2E remains opt-in |
| Navigation helper | PASS | 017 docs source |
| Auth returnTo sanitizer | PASS | 004/015 docs source |
| Mobile architecture docs | PASS | Generated-client boundary documented |
| Runtime API docs | PASS | Emulator/physical-device runtime documented |
| Navigation/auth docs | PASS | 004/017 behavior documented |
| Checkout/payment docs | PASS | 006–009 flows documented |
| Push prerequisites docs | PASS | 012 prerequisites explicit |
| Test/E2E/CI docs | PASS | 019–021 documented |
| Remaining acceptance docs | PASS | No false production-complete claim |
| README Mobile docs link | PASS | Root README points to authoritative Mobile doc |
| README stale Push note removed | PASS | Push wording matches 012 production contract |
| Managed README block unique | PASS | No duplicate docs section |
| Mobile doc path references exist | PASS | All documented project paths exist |
| No secret values in Mobile doc | PASS | Only variable names documented |
| No fake production claim | PASS | 024 acceptance remains explicit |
| No stale Expo Go custom-scheme claim | PASS | Native-build requirement preserved |
| pnpm --filter @agrimarket/mobile test | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile e2e:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile ci:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-022 PASS.**

Phiên tiếp theo: **MOBILE-FIX-023 — Security Review**.

## Command logs

### `pnpm --filter @agrimarket/mobile test`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/navigation-auth.test.cjs test/api-response.test.cjs test/api-contract.test.cjs
✔ OpenAPI keeps critical Mobile operations (1.225221ms)
✔ Generated API client contains critical operations and facet hook (21.672797ms)
✔ Register DTO validation remains aligned with Mobile 015 (0.277697ms)
✔ Navigation and performance architecture remains wired (0.538453ms)
✔ duLieuApi unwraps generated HTTP response data (1.2382ms)
✔ duLieuApi preserves already-unwrapped values (0.167051ms)
✔ chuanHoaReturnTo accepts safe internal routes (1.009241ms)
✔ chuanHoaReturnTo normalizes absent or unsafe values to a safe internal fallback (0.605145ms)
✔ quayLaiHoacVe uses router.back when history exists (0.751942ms)
✔ quayLaiHoacVe replaces with fallback when history is empty (0.174068ms)
✔ moTabChinh uses navigate instead of push semantics (0.159412ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 385.011239
```

### `pnpm --filter @agrimarket/mobile e2e:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/e2e-config.test.cjs
✔ Expo app identity matches E2E suite (0.849701ms)
✔ EAS has installable Android e2e-test APK profile (0.186758ms)
✔ All Maestro flows target the configured Android package (0.335903ms)
✔ Maestro suite covers launch, tab back, guest protection and deep links (0.351906ms)
✔ EAS workflow builds e2e-test APK then runs all Maestro flows (0.317039ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 66.514848
```

### `pnpm --filter @agrimarket/mobile ci:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/ci-config.test.cjs
✔ Mobile CI uses repository runtime versions and frozen lockfile (1.120243ms)
✔ Mobile CI runs 019 and 020 deterministic gates (0.168724ms)
✔ Mobile CI stays secret-free and does not trigger paid EAS or Maestro runtime (0.193129ms)
✔ Mobile CI has least-privilege permissions and bounded runtime (0.224423ms)
✔ Mobile package exposes unit, e2e validator and CI validator scripts (0.314539ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 74.098315
```

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 596ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
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
