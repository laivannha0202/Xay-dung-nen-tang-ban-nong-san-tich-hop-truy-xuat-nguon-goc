# MOBILE-FIX-023G — Push AST Security Repair

- Thời gian: `2026-09-07T15:43:14`
- Kết quả: **PASS**

## Repair

- Không sửa runtime Push.
- Bỏ text/regex/indexOf/compact-source checks.
- Parse `thong-bao-push.ts` bằng TypeScript AST.
- Kiểm tra sanitizer/parser/router bằng node type thay vì formatting.

## File thay đổi

- `apps/mobile/test/security-config.test.cjs`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 023F Push test exists | PASS | Known failing Push test exists |
| Secret checks retained | PASS | Strong secret checks retained |
| Auth checks retained | PASS | returnTo security retained |
| Push runtime functions exist | PASS | AST targets exist |
| security:validate retained | PASS | Local + CI gate retained |
| Push test block located | PASS | Located without source regex |
| TypeScript AST enabled | PASS | Actual TypeScript syntax parsed |
| Function AST search | PASS | No formatting dependence |
| Call AST search | PASS | Sanitizer/parser/router calls checked structurally |
| Property path AST | PASS | Arguments checked structurally |
| Brittle compact checker removed | PASS | 023F text matcher removed |
| Other security tests preserved | PASS | 023 coverage retained |
| Mobile production dependency audit | PASS | No high/critical advisory intersects Mobile/API-client path |
| Monorepo advisories outside Mobile scope | WARN | High advisories remain outside Mobile scope: API, Admin Web; remediate before production of affected components |
| pnpm --filter @agrimarket/mobile security:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile test | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile e2e:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile ci:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile exec expo install --check | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-023 PASS cho phạm vi Mobile.**

Advisory API/Admin ngoài Mobile scope vẫn cần remediation riêng.

Phiên tiếp theo: **MOBILE-FIX-024 — Android Acceptance**.

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

Exit code: `0`

```text
$ node --test --test-reporter=spec test/security-config.test.cjs
✔ Repository does not track real env files or private-key material (33.252029ms)
✔ Tracked text files do not contain common high-confidence secret tokens (31.229894ms)
✔ Sensitive env variables are not committed with non-placeholder values (38.387552ms)
✔ Auth returnTo security regression remains covered (0.319276ms)
✔ Mobile does not persist auth secrets through AsyncStorage or log obvious secret fields (12.584564ms)
✔ Mobile raw fetch boundary allows only local asset URI conversion (8.003096ms)
✔ Payment return screen verifies backend state instead of trusting deep-link status (0.280874ms)
✔ Push tap/deep-link handling validates an internal allowlisted path before routing (249.121559ms)
✔ Mobile CI is read-only, secret-free and runs security validator (0.532393ms)
✔ Maestro E2E flows do not embed credentials (0.664573ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 455.893156
```

### `pnpm --filter @agrimarket/mobile test`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/navigation-auth.test.cjs test/api-response.test.cjs test/api-contract.test.cjs
✔ OpenAPI keeps critical Mobile operations (1.181019ms)
✔ Generated API client contains critical operations and facet hook (20.708322ms)
✔ Register DTO validation remains aligned with Mobile 015 (0.237703ms)
✔ Navigation and performance architecture remains wired (0.399475ms)
✔ duLieuApi unwraps generated HTTP response data (1.255302ms)
✔ duLieuApi preserves already-unwrapped values (0.286847ms)
✔ chuanHoaReturnTo accepts safe internal routes (0.909702ms)
✔ chuanHoaReturnTo normalizes absent or unsafe values to a safe internal fallback (0.588074ms)
✔ quayLaiHoacVe uses router.back when history exists (1.000375ms)
✔ quayLaiHoacVe replaces with fallback when history is empty (0.205593ms)
✔ moTabChinh uses navigate instead of push semantics (0.243429ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 393.518782
```

### `pnpm --filter @agrimarket/mobile e2e:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/e2e-config.test.cjs
✔ Expo app identity matches E2E suite (1.366425ms)
✔ EAS has installable Android e2e-test APK profile (0.208062ms)
✔ All Maestro flows target the configured Android package (0.435409ms)
✔ Maestro suite covers launch, tab back, guest protection and deep links (0.355394ms)
✔ EAS workflow builds e2e-test APK then runs all Maestro flows (0.196071ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 74.662571
```

### `pnpm --filter @agrimarket/mobile ci:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/ci-config.test.cjs
✔ Mobile CI uses repository runtime versions and frozen lockfile (0.873206ms)
✔ Mobile CI runs 019 and 020 deterministic gates (0.172422ms)
✔ Mobile CI stays secret-free and does not trigger paid EAS or Maestro runtime (0.163461ms)
✔ Mobile CI has least-privilege permissions and bounded runtime (0.176573ms)
✔ Mobile package exposes unit, e2e validator and CI validator scripts (0.364626ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 70.363176
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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 708ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
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
