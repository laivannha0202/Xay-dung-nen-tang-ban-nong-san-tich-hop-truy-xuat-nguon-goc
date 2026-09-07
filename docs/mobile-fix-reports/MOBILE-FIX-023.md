# MOBILE-FIX-023 — Security Review

- Thời gian: `2026-09-07T12:11:38`
- Kết quả: **FAIL**

## Security gates

- tracked `.env` leakage;
- private-key material;
- high-confidence token patterns;
- sensitive env assignment values;
- returnTo/open-redirect regression;
- auth-secret storage/logging regression;
- raw backend fetch boundary;
- payment result backend-trust boundary;
- push/deep-link safety boundary;
- CI least privilege;
- E2E credential leakage;
- production dependency audit high/critical.

## Notes

- `pnpm audit` registry/network outage is WARN.
- A real high/critical production advisory is FAIL.
- Security validator is deterministic and added to Mobile CI.
- No secrets are generated, rotated or written by this session.
- Android runtime/manifest/network acceptance remains session 024.

## File thay đổi

- `apps/mobile/test/security-config.test.cjs`
- `apps/mobile/package.json`
- `.github/workflows/mobile-ci.yml`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 022 authoritative Mobile docs | PASS | Docs synced through session 022 |
| 021 CI validator | PASS | Security gate can be added to CI |
| 020 E2E validator | PASS | E2E security surface exists |
| 019 unit tests | PASS | Auth/navigation regression suite exists |
| 004 returnTo foundation | PASS | Open-redirect sanitizer exists |
| 019E control-char coverage | PASS | ReturnTo control-char regression coverage exists |
| Security validator file | PASS | Secret/auth/payment boundaries |
| Security validator CJS lint exception local | PASS | No shared lint relaxation |
| security:validate script | PASS | Repeatable local/CI security gate |
| Previous scripts preserved | PASS | 019–021 gates retained |
| CI security gate | PASS | Security validator runs on PR/push |
| CI remains secret-free | PASS | No credential/write expansion |
| No security-rule blanket disable | PASS | Only CJS require rule is locally disabled |
| Secret scanning is tracked-file scoped | PASS | Avoids node_modules/build noise |
| Auth storage/log checks | PASS | Token exposure regression gate |
| Raw backend fetch check | FAIL | 002 architecture boundary |
| Payment trust-boundary check | PASS | 008 backend status remains source of truth |
| CI least privilege retained | PASS | Security gate without secrets |
| Docs still declare remaining Android acceptance | PASS | No false security/production-complete claim |
| pnpm production audit | FAIL | High/critical production dependency advisory detected; inspect audit output |
| pnpm --filter @agrimarket/mobile security:validate | FAIL | exit=1 |
| pnpm --filter @agrimarket/mobile test | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile e2e:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile ci:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile exec expo install --check | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-023 chưa đạt. Không chuyển sang 024.**

Các mục fail:

- [ ] Raw backend fetch check: 002 architecture boundary
- [ ] pnpm production audit: High/critical production dependency advisory detected; inspect audit output
- [ ] pnpm --filter @agrimarket/mobile security:validate: exit=1

## Command logs

### `pnpm audit --prod --audit-level high`

Exit code: `1`

```text
┌─────────────────────┬────────────────────────────────────────────────────────┐
│ high                │ path-to-regexp vulnerable to Denial of Service via     │
│                     │ sequential optional groups                             │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Package             │ path-to-regexp                                         │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Vulnerable versions │ >=8.0.0 <8.4.0                                         │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Patched versions    │ >=8.4.0                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Paths               │ apps__admin-web>@ant-design/pro-components>@ant-       │
│                     │ design/pro-layout>path-to-regexp                       │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ More info           │ https://github.com/advisories/GHSA-j3q9-mxjg-w52f      │
└─────────────────────┴────────────────────────────────────────────────────────┘
┌─────────────────────┬────────────────────────────────────────────────────────┐
│ high                │ DeepmergeTS has stack exhaustion when merging          │
│                     │ recursive object graphs                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Package             │ deepmerge-ts                                           │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Vulnerable versions │ <8.0.0                                                 │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Patched versions    │ >=8.0.0                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Paths               │ apps__api>@prisma/client>prisma>@prisma/               │
│                     │ config>deepmerge-ts                                    │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ More info           │ https://github.com/advisories/GHSA-ggr8-5vv4-36mx      │
└─────────────────────┴────────────────────────────────────────────────────────┘
┌─────────────────────┬────────────────────────────────────────────────────────┐
│ high                │ MariaDB's connector leaks the cleartext password to an │
│                     │ MitM despite `ssl: true`                               │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Package             │ mariadb                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Vulnerable versions │ >=3.4.0 <3.4.6                                         │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Patched versions    │ >=3.4.7                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Paths               │ apps__api>@prisma/adapter-mariadb>mariadb              │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ More info           │ https://github.com/advisories/GHSA-cqhc-2h57-wpxf      │
└─────────────────────┴────────────────────────────────────────────────────────┘
┌─────────────────────┬────────────────────────────────────────────────────────┐
│ high                │ MySQL2: Auth Plugin Downgrade to mysql_clear_password  │
│                     │ Leaks Plaintext Credentials                            │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Package             │ mysql2                                                 │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Vulnerable versions │ <3.22.0                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Patched versions    │ >=3.22.0                                               │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Paths               │ apps__api>@prisma/client>prisma>mysql2                 │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ More info           │ https://github.com/advisories/GHSA-3f6p-5ww8-9rcr      │
└─────────────────────┴────────────────────────────────────────────────────────┘
┌─────────────────────┬────────────────────────────────────────────────────────┐
│ high                │ Nodemailer: Message-level raw option bypasses          │
│                     │ disableFileAccess/disableUrlAccess, enabling arbitrary │
│                     │ file read and full-response SSRF in the delivered      │
│                     │ message                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Package             │ nodemailer                                             │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Vulnerable versions │ <=9.0.0                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Patched versions    │ >=9.0.1                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Paths               │ apps__api>nodemailer                                   │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ More info           │ https://github.com/advisories/GHSA-p6gq-j5cr-w38f      │
└─────────────────────┴────────────────────────────────────────────────────────┘
13 vulnerabilities found
Severity: 8 moderate | 5 high
```

