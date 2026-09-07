# MOBILE-FIX-001 — Báo cáo tự động

- Thời gian: `2026-09-06T22:18:45`
- Repo: `/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc`
- Kết quả bắt buộc: **FAIL**

## Checklist

| Check | Required | Status | Chi tiết |
|---|:---:|:---:|---|
| Linux | NO | PASS | Linux 7.0.0-30-generic |
| Node.js | YES | PASS | installed=v24.20.0 \| repo=>=24 <25 |
| pnpm | YES | PASS | installed=11.24.0 \| repo=pnpm@11.24.0 |
| Java/JDK | NO | WARN | [Errno 2] No such file or directory: 'java' |
| ADB | NO | PASS | Android Debug Bridge version 1.0.41 |
| ANDROID_HOME / ANDROID_SDK_ROOT | NO | WARN | Chưa cấu hình — không bắt buộc nếu chỉ dùng điện thoại thật + Expo Go |
| Android device qua ADB | NO | WARN | Không có thiết bị ADB đang kết nối |
| Dependency expo | YES | PASS | ~57.0.20 |
| Dependency react | YES | PASS | 19.2.3 |
| Dependency react-native | YES | PASS | 0.86.3 |
| Dependency expo-router | YES | PASS | ~57.0.19 |
| Dependency expo-camera | YES | PASS | ~57.0.4 |
| Dependency expo-secure-store | YES | PASS | ~57.0.3 |
| Dependency expo-image-picker | YES | PASS | ~57.0.16 |
| Dependency expo-notifications | YES | PASS | ~57.0.17 |
| Dependency expo-image | YES | PASS | ~57.0.4 |
| Dependency @tanstack/react-query | YES | PASS | 5.102.8 |
| app.json | YES | PASS | apps/mobile/app.json |
| metro.config.js | YES | PASS | apps/mobile/metro.config.js |
| Expo scheme | YES | PASS | scheme='agrimarket' |
| Expo Router typedRoutes | NO | PASS | typedRoutes=True |
| Expo plugin expo-router | YES | PASS | configured |
| Expo plugin expo-secure-store | YES | PASS | configured |
| Expo plugin expo-camera | YES | PASS | configured |
| Expo plugin expo-notifications | YES | PASS | configured |
| LAN IP detect | NO | PASS | 192.168.100.226 |
| .env.example | YES | PASS | Đã tạo apps/mobile/.env.example |
| Backend bind 0.0.0.0 | YES | PASS | Backend có bind 0.0.0.0 |
| Command: pnpm install | YES | PASS | exit=0 |
| Command: pnpm dlx expo-doctor@latest | YES | PASS | exit=0 |
| Command: pnpm exec expo install --check | YES | PASS | exit=0 |
| Command: pnpm exec expo config --type public | YES | PASS | exit=0 |
| Command: pnpm lint | YES | FAIL | exit=1 |
| Command: pnpm typecheck | YES | PASS | exit=0 |
| Command: git diff --check | YES | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-001 CHƯA đạt Definition of Done tự động.**

Các mục bắt buộc đang fail:

- [ ] Command: pnpm lint

Sửa các lỗi trên rồi chạy lại script này.

## Ghi chú optional

Java/ADB/ANDROID_HOME không bắt buộc nếu chỉ dùng **Android physical device + Expo Go**. Chúng cần thiết khi dùng Android Emulator hoặc native Development Build.

## Command logs

### `pnpm install`

Exit code: `0`

```text
Scope: all 9 workspace projects
Already up to date
Done in 2s using pnpm v11.24.0
```

### `pnpm dlx expo-doctor@latest`

Exit code: `0`

```text
Running 21 checks on your project...
21/21 checks passed. No issues detected!
```

### `pnpm exec expo install --check`

Exit code: `0`

```text
Dependencies are up to date
```

### `pnpm exec expo config --type public`

Exit code: `0`

```text
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

Exit code: `1`

```text
$ eslint .

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/.farm-ui-v3-backup/20260906-095543/apps/customer-web/src/components/chi-tiet-san-pham-content.tsx
  20:3  error  'ThemeIcon' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/.farm-ui-v3-backup/20260906-095543/apps/customer-web/src/components/chi-tiet-trang-trai-content.tsx
  17:3  error  'ThemeIcon' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/api/src/modules/chi-tra-nha-cung-cap/dto/phan-hoi-chi-tra-nha-cung-cap.dto.ts
  1:23  error  'ApiPropertyOptional' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/api/test/dong-goi.e2e-spec.ts
  66:17  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/customer-web/src/components/checkout-content.tsx
  15:3  error  'TextInput' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/customer-web/src/components/chi-tiet-san-pham-content.tsx
  20:3  error  'ThemeIcon' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/customer-web/src/components/chi-tiet-trang-trai-content.tsx
  17:3  error  'ThemeIcon' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

✖ 7 problems (6 errors, 1 warning)

[ELIFECYCLE] Command failed with exit code 1.
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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 2.34s
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
