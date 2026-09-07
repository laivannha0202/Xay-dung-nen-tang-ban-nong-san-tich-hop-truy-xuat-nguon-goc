# MOBILE-FIX-012 — Push Production

- Thời gian: `2026-09-07T08:21:44`
- Kết quả static/type validation: **FAIL**

## Production flow

```text
Development/production build
  -> expo-notifications permission
  -> ExpoPushToken
  -> PUT /khach-hang/thiet-bi-push
  -> Prisma thiet_bi_push

Harvest created
  -> in-app ThongBaoThuHoach
  -> Backend ThongBaoPushService
  -> Expo Push Service
  -> FCM/APNs
  -> Mobile notification
  -> safe internal deep-link
```

## Scope truth

- NEW_HARVEST có producer Backend thật.
- ORDER_STATUS / SHIPMENT_STATUS / REFUND_STATUS / RECALL vẫn chỉ là payload contract; không tạo producer giả.
- Expo Go không dùng làm remote push acceptance.
- Script không tạo EAS/Firebase credentials giả và không tự migrate database production.

## File thay đổi

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260907090000_mobile_push_production/migration.sql`
- `apps/api/src/modules/thong-bao-push/dto/dang-ky-thiet-bi-push.dto.ts`
- `apps/api/src/modules/thong-bao-push/dto/phan-hoi-thiet-bi-push.dto.ts`
- `apps/api/src/modules/thong-bao-push/thong-bao-push.service.ts`
- `apps/api/src/modules/thong-bao-push/thong-bao-push.controller.ts`
- `apps/api/src/modules/thong-bao-push/thong-bao-push.module.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/modules/thu-hoach/thu-hoach.module.ts`
- `apps/api/src/modules/thu-hoach/thu-hoach.service.ts`
- `packages/api-client/openapi/agrimarket.json`
- `apps/mobile/src/lib/api-thong-bao.ts`
- `apps/mobile/src/lib/thong-bao-push.ts`
- `apps/mobile/src/providers/app-providers.tsx`
- `apps/mobile/src/app/(tabs)/tai-khoan.tsx`
- `apps/mobile/src/app/tai-khoan/thong-bao.tsx`
- `apps/mobile/eas.json`
- `.env.example`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Foundation apps/mobile/src/app/(tabs)/tai-khoan.tsx | PASS | found |
| Foundation apps/mobile/src/lib/api-thong-bao.ts | PASS | found |
| Foundation apps/mobile/src/lib/thong-bao-push.ts | PASS | found |
| Foundation apps/mobile/src/app/tai-khoan/thong-bao.tsx | PASS | found |
| Foundation apps/mobile/src/providers/app-providers.tsx | PASS | found |
| Foundation apps/mobile/app.json | PASS | found |
| Foundation apps/mobile/package.json | PASS | found |
| Foundation packages/api-client/openapi/agrimarket.json | PASS | found |
| Foundation apps/api/src/app.module.ts | PASS | found |
| Foundation apps/api/src/modules/thu-hoach/thu-hoach.module.ts | PASS | found |
| Foundation apps/api/src/modules/thu-hoach/thu-hoach.service.ts | PASS | found |
| 011 account complete | PASS | found |
| Push token acquisition | PASS | found |
| Push deep-link validation | PASS | found |
| expo-notifications plugin | PASS | found |
| Custom app scheme | PASS | found |
| pnpm --filter @agrimarket/mobile add expo-dev-client@~57.0.18 | PASS | exit=0 |
| Prisma push enum | PASS | ANDROID / IOS |
| Prisma push model | PASS | Persistent ExpoPushToken |
| NguoiDung push relation | PASS | Cascade ownership |
| Migration SQL | PASS | Create-only migration; database chưa tự apply |
| Device registration endpoint | PASS | PUT customer device token |
| Device unregister endpoint | PASS | DELETE current token |
| Remote diagnostic endpoint | PASS | Authenticated self-test |
| Expo Push Service sender | PASS | Backend remote sender |
| DeviceNotRegistered handling | PASS | Dead token deactivation |
| NEW_HARVEST payload | PASS | Real producer payload |
| AppModule push import | PASS | Push controller is reachable |
| ThuHoachModule push dependency | PASS | Harvest service can inject sender |
| ThuHoachService push injection | PASS | Server producer dependency |
| NEW_HARVEST producer | PASS | Push failure does not rollback harvest |
| OpenAPI register push | PASS | PUT operation |
| OpenAPI remote diagnostic | PASS | POST operation |
| pnpm api-client:generate | PASS | exit=0 |
| pnpm api-client:ensure | PASS | exit=0 |
| Generated dangKyThietBiPush | PASS | found |
| Generated huyDangKyThietBiPush | PASS | found |
| Generated guiThuPushCuaToi | PASS | found |
| Shared notification unwrap | PASS | MOBILE-FIX-002 boundary |
| Register device adapter | PASS | Generated client |
| Unregister device adapter | PASS | Generated client |
| Remote diagnostic adapter | PASS | Generated client |
| Development build guard | PASS | Expo Go is not remote-push acceptance |
| Backend device registration | PASS | ExpoPushToken persisted server-side |
| Logout unregister helper | PASS | Privacy on explicit logout |
| Cold-start notification | PASS | Deep-link on app launch |
| Tap listener | PASS | Foreground/background response |
| Safe deep links | PASS | No arbitrary external URL |
| Provider notification listener | PASS | Mounted once |
| Provider token auto-sync | PASS | Does not auto-prompt permission |
| Logout unregister | PASS | Unregister happens before auth session is cleared |
| Notification returnTo | PASS | Protected route |
| Remote registration UI | PASS | User-controlled permission prompt |
| Backend remote diagnostic UI | PASS | Actual server remote test |
| NEW_HARVEST source | PASS | In-app and remote deep-link parity |
| No fake production claim | PASS | Native credential boundary explicit |
| google-services.json | WARN | Chưa có apps/mobile/google-services.json; cần Firebase config trước EAS Android push build |
| EAS projectId | WARN | Không bịa UUID; EAS Build có Constants.easConfig fallback nhưng cần `eas init`/project link trước build |
| eas.json development build | PASS | Android APK internal development profile |
| EXPO_ACCESS_TOKEN env | PASS | Optional Expo Push enhanced security |
| Persistent device tokens | PASS | Prisma source of truth |
| Expo sender batching | PASS | Expo service batch size boundary |
| Dead token cleanup | PASS | Invalid token deactivation |
| Real NEW_HARVEST producer | PASS | Triggered after harvest transaction |
| Mobile registers token Backend | PASS | No client-only token |
| Notification lifecycle mounted | PASS | Tap/deep-link listeners active |
| Explicit logout unregister | PASS | Device privacy |
| Remote diagnostic | PASS | End-to-end manual acceptance surface |
| expo-dev-client dependency | PASS | Development build |
| expo-notifications plugin | PASS | Native notification plugin |
| No unsafe external push deep-link | PASS | Internal allowlist |
| pnpm --filter @agrimarket/api exec prisma format --schema prisma/schema.prisma | PASS | exit=0 |
| pnpm --filter @agrimarket/api exec prisma generate --config prisma7.config.ts | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile exec expo install --check | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile exec expo config --type public | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | FAIL | exit=2 |
| git diff --check | PASS | exit=0 |
| Android Firebase config | WARN | Cần Firebase google-services.json trước remote Android push build |
| EAS project link | WARN | Nếu app.json chưa có projectId, chạy eas init; EAS build vẫn cung cấp Constants.easConfig sau khi project được link |
| FCM V1 service account | WARN | Không thể xác minh credential trên EAS từ repo; cấu hình bằng `eas credentials`/EAS dashboard |
| Database migration apply | WARN | Deploy cần chạy Prisma migrate deploy để apply 20260907090000_mobile_push_production |

## Kết luận

**MOBILE-FIX-012 chưa đạt. Không chuyển sang 013.**

Các mục fail:

- [ ] pnpm typecheck: exit=2

## Command logs

### `pnpm --filter @agrimarket/mobile add expo-dev-client@~57.0.18`

Exit code: `0`

```text
✓ Lockfile passes supply-chain policies (verified 8h ago)
Progress: resolved 1, reused 0, downloaded 0, added 0
Progress: resolved 96, reused 0, downloaded 0, added 0
Progress: resolved 212, reused 0, downloaded 0, added 0
Progress: resolved 498, reused 0, downloaded 0, added 0
Progress: resolved 893, reused 0, downloaded 0, added 0
Progress: resolved 1133, reused 0, downloaded 0, added 0
Progress: resolved 1623, reused 0, downloaded 0, added 0
[WARN] 6 deprecated subdependencies found: cron-parser@4.9.0, glob@7.2.3, glob@9.3.5, inflight@1.0.6, uuid@7.0.3, uuid@9.0.1
Progress: resolved 1639, reused 0, downloaded 0, added 0
[WARN] Issues with peer dependencies found. Run "pnpm peers check" to list them.
Progress: resolved 1639, reused 122, downloaded 0, added 0
.                                        |   +7 -119 +------------
Progress: resolved 1639, reused 122, downloaded 4, added 4
Progress: resolved 1639, reused 122, downloaded 7, added 7, done
Done in 11.7s using pnpm v11.24.0
```

### `pnpm api-client:generate`

Exit code: `0`

```text
$ pnpm --filter @agrimarket/api-client generate
$ orval --config ./orval.config.ts
🍻 orval v8.26.0 - A swagger client generator for typescript
🎉 agrimarket - Your OpenAPI spec has been converted into ready to use orval!
```

### `pnpm api-client:ensure`

Exit code: `0`

```text
$ pnpm --filter @agrimarket/api-client ensure
$ node tools/dam-bao-generated.mjs
```

### `pnpm --filter @agrimarket/api exec prisma format --schema prisma/schema.prisma`

Exit code: `0`

```text
Loaded Prisma config from prisma7.config.ts.

