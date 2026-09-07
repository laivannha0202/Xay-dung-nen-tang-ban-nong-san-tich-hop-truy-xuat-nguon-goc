# MOBILE-FIX-021 — CI

- Thời gian: `2026-09-07T11:26:50`
- Kết quả: **PASS**

## GitHub Actions

- Workflow: `.github/workflows/mobile-ci.yml`
- Runner: `ubuntu-latest`
- Node: `24`
- pnpm: `11.24.0`
- Install: `pnpm install --frozen-lockfile`
- Permissions: `contents: read`
- Timeout: 25 minutes
- Concurrency cancels superseded runs.

## Trigger

- pull request -> `main`, `develop`
- push -> `main`, `develop`
- manual `workflow_dispatch`

## Quality gates

1. `pnpm api-client:ensure`
2. Mobile unit/contract tests (019)
3. E2E config tests (020)
4. Expo dependency compatibility
5. Mobile typecheck
6. Monorepo lint
7. Full workspace typecheck
8. `git diff --check`

## Explicitly excluded

- Root `pnpm test` / API Jest E2E (may require DB/services).
- EAS build.
- Maestro cloud/device runtime.
- Expo/Firebase secrets.
- GitHub write permission.

Actual Android runtime acceptance remains MOBILE-FIX-024.

## File thay đổi

- `.github/workflows/mobile-ci.yml`
- `apps/mobile/test/ci-config.test.cjs`
- `apps/mobile/package.json`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 020 e2e:validate script | PASS | Offline E2E validator exists |
| 020 e2e:maestro script | PASS | Real Maestro entrypoint exists |
| 020 E2E validator | PASS | E2E config tests exist |
| 019 unit suite retained | PASS | 019E security tests retained |
| 020 four Maestro flows | PASS | 4 flow(s) |
| 020 EAS workflow manual | PASS | Cloud E2E remains opt-in |
| Generated OpenAPI snapshot | PASS | api-client:ensure CI prerequisite |
| GitHub Actions triggers | PASS | PR/push/manual |
| Protected branches | PASS | main + develop |
| Read-only permissions | PASS | Least privilege |
| CI concurrency | PASS | Superseded runs cancelled |
| Current action generations | PASS | 2026-compatible actions |
| Locked runtime | PASS | Matches repository engines |
| Frozen lockfile | PASS | Reproducible install |
| Mobile quality commands | PASS | 019 + 020 gates |
| Workspace gates | PASS | No monorepo regression |
| CI validator file | PASS | Offline workflow contract test |
| CI validator lint exception local | PASS | No global ESLint change |
| ci:validate package script | PASS | Local/CI config gate |
| 019/020 scripts preserved | PASS | Previous test entrypoints retained |
| No CI secrets | PASS | No credential dependency |
| No automatic EAS | PASS | EAS/Maestro cloud stays opt-in |
| No full monorepo test | PASS | Avoid API DB-dependent Jest E2E |
| No write permission | PASS | CI cannot mutate repository |
| No generated file write command | PASS | CI verifies generated client; does not regenerate |
| pnpm --filter @agrimarket/mobile ci:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile test | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile e2e:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile exec expo install --check | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-021 PASS.**

Phiên tiếp theo: **MOBILE-FIX-022 — Docs Sync**.

## Command logs

### `pnpm --filter @agrimarket/mobile ci:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/ci-config.test.cjs
✔ Mobile CI uses repository runtime versions and frozen lockfile (0.894946ms)
✔ Mobile CI runs 019 and 020 deterministic gates (0.223564ms)
✔ Mobile CI stays secret-free and does not trigger paid EAS or Maestro runtime (0.153483ms)
✔ Mobile CI has least-privilege permissions and bounded runtime (0.180673ms)
✔ Mobile package exposes unit, e2e validator and CI validator scripts (0.313959ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 66.853637
```

### `pnpm --filter @agrimarket/mobile test`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/navigation-auth.test.cjs test/api-response.test.cjs test/api-contract.test.cjs
✔ OpenAPI keeps critical Mobile operations (1.190218ms)
✔ Generated API client contains critical operations and facet hook (22.785425ms)
✔ Register DTO validation remains aligned with Mobile 015 (0.256256ms)
✔ Navigation and performance architecture remains wired (0.356988ms)
✔ duLieuApi unwraps generated HTTP response data (1.64502ms)
✔ duLieuApi preserves already-unwrapped values (0.231209ms)
✔ chuanHoaReturnTo accepts safe internal routes (0.963761ms)
✔ chuanHoaReturnTo normalizes absent or unsafe values to a safe internal fallback (0.441133ms)
✔ quayLaiHoacVe uses router.back when history exists (0.733946ms)
✔ quayLaiHoacVe replaces with fallback when history is empty (0.173608ms)
✔ moTabChinh uses navigate instead of push semantics (0.25563ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 385.090518
```

### `pnpm --filter @agrimarket/mobile e2e:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/e2e-config.test.cjs
✔ Expo app identity matches E2E suite (0.971772ms)
✔ EAS has installable Android e2e-test APK profile (0.191346ms)
✔ All Maestro flows target the configured Android package (0.357517ms)
✔ Maestro suite covers launch, tab back, guest protection and deep links (0.379823ms)
✔ EAS workflow builds e2e-test APK then runs all Maestro flows (0.329341ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 64.998015
```

### `pnpm --filter @agrimarket/mobile exec expo install --check`

Exit code: `0`

```text
Dependencies are up to date
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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 589ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
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
