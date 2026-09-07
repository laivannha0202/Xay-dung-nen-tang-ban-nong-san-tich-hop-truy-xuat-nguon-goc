# MOBILE-FIX-023B — Security Scope Repair

- Thời gian: `2026-09-07T12:20:04`
- Kết quả: **FAIL**

## Root cause từ MOBILE-FIX-023

### False positives

1. `.env.example` chứa sample `DATABASE_URL` nhưng bị generic assignment heuristic coi là secret thật.
2. Backslash returnTo test đã tồn tại nhưng security validator so literal escape không đúng representation.
3. Push module đã sanitize + allowlist trước router, nhưng validator cũ chỉ thấy `://` và `router.push(payload.deepLink)` nên báo sai.
4. Python static check raw fetch dùng marker quá hẹp trong khi runtime security test đã PASS.

### Dependency audit

Root audit có advisory high ở API/Admin dependency paths.
023B không che giấu các advisory này: chúng được ghi WARN outside Mobile scope.
Nếu audit path có `apps__mobile` hoặc `packages__api-client` thì 023B FAIL.

## Runtime security invariants giữ nguyên

- tracked secret/private-key scans;
- auth returnTo/open redirect coverage;
- no auth secrets in AsyncStorage/logging;
- raw backend fetch boundary;
- payment result reads Backend state;
- push deepLink allowlist + sanitizer;
- read-only secret-free CI;
- credential-free Maestro flows.

## File thay đổi

- `apps/mobile/test/security-config.test.cjs`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 023 security validator exists | PASS | Known validator from 023 |
| 023 security script exists | PASS | Repeatable gate retained |
| 023 CI security gate exists | PASS | CI integration retained |
| Push sanitizer exists | PASS | Runtime push safety foundation |
| Push rejects external schemes | PASS | External/protocol-relative links rejected |
| .env.example assignment handling | PASS | Example files excluded only from generic assignment heuristic |
| returnTo backslash semantic check | PASS | Checks assertion invariant instead of JS escape literal |
| Push sanitizer semantic check | PASS | Validates allowlist/sanitizer-before-router |
| High-confidence secret scan preserved | PASS | No reduction of strong secret scanning |
| Sensitive env scan still exists | PASS | Only example-file false positive removed |
| Auth semantic regression preserved | PASS | Open redirect coverage remains |
| Push semantic regression preserved | PASS | Safe push routing invariant |
| Raw fetch runtime test preserved | PASS | 002 boundary remains tested |
| Raw backend fetch check defined | PASS | Runtime validator is authoritative |
| Push sanitizer runtime code unchanged | PASS | No app code security regression |
| Push routes parsed before router | FAIL | Validated payload routed |
| CI security gate retained | PASS | Least privilege CI remains |
| No app/runtime file modified by 023B | PASS | 023B only repairs test validator |
| Mobile production dependency audit | PASS | No high/critical advisory intersects Mobile/API-client dependency path |
| Monorepo advisories outside Mobile scope | WARN | High advisories found outside Mobile dependency path: apps__api, apps__admin-web; must be remediated before production of affected apps/services |
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

**MOBILE-FIX-023B chưa đạt. Không chuyển sang 024.**

Các mục fail:

- [ ] Push routes parsed before router: Validated payload routed
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
✔ Repository does not track real env files or private-key material (27.721931ms)
✔ Tracked text files do not contain common high-confidence secret tokens (25.361889ms)
✔ Sensitive env variables are not committed with non-placeholder values (29.590968ms)
✔ Auth returnTo security regression remains covered (0.299925ms)
✔ Mobile does not persist auth secrets through AsyncStorage or log obvious secret fields (5.168355ms)
✔ Mobile raw fetch boundary allows only local asset URI conversion (4.680756ms)
✔ Payment return screen verifies backend state instead of trusting deep-link status (0.264398ms)
✖ Push tap/deep-link handling validates an internal allowlisted path before routing (0.947555ms)
✔ Mobile CI is read-only, secret-free and runs security validator (0.194769ms)
✔ Maestro E2E flows do not embed credentials (0.422211ms)
ℹ tests 10
ℹ suites 0
ℹ pass 9
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 156.700099

✖ failing tests:

test at test/security-config.test.cjs:550:1
✖ Push tap/deep-link handling validates an internal allowlisted path before routing (0.947555ms)
  AssertionError [ERR_ASSERTION]: Notification payload must validate deepLink before returning payload

  false !== true

      at TestContext.<anonymous> (/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile/test/security-config.test.cjs:597:12)
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
/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @agrimarket/mobile@0.0.0 security:validate: `node --test --test-reporter=spec test/security-config.test.cjs`
Exit status 1
```

### `pnpm --filter @agrimarket/mobile test`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/navigation-auth.test.cjs test/api-response.test.cjs test/api-contract.test.cjs
✔ OpenAPI keeps critical Mobile operations (0.807227ms)
✔ Generated API client contains critical operations and facet hook (15.639225ms)
✔ Register DTO validation remains aligned with Mobile 015 (0.263716ms)
✔ Navigation and performance architecture remains wired (0.302414ms)
✔ duLieuApi unwraps generated HTTP response data (0.896464ms)
✔ duLieuApi preserves already-unwrapped values (0.161424ms)
✔ chuanHoaReturnTo accepts safe internal routes (0.88144ms)
✔ chuanHoaReturnTo normalizes absent or unsafe values to a safe internal fallback (0.443303ms)
✔ quayLaiHoacVe uses router.back when history exists (0.627649ms)
✔ quayLaiHoacVe replaces with fallback when history is empty (0.175663ms)
✔ moTabChinh uses navigate instead of push semantics (0.155275ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 284.964651
```

### `pnpm --filter @agrimarket/mobile e2e:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/e2e-config.test.cjs
✔ Expo app identity matches E2E suite (0.800987ms)
✔ EAS has installable Android e2e-test APK profile (0.173999ms)
✔ All Maestro flows target the configured Android package (0.317406ms)
✔ Maestro suite covers launch, tab back, guest protection and deep links (0.273263ms)
✔ EAS workflow builds e2e-test APK then runs all Maestro flows (0.169526ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 55.843612
```

### `pnpm --filter @agrimarket/mobile ci:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/ci-config.test.cjs
✔ Mobile CI uses repository runtime versions and frozen lockfile (0.800029ms)
✔ Mobile CI runs 019 and 020 deterministic gates (0.163716ms)
✔ Mobile CI stays secret-free and does not trigger paid EAS or Maestro runtime (0.155755ms)
✔ Mobile CI has least-privilege permissions and bounded runtime (0.140054ms)
✔ Mobile package exposes unit, e2e validator and CI validator scripts (0.309022ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 57.486406
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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 444ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/admin-web typecheck: Generating route types...
apps/customer-web typecheck: Generating route types...
apps/admin-web typecheck: ✓ Types generated successfully
apps/customer-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Done
apps/customer-web typecheck: Done
apps/mobile typecheck: Done
```

### `git diff --check`

Exit code: `0`

```text

```
