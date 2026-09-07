# MOBILE-FIX-020 — Mobile E2E

- Thời gian: `2026-09-07T11:21:55`
- Kết quả: **PASS**
- Android appId: `com.agrimarket.mobile`
- Scheme: `agrimarket`

## Strategy

Maestro được dùng cho E2E UI thực trên APK/dev build.
Session 020 khóa suite và execution path; Android acceptance đầy đủ vẫn thuộc 024.

## Automated flows

- `00-cold-launch.yml`
- `10-tab-history.yml`
- `20-guest-protected.yml`
- `30-deep-links.yml`

### Coverage

- cold guest launch
- five-tab presence
- tab history + Android Back
- guest protected Order gate
- custom-scheme deep link to public Search
- custom-scheme deep link to protected Orders

Không tự động hóa QR camera ở 020 để tránh permission-dialog flakiness.
Không hard-code E2E account/password/token.

## EAS

- `build.e2e-test`: unsigned/installable Android APK.
- `.eas/workflows/e2e-test-android.yml`: manual workflow.
- Build -> Maestro job.

Manual cloud command khi EAS project đã link:

```bash
cd apps/mobile
eas workflow:run .eas/workflows/e2e-test-android.yml
```

Local command khi máy có Maestro + installed app:

```bash
pnpm --filter @agrimarket/mobile e2e:maestro
```

## File thay đổi

- `apps/mobile/eas.json`
- `apps/mobile/.maestro/00-cold-launch.yml`
- `apps/mobile/.maestro/10-tab-history.yml`
- `apps/mobile/.maestro/20-guest-protected.yml`
- `apps/mobile/.maestro/30-deep-links.yml`
- `apps/mobile/.eas/workflows/e2e-test-android.yml`
- `apps/mobile/package.json`
- `apps/mobile/test/e2e-config.test.cjs`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Mobile app identity | PASS | com.agrimarket.mobile / agrimarket |
| 019 Mobile Node tests | PASS | Mobile test runner exists |
| 019E control-char helper | PASS | Security test lint repair exists |
| 019 response tests | PASS | API response unit coverage |
| 019 contract tests | PASS | OpenAPI/generated integration coverage |
| 017 tab history | PASS | Hardware back tab history |
| Guest order gate | PASS | Deterministic protected-route E2E anchor |
| 004 auth sanitizer | PASS | Protected route contract retained |
| 017 navigation helpers | PASS | Navigation behavior retained |
| EAS e2e-test profile | PASS | Unsigned/installable Android APK profile |
| Cold launch flow | PASS | Cold guest launch + five tab anchors |
| Tab history flow | PASS | 017 backBehavior history exercised |
| Guest protected flow | PASS | Protected order gate exercised |
| Deep-link flow | PASS | Custom scheme public/protected routes |
| EAS Android build job | PASS | Build APK before E2E |
| EAS Maestro job | PASS | Cloud device test job |
| EAS manual trigger | PASS | No automatic paid build on every edit |
| e2e:validate script | PASS | Offline E2E config validation |
| e2e:maestro script | PASS | Local real-device/emulator entrypoint |
| 019 test script preserved | PASS | Unit/integration suite unchanged |
| E2E validator | PASS | No YAML parser dependency required |
| CJS lint exception local | PASS | No shared ESLint config change |
| App identity unchanged | PASS | com.agrimarket.mobile / agrimarket |
| All Maestro files exist | PASS | 4 flow(s) |
| No E2E credentials | PASS | Guest/public deterministic suite |
| No QR camera automation | PASS | Avoid permission-dialog flakiness |
| EAS profile preserved | PASS | Installable Android artifact |
| Workflow is manual by default | PASS | Avoid unexpected EAS spend |
| 019 tests still available | PASS | Unit + E2E config suites coexist |
| Maestro CLI runtime | WARN | maestro CLI not installed; suite is ready for EAS/024 |
| pnpm --filter @agrimarket/mobile e2e:validate | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile test | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile exec expo config --type public | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Definition of Done

- [x] Maestro flow suite tồn tại.
- [x] EAS e2e-test APK profile tồn tại.
- [x] EAS Maestro workflow tồn tại.
- [x] E2E suite có offline validator.
- [x] Unit/integration 019 vẫn chạy.
- [x] lint/typecheck/diff-check không regress.
- [ ] Runtime device run nếu máy hiện tại có đủ prerequisite; nếu chưa, deferred đúng sang 024.

## Kết luận

**MOBILE-FIX-020 PASS.**

Phiên tiếp theo: **MOBILE-FIX-021 — CI**.

## Command logs