Prisma schema loaded from prisma/schema.prisma.
Formatted prisma/schema.prisma in 52ms 🚀
```

### `pnpm --filter @agrimarket/api exec prisma generate --config prisma7.config.ts`

Exit code: `0`

```text
Loaded Prisma config from prisma7.config.ts.

Prisma schema loaded from prisma/schema.prisma.

✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 365ms

```

### `pnpm --filter @agrimarket/mobile exec expo install --check`

Exit code: `0`

```text
Dependencies are up to date
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

Exit code: `2`

```text
$ tsc --noEmit -p tsconfig.json && pnpm -r --filter './apps/**' --filter './packages/**' --if-present run typecheck
Scope: 8 of 9 workspace projects
apps/api typecheck$ prisma generate --config prisma7.config.ts && tsc --noEmit -p tsconfig.json
packages/api-client typecheck$ pnpm run ensure && tsc --noEmit -p tsconfig.json
packages/api-client typecheck: $ node tools/dam-bao-generated.mjs
apps/api typecheck: Loaded Prisma config from prisma7.config.ts.
apps/api typecheck: Prisma schema loaded from prisma/schema.prisma.
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 473ms
packages/api-client typecheck: Done
apps/api typecheck: src/modules/thong-bao-push/thong-bao-push.service.ts(329,19): error TS2532: Object is possibly 'undefined'.
apps/api typecheck: src/modules/thong-bao-push/thong-bao-push.service.ts(340,13): error TS2532: Object is possibly 'undefined'.
apps/api typecheck: Failed
/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/api:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @agrimarket/api@0.0.0 typecheck: `prisma generate --config prisma7.config.ts && tsc --noEmit -p tsconfig.json`
Exit status 2
[WARN]  Local package.json exists, but node_modules missing, did you mean to install?
[ELIFECYCLE] Command failed with exit code 2.
```

### `git diff --check`

Exit code: `0`

```text

```
