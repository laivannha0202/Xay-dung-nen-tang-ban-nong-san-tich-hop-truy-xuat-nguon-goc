# MOBILE-FIX-023D — Push Validator Format Repair

- Thời gian: `2026-09-07T12:56:17`
- Kết quả: **FAIL**

## Root cause

- Runtime Push safety logic không fail.
- 023C vẫn dùng exact formatting ở một số điểm nên không nhận ra code đã format nhiều dòng.

## Repair

- Không sửa app runtime.
- Security test dùng whitespace-insensitive regex.
- Python static check extract function body và so thứ tự semantic.
- Giữ sanitizer/allowlist/raw-route prohibition.

## File thay đổi

- `apps/mobile/test/security-config.test.cjs`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 023C security validator exists | PASS | Known Push security test exists |
| 023B env repair preserved | PASS | Secret validator state preserved |
| 023B auth repair preserved | PASS | returnTo coverage preserved |
| Runtime Push parser | PASS | Parser exists |
| Runtime Push sanitizer | PASS | Sanitizer/allowlist exists |
| Security command retained | PASS | Local + CI security gate |
| Push security test replacement | PASS | Replaced 1 Push test block |
| Whitespace-insensitive sanitizer regex | PASS | No exact formatting dependency |
| Whitespace-insensitive parser-call regex | PASS | Parser call robust to line breaks |
| Whitespace-insensitive router regex | PASS | Router call robust to line breaks |
| Strong secret checks retained | PASS | Secret scanning unchanged |
| Payment/fetch checks retained | PASS | Other security gates preserved |
| Push parser body extracted | PASS | Function body parsed independently of formatting |
| Push handler body extracted | PASS | Routing handler parsed independently of formatting |
| Sanitizer before parser return | FAIL | Validate-before-return |
| Parser before router | FAIL | Parse-before-route |
| External links rejected | PASS | Protocol-relative/external schemes blocked |
| Allowlist retained | PASS | Only known internal route roots |
| Mobile production dependency audit | PASS | No high/critical advisory intersects Mobile/API-client dependency path |
| Monorepo advisories outside Mobile scope | WARN | High advisories remain outside Mobile scope: API, Admin Web; remediate before production of affected services/apps |
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

**MOBILE-FIX-023D chưa đạt. Không chuyển sang 024.**

Các mục fail:

- [ ] Sanitizer before parser return: Validate-before-return
- [ ] Parser before router: Parse-before-route
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
✔ Repository does not track real env files or private-key material (43.44542ms)
✔ Tracked text files do not contain common high-confidence secret tokens (41.985221ms)
✔ Sensitive env variables are not committed with non-placeholder values (42.589818ms)
✔ Auth returnTo security regression remains covered (0.291783ms)
✔ Mobile does not persist auth secrets through AsyncStorage or log obvious secret fields (7.407083ms)
✔ Mobile raw fetch boundary allows only local asset URI conversion (11.99705ms)
✔ Payment return screen verifies backend state instead of trusting deep-link status (0.326975ms)
✖ Push tap/deep-link handling validates an internal allowlisted path before routing (1.055866ms)
✔ Mobile CI is read-only, secret-free and runs security validator (0.362475ms)
✔ Maestro E2E flows do not embed credentials (0.603248ms)
ℹ tests 10
ℹ suites 0
ℹ pass 9
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 227.906725

✖ failing tests:

test at test/security-config.test.cjs:550:1
✖ Push tap/deep-link handling validates an internal allowlisted path before routing (1.055866ms)
  AssertionError [ERR_ASSERTION]: Parser must validate data.deepLink
      at TestContext.<anonymous> (/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile/test/security-config.test.cjs:578:12)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1397:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:969:18)
      at Test.postRun (node:internal/test_runner/test:1537:19)
      at Test.run (node:internal/test_runner/test:1462:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:969:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: null,
    expected: null,
    operator: 'notStrictEqual',
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
✔ OpenAPI keeps critical Mobile operations (1.587915ms)
✔ Generated API client contains critical operations and facet hook (28.240089ms)
✔ Register DTO validation remains aligned with Mobile 015 (0.26981ms)
✔ Navigation and performance architecture remains wired (0.525742ms)
✔ duLieuApi unwraps generated HTTP response data (1.901492ms)
✔ duLieuApi preserves already-unwrapped values (0.330311ms)
✔ chuanHoaReturnTo accepts safe internal routes (1.041539ms)
✔ chuanHoaReturnTo normalizes absent or unsafe values to a safe internal fallback (0.774013ms)
✔ quayLaiHoacVe uses router.back when history exists (0.924034ms)
✔ quayLaiHoacVe replaces with fallback when history is empty (0.206765ms)
✔ moTabChinh uses navigate instead of push semantics (0.183014ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 458.815313
```

### `pnpm --filter @agrimarket/mobile e2e:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/e2e-config.test.cjs
✔ Expo app identity matches E2E suite (1.012149ms)
✔ EAS has installable Android e2e-test APK profile (0.22552ms)
✔ All Maestro flows target the configured Android package (0.365335ms)
✔ Maestro suite covers launch, tab back, guest protection and deep links (0.315767ms)
✔ EAS workflow builds e2e-test APK then runs all Maestro flows (0.185054ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 83.715094
```

### `pnpm --filter @agrimarket/mobile ci:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/ci-config.test.cjs
✔ Mobile CI uses repository runtime versions and frozen lockfile (1.182446ms)
✔ Mobile CI runs 019 and 020 deterministic gates (0.190607ms)
✔ Mobile CI stays secret-free and does not trigger paid EAS or Maestro runtime (0.280996ms)
✔ Mobile CI has least-privilege permissions and bounded runtime (0.535125ms)
✔ Mobile package exposes unit, e2e validator and CI validator scripts (0.703647ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 83.585122
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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 690ms
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