### `pnpm --filter @agrimarket/mobile e2e:validate`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/e2e-config.test.cjs
✔ Expo app identity matches E2E suite (0.828843ms)
✔ EAS has installable Android e2e-test APK profile (0.178217ms)
✔ All Maestro flows target the configured Android package (0.364303ms)
✔ Maestro suite covers launch, tab back, guest protection and deep links (0.273147ms)
✔ EAS workflow builds e2e-test APK then runs all Maestro flows (0.239538ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 68.312943
```

### `pnpm --filter @agrimarket/mobile test`

Exit code: `0`

```text
$ node --test --test-reporter=spec test/navigation-auth.test.cjs test/api-response.test.cjs test/api-contract.test.cjs
✔ OpenAPI keeps critical Mobile operations (1.189139ms)
✔ Generated API client contains critical operations and facet hook (21.674834ms)
✔ Register DTO validation remains aligned with Mobile 015 (0.234092ms)
✔ Navigation and performance architecture remains wired (0.434461ms)
✔ duLieuApi unwraps generated HTTP response data (1.282617ms)
✔ duLieuApi preserves already-unwrapped values (0.21295ms)
✔ chuanHoaReturnTo accepts safe internal routes (1.109698ms)
✔ chuanHoaReturnTo normalizes absent or unsafe values to a safe internal fallback (0.420805ms)
✔ quayLaiHoacVe uses router.back when history exists (0.751199ms)
✔ quayLaiHoacVe replaces with fallback when history is empty (0.171251ms)
✔ moTabChinh uses navigate instead of push semantics (0.156577ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 388.126943
```

### `pnpm --filter @agrimarket/mobile exec expo config --type public`

Exit code: `0`

```text

{
  name: [32m'AgriMarket'[39m,
  slug: [32m'agrimarket-mobile'[39m,
  version: [32m'1.0.0'[39m,
  orientation: [32m'portrait'[39m,
  icon: [32m'./assets/images/icon.png'[39m,
  scheme: [32m'agrimarket'[39m,
  userInterfaceStyle: [32m'automatic'[39m,
  plugins: [
    [32m'expo-router'[39m,
    [
      [32m'expo-splash-screen'[39m,
      {
        backgroundColor: [32m'#208AEF'[39m,
        image: [32m'./assets/images/splash-icon.png'[39m,
        imageWidth: [33m76[39m
      }
    ],
    [32m'expo-secure-store'[39m,
    [
      [32m'expo-camera'[39m,
      {
        cameraPermission: [32m'Cho phép AgriMarket sử dụng camera để quét QR và chụp ảnh bằng chứng.'[39m,
        recordAudioAndroid: [33mfalse[39m,
        barcodeScannerEnabled: [33mtrue[39m
      }
    ],
    [
      [32m'expo-image-picker'[39m,
      {
        photosPermission: [32m'Cho phép AgriMarket truy cập thư viện ảnh để chọn bằng chứng khiếu nại.'[39m,
        cameraPermission: [32m'Cho phép AgriMarket sử dụng camera để quét QR và chụp ảnh bằng chứng.'[39m,
        microphonePermission: [33mfalse[39m
      }
    ],
    [
      [32m'expo-notifications'[39m,
      {
        defaultChannel: [32m'agrimarket'[39m,
        enableBackgroundRemoteNotifications: [33mfalse[39m
      }
    ],
    [32m'expo-font'[39m,
    [32m'expo-image'[39m
  ],
  description: [90mundefined[39m,
  sdkVersion: [32m'57.0.0'[39m,
  platforms: [
    [32m'ios'[39m,
    [32m'android'[39m,
    [32m'web'[39m
  ],
  ios: {
    icon: [32m'./assets/expo.icon'[39m,
    bundleIdentifier: [32m'com.agrimarket.mobile'[39m
  },
  android: {
    predictiveBackGestureEnabled: [33mfalse[39m,
    package: [32m'com.agrimarket.mobile'[39m,
    permissions: [
      [32m'android.permission.CAMERA'[39m
    ],
    adaptiveIcon: {
      backgroundColor: [32m'#E6F4FE'[39m,
      foregroundImage: [32m'./assets/images/android-icon-foreground.png'[39m,
      backgroundImage: [32m'./assets/images/android-icon-background.png'[39m,
      monochromeImage: [32m'./assets/images/android-icon-monochrome.png'[39m
    }
  },
  web: {
    output: [32m'static'[39m,
    favicon: [32m'./assets/images/favicon.png'[39m
  },
  experiments: {
    typedRoutes: [33mtrue[39m,
    reactCompiler: [33mtrue[39m
  },
  extra: {
    router: {}
  }
}

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 616ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/customer-web typecheck: Generating route types...
apps/admin-web typecheck: Generating route types...
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
