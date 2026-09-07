# MOBILE-FIX-024A-WAYDROID

- Time: `2026-09-07T16:06:31`
- Result: **FAIL**

## Meaning

PASS here means the Android runtime acceptance available in Waydroid is green.
It does not replace physical-device acceptance for camera, FCM push, OEM permission/lifecycle and mobile-network behavior.

## Runtime

- Waydroid target: `192.168.240.112:5555` — WayDroid x86_64 Device, Android 13, API 33

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| MOBILE-FIX-023 security review | PASS | 023G report confirms Mobile security PASS |
| Java/JDK >= 17 | PASS | major=17; openjdk version "17.0.20" 2026-07-21 |
| Android SDK | PASS | /home/nha/Android/Sdk |
| adb | PASS | /usr/bin/adb |
| Waydroid ADB target | PASS | 192.168.240.112:5555   device product:lineage_waydroid_x86_64 model:WayDroid_x86_64_Device device:waydroid_x86_64 transport_id:1 |
| Waydroid Android runtime | PASS | WayDroid x86_64 Device; Android 13; API 33 |
| Android appId | PASS | com.agrimarket.mobile |
| App scheme | PASS | agrimarket |
| EAS projectId | WARN | Missing; not required for Waydroid core runtime, required later for production push |
| google-services.json | WARN | Missing; deferred to physical-device push acceptance |
| AgriMarket native build installed in Waydroid | FAIL | com.agrimarket.mobile not installed<br>Install a native/dev build first. Target: 192.168.240.112:5555 |
| Waydroid runtime smoke | FAIL | Requires connected Waydroid and installed com.agrimarket.mobile native/development build |
| pnpm --filter @agrimarket/mobile security:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile test | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile e2e:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile ci:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile exec expo install --check | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Conclusion

**MOBILE-FIX-024A-WAYDROID FAIL. Do not move to 024B yet.**

Required failures:

- [ ] AgriMarket native build installed in Waydroid: com.agrimarket.mobile not installed
Install a native/dev build first. Target: 192.168.240.112:5555
- [ ] Waydroid runtime smoke: Requires connected Waydroid and installed com.agrimarket.mobile native/development build

## Command logs

### `/usr/bin/java -version`

Exit: `0`

```text
openjdk version "17.0.20" 2026-07-21
OpenJDK Runtime Environment (build 17.0.20+8-1-26.04-Ubuntu)
OpenJDK 64-Bit Server VM (build 17.0.20+8-1-26.04-Ubuntu, mixed mode, sharing)
```

### `/usr/bin/adb devices -l`

Exit: `0`

```text
List of devices attached
192.168.240.112:5555   device product:lineage_waydroid_x86_64 model:WayDroid_x86_64_Device device:waydroid_x86_64 transport_id:1

```

### `/usr/bin/adb -s 192.168.240.112:5555 shell getprop ro.product.model`

Exit: `0`

```text
WayDroid x86_64 Device
```

### `/usr/bin/adb -s 192.168.240.112:5555 shell getprop ro.product.name`

Exit: `0`

```text
lineage_waydroid_x86_64
```

### `/usr/bin/adb -s 192.168.240.112:5555 shell getprop ro.build.version.release`

Exit: `0`

```text
13
```

### `/usr/bin/adb -s 192.168.240.112:5555 shell getprop ro.build.version.sdk`

Exit: `0`

```text
33
```

### `/usr/bin/adb -s 192.168.240.112:5555 shell pm path com.agrimarket.mobile`

Exit: `1`

```text

```

### `pnpm --filter @agrimarket/mobile security:validate`

Exit: `0`

```text
$ node --test --test-reporter=spec test/security-config.test.cjs
✔ Repository does not track real env files or private-key material (36.300953ms)
✔ Tracked text files do not contain common high-confidence secret tokens (36.828216ms)
✔ Sensitive env variables are not committed with non-placeholder values (40.290543ms)
✔ Auth returnTo security regression remains covered (0.336574ms)
✔ Mobile does not persist auth secrets through AsyncStorage or log obvious secret fields (12.329066ms)
✔ Mobile raw fetch boundary allows only local asset URI conversion (12.037847ms)
✔ Payment return screen verifies backend state instead of trusting deep-link status (0.654866ms)
✔ Push tap/deep-link handling validates an internal allowlisted path before routing (240.019461ms)
✔ Mobile CI is read-only, secret-free and runs security validator (0.4263ms)
✔ Maestro E2E flows do not embed credentials (0.475759ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 466.223548
```

