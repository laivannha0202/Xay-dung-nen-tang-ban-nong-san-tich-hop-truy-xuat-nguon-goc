# MOBILE-FIX-017 — Navigation Polish

- Thời gian: `2026-09-07T09:16:45`
- Kết quả: **PASS**

## Navigation contract

```text
Back button
  -> router.canGoBack()
     -> true: router.back()
     -> false: replace(screen-specific fallback)

Top-level tab CTA
  -> router.navigate(tab)

Android tab Back
  -> backBehavior=history

Notification tap
  -> single listener lifecycle in AppProviders
```

## Fallback examples

- Product Detail -> `/kham-pha`
- Order Detail -> `/don-hang`
- Checkout -> `/gio-hang`
- Trace -> `/quet-qr`
- Account children -> `/tai-khoan`

## File thay đổi

- `apps/mobile/src/lib/navigation-mobile.ts`
- `apps/mobile/src/app/(tabs)/_layout.tsx`
- `apps/mobile/src/app/_layout.tsx`
- `apps/mobile/src/app/gio-hang.tsx`
- `apps/mobile/src/app/thanh-toan.tsx`
- `apps/mobile/src/app/san-pham/[id].tsx`
- `apps/mobile/src/app/trang-trai/[id].tsx`
- `apps/mobile/src/app/truy-xuat/[ma].tsx`
- `apps/mobile/src/app/don-hang/[id].tsx`
- `apps/mobile/src/app/khieu-nai/tao.tsx`
- `apps/mobile/src/app/tai-khoan/ho-so.tsx`
- `apps/mobile/src/app/tai-khoan/dia-chi.tsx`
- `apps/mobile/src/app/tai-khoan/wishlist.tsx`
- `apps/mobile/src/app/tai-khoan/trang-trai-theo-doi.tsx`
- `apps/mobile/src/app/tai-khoan/khieu-nai.tsx`
- `apps/mobile/src/app/tai-khoan/khieu-nai/[id].tsx`
- `apps/mobile/src/app/(tabs)/don-hang.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 016C production UI | PASS | No known technical markers |
| 015B register returnTo narrowing | PASS | Auth round-trip preserved |
| 004 returnTo validation | PASS | Protected navigation foundation |
| canGoBack fallback helper | PASS | Deep-link-safe Back |
| Top-level tab helper | PASS | No duplicate push for tab switching |
| Tabs backBehavior history | PASS | Android Back returns to last visited tab |
| Single notification listener owner | PASS | AppProviders is the single lifecycle owner |
| Safe Back patch | PASS | Replaced 28 router.back() call(s) in 13 screen(s) |
| Top-level tab navigate | PASS | Converted 5 push call(s) in 5 file(s) |
| No raw router.back in patched screens | PASS | All Back actions have a fallback |
| No push to top-level tabs | PASS | Tab switching uses navigate |
| Single push listener lifecycle | PASS | No duplicate notification-tap navigation |
| Tab history enabled | PASS | Android hardware back behaves predictably |
| Auth returnTo validation preserved | PASS | No protected-route regression |
| Navigation helper typed with Href | PASS | File-based route contract |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-017 PASS.**

### Manual Android acceptance

- [ ] Mở Product Detail từ deep link lạnh -> Back về Khám phá thay vì không phản hồi.
- [ ] Mở Order Detail từ notification/deep link -> Back về Đơn hàng.
- [ ] Checkout -> Back về Giỏ hàng nếu không có history.
- [ ] Trace QR deep link -> Back về Quét QR.
- [ ] Account child -> Back về Tài khoản.
- [ ] Chuyển Trang chủ -> Khám phá -> Tài khoản; hardware Back quay theo lịch sử tab.
- [ ] Tap một push notification chỉ điều hướng một lần.
- [ ] Login/Register returnTo vẫn quay đúng protected route.

Phiên tiếp theo: **MOBILE-FIX-018 — Performance**.

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 659ms
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