### `pnpm --filter @agrimarket/mobile security:validate`

Exit code: `1`

```text
$ node --test --test-reporter=spec test/security-config.test.cjs
✔ Repository does not track real env files or private-key material (204.016646ms)
✔ Tracked text files do not contain common high-confidence secret tokens (35.291634ms)
✖ Sensitive env variables are not committed with non-placeholder values (40.72411ms)
✖ Auth returnTo security regression remains covered (0.409436ms)
✔ Mobile does not persist auth secrets through AsyncStorage or log obvious secret fields (11.27721ms)
✔ Mobile raw fetch boundary allows only local asset URI conversion (6.953237ms)
✔ Payment return screen verifies backend state instead of trusting deep-link status (0.385155ms)
✖ Push tap/deep-link handling keeps an internal-route safety boundary (0.449939ms)
✔ Mobile CI is read-only, secret-free and runs security validator (0.321688ms)
✔ Maestro E2E flows do not embed credentials (1.047095ms)
ℹ tests 10
ℹ suites 0
ℹ pass 7
ℹ fail 3
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 378.091724

✖ failing tests:

test at test/security-config.test.cjs:190:1
✖ Sensitive env variables are not committed with non-placeholder values (40.72411ms)
  AssertionError [ERR_ASSERTION]: Sensitive env assignments: DATABASE_URL:.env.example
  + actual - expected

  + [
  +   'DATABASE_URL:.env.example'
  + ]
  - []

      at TestContext.<anonymous> (/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile/test/security-config.test.cjs:274:12)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: [ 'DATABASE_URL:.env.example' ],
    expected: [],
    operator: 'deepStrictEqual',
    diff: 'simple'
  }

test at test/security-config.test.cjs:282:1
✖ Auth returnTo security regression remains covered (0.409436ms)
  AssertionError [ERR_ASSERTION]: Missing returnTo security case: /abc\def

  false !== true

      at TestContext.<anonymous> (/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile/test/security-config.test.cjs:312:14)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: 'strictEqual',
    diff: 'simple'
  }

test at test/security-config.test.cjs:533:1
✖ Push tap/deep-link handling keeps an internal-route safety boundary (0.449939ms)
  AssertionError [ERR_ASSERTION]: External scheme must not be passed directly to Expo Router

  true !== false

      at TestContext.<anonymous> (/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile/test/security-config.test.cjs:551:12)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: true,
    expected: false,
    operator: 'strictEqual',
    diff: 'simple'
  }
/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @agrimarket/mobile@0.0.0 security:validate: `node --test --test-reporter=spec test/security-config.test.cjs`
Exit status 1
```

### `pnpm --filter @agrimarket/mobile test`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/navigation-auth.test.cjs test/api-response.test.cjs test/api-contract.test.cjs
✔ OpenAPI keeps critical Mobile operations (1.253914ms)
✔ Generated API client contains critical operations and facet hook (86.061125ms)
✔ Register DTO validation remains aligned with Mobile 015 (0.318658ms)
✔ Navigation and performance architecture remains wired (0.360362ms)
✔ duLieuApi unwraps generated HTTP response data (1.156055ms)
✔ duLieuApi preserves already-unwrapped values (0.164508ms)
✔ chuanHoaReturnTo accepts safe internal routes (1.404761ms)
✔ chuanHoaReturnTo normalizes absent or unsafe values to a safe internal fallback (0.642576ms)
✔ quayLaiHoacVe uses router.back when history exists (0.867507ms)
✔ quayLaiHoacVe replaces with fallback when history is empty (0.212657ms)
✔ moTabChinh uses navigate instead of push semantics (0.163813ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 435.753548
```

### `pnpm --filter @agrimarket/mobile e2e:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/e2e-config.test.cjs
✔ Expo app identity matches E2E suite (0.798056ms)
✔ EAS has installable Android e2e-test APK profile (0.423549ms)
✔ All Maestro flows target the configured Android package (0.516508ms)
✔ Maestro suite covers launch, tab back, guest protection and deep links (0.328492ms)
✔ EAS workflow builds e2e-test APK then runs all Maestro flows (0.602737ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 69.038516
```

### `pnpm --filter @agrimarket/mobile ci:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/ci-config.test.cjs
✔ Mobile CI uses repository runtime versions and frozen lockfile (0.833791ms)
✔ Mobile CI runs 019 and 020 deterministic gates (0.230357ms)
✔ Mobile CI stays secret-free and does not trigger paid EAS or Maestro runtime (0.186676ms)
✔ Mobile CI has least-privilege permissions and bounded runtime (0.180167ms)
✔ Mobile package exposes unit, e2e validator and CI validator scripts (0.35827ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 69.806741
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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 588ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/customer-web typecheck: Generating route types...
apps/admin-web typecheck: Generating route types...
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