### `pnpm --filter @agrimarket/mobile test`

Exit: `0`

```text
$ node --test --test-reporter=spec test/navigation-auth.test.cjs test/api-response.test.cjs test/api-contract.test.cjs
✔ OpenAPI keeps critical Mobile operations (1.323641ms)
✔ Generated API client contains critical operations and facet hook (23.210148ms)
✔ Register DTO validation remains aligned with Mobile 015 (0.27909ms)
✔ Navigation and performance architecture remains wired (0.458712ms)
✔ duLieuApi unwraps generated HTTP response data (0.984438ms)
✔ duLieuApi preserves already-unwrapped values (0.36494ms)
✔ chuanHoaReturnTo accepts safe internal routes (1.149166ms)
✔ chuanHoaReturnTo normalizes absent or unsafe values to a safe internal fallback (0.670694ms)
✔ quayLaiHoacVe uses router.back when history exists (0.979367ms)
✔ quayLaiHoacVe replaces with fallback when history is empty (0.224881ms)
✔ moTabChinh uses navigate instead of push semantics (0.176102ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 423.702506
```

### `pnpm --filter @agrimarket/mobile e2e:validate`

Exit: `0`

```text
$ node --test --test-reporter=spec test/e2e-config.test.cjs
✔ Expo app identity matches E2E suite (1.074094ms)
✔ EAS has installable Android e2e-test APK profile (0.23127ms)
✔ All Maestro flows target the configured Android package (0.474021ms)
✔ Maestro suite covers launch, tab back, guest protection and deep links (0.419461ms)
✔ EAS workflow builds e2e-test APK then runs all Maestro flows (0.393569ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 78.365946
```

### `pnpm --filter @agrimarket/mobile ci:validate`

Exit: `0`

```text
$ node --test --test-reporter=spec test/ci-config.test.cjs
✔ Mobile CI uses repository runtime versions and frozen lockfile (1.281602ms)
✔ Mobile CI runs 019 and 020 deterministic gates (0.205793ms)
✔ Mobile CI stays secret-free and does not trigger paid EAS or Maestro runtime (0.219256ms)
✔ Mobile CI has least-privilege permissions and bounded runtime (0.162732ms)
✔ Mobile package exposes unit, e2e validator and CI validator scripts (0.359449ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 77.314572
```

### `pnpm --filter @agrimarket/mobile exec expo install --check`

Exit: `0`

```text
Dependencies are up to date
```

### `pnpm --filter @agrimarket/mobile typecheck`

Exit: `0`

```text
$ pnpm --filter @agrimarket/api-client ensure
$ node tools/dam-bao-generated.mjs
$ tsc --noEmit
```

### `pnpm lint`

Exit: `0`

```text
$ eslint .

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/api/test/dong-goi.e2e-spec.ts
  66:17  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

✖ 1 problem (0 errors, 1 warning)

```

### `pnpm typecheck`

Exit: `0`

```text
$ tsc --noEmit -p tsconfig.json && pnpm -r --filter './apps/**' --filter './packages/**' --if-present run typecheck
Scope: 8 of 9 workspace projects
apps/api typecheck$ prisma generate --config prisma7.config.ts && tsc --noEmit -p tsconfig.json
packages/api-client typecheck$ pnpm run ensure && tsc --noEmit -p tsconfig.json
packages/api-client typecheck: $ node tools/dam-bao-generated.mjs
apps/api typecheck: Loaded Prisma config from prisma7.config.ts.
apps/api typecheck: Prisma schema loaded from prisma/schema.prisma.
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 613ms
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
apps/customer-web pretypecheck: Done
apps/admin-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/customer-web typecheck: Generating route types...
apps/admin-web typecheck: Generating route types...
apps/customer-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Done
apps/customer-web typecheck: Done
apps/mobile typecheck: Done
```

### `git diff --check`

Exit: `0`

```text

```
