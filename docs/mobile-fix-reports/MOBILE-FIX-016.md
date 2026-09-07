# MOBILE-FIX-016 — UI Production Cleanup

- Thời gian: `2026-09-07T09:01:36`
- Kết quả: **FAIL**

## Removed customer-facing implementation language

- `PHIEN-*`
- `Backend Cart` / `Backend Orders`
- `Mobile Checkout` / `Checkout Preview`
- `Draft tại Mobile` / `Backend boundary`
- `Expo Camera`
- `Search / List / Filter`
- EAS/FCM/ExpoPushToken/development-build diagnostic wording

Business logic, generated API calls, auth returnTo, checkout, push runtime và search facets không bị đổi.

## File thay đổi

- `apps/mobile/src/app/(auth)/_layout.tsx`
- `apps/mobile/src/app/(auth)/dang-ky.tsx`
- `apps/mobile/src/app/(auth)/dang-nhap.tsx`
- `apps/mobile/src/app/(auth)/quen-mat-khau.tsx`
- `apps/mobile/src/app/(tabs)/_layout.tsx`
- `apps/mobile/src/app/(tabs)/don-hang.tsx`
- `apps/mobile/src/app/(tabs)/index.tsx`
- `apps/mobile/src/app/(tabs)/kham-pha.tsx`
- `apps/mobile/src/app/(tabs)/quet-qr.tsx`
- `apps/mobile/src/app/(tabs)/tai-khoan.tsx`
- `apps/mobile/src/app/_layout.tsx`
- `apps/mobile/src/app/don-hang/[id].tsx`
- `apps/mobile/src/app/gio-hang.tsx`
- `apps/mobile/src/app/khieu-nai/tao.tsx`
- `apps/mobile/src/app/san-pham/[id].tsx`
- `apps/mobile/src/app/tai-khoan/dia-chi.tsx`
- `apps/mobile/src/app/tai-khoan/ho-so.tsx`
- `apps/mobile/src/app/tai-khoan/khieu-nai/[id].tsx`
- `apps/mobile/src/app/tai-khoan/khieu-nai.tsx`
- `apps/mobile/src/app/tai-khoan/thong-bao.tsx`
- `apps/mobile/src/app/tai-khoan/trang-trai-theo-doi.tsx`
- `apps/mobile/src/app/tai-khoan/wishlist.tsx`
- `apps/mobile/src/app/thanh-toan/ket-qua.tsx`
- `apps/mobile/src/app/thanh-toan.tsx`
- `apps/mobile/src/app/trang-trai/[id].tsx`
- `apps/mobile/src/app/truy-xuat/[ma].tsx`
- `apps/mobile/src/components/auth/auth-field.tsx`
- `apps/mobile/src/components/auth/auth-shell.tsx`
- `apps/mobile/src/components/auth/session-auth-notice.tsx`
- `apps/mobile/src/components/design-system/badge.tsx`
- `apps/mobile/src/components/design-system/empty-error.tsx`
- `apps/mobile/src/components/design-system/farm-card.tsx`
- `apps/mobile/src/components/design-system/product-card.tsx`
- `apps/mobile/src/components/design-system/skeleton.tsx`
- `apps/mobile/src/components/home/harvest-product-card.tsx`
- `apps/mobile/src/components/home/home-section.tsx`
- `apps/mobile/src/components/man-hinh-placeholder.tsx`
- `apps/mobile/src/components/orders/danh-gia-muc-don-hang.tsx`
- `apps/mobile/src/components/search-filter/filter-bottom-sheet.tsx`
- `apps/mobile/src/components/trang-thai-api.tsx`
- `apps/mobile/src/components/ui/box/index.tsx`
- `apps/mobile/src/components/ui/box/index.web.tsx`
- `apps/mobile/src/components/ui/box/styles.tsx`
- `apps/mobile/src/components/ui/button/index.tsx`
- `apps/mobile/src/components/ui/card/index.tsx`
- `apps/mobile/src/components/ui/card/index.web.tsx`
- `apps/mobile/src/components/ui/card/styles.tsx`
- `apps/mobile/src/components/ui/gluestack-ui-provider/index.tsx`
- `apps/mobile/src/components/ui/gluestack-ui-provider/index.web.tsx`
- `apps/mobile/src/components/ui/heading/index.tsx`
- `apps/mobile/src/components/ui/heading/index.web.tsx`
- `apps/mobile/src/components/ui/heading/styles.tsx`
- `apps/mobile/src/components/ui/text/index.tsx`
- `apps/mobile/src/components/ui/text/index.web.tsx`
- `apps/mobile/src/components/ui/text/styles.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 015 register contract | PASS | Register alignment preserved |
| 015B returnTo narrowing | PASS | Register query params safe |
| 015B login register narrowing | PASS | Login -> Register params safe |
| Production copy patch | PASS | Processed 55 TSX files; edited 55 files |
| No customer-facing implementation markers | FAIL | 3 visible marker(s) remain |
| Home business semantics preserved | PASS | MOBILE-FIX-013 logic unchanged |
| Search dedicated facets preserved | PASS | MOBILE-FIX-014 logic unchanged |
| Push registration preserved | PASS | MOBILE-FIX-012 behavior retained |
| Push UI wording production-safe | PASS | No infrastructure detail rendered |
| No PHIEN marker anywhere in app/components | PASS | Session numbers removed |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | FAIL | exit=2 |

## Visible technical markers remaining

- `apps/mobile/src/app/(tabs)/tai-khoan.tsx` — `ExpoPushToken` — Quyền thông báo, ExpoPushToken, 5 event và deep-link diagnostics.
- `apps/mobile/src/app/don-hang/[id].tsx` — `Backend` — Review và khiếu nại đã được nối đúng Backend. Bằng chứng khiếu nại có thể chụp từ camera hoặc chọn từ thư viện ảnh.
- `apps/mobile/src/app/thanh-toan.tsx` — `development build` — Round-trip deep link dùng scheme `agrimarket`. Expo Go không đăng ký custom scheme của project; kiểm thử đầy đủ cần development build hoặc standalone app.

## Kết luận

**MOBILE-FIX-016 chưa đạt. Không chuyển sang 017.**

Các mục fail:

- [ ] No customer-facing implementation markers: 3 visible marker(s) remain
- [ ] git diff --check: exit=2

## Command logs

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 470ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/customer-web typecheck: Generating route types...
apps/customer-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Generating route types...
apps/admin-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Done
apps/customer-web typecheck: Done
apps/mobile typecheck: Done
```

### `git diff --check`

Exit code: `2`

```text
apps/mobile/src/app/tai-khoan/trang-trai-theo-doi.tsx:170: trailing whitespace.
+ chỉ quản lý danh sách farm follows. Thông báo thu hoạch mới thuộc
```
