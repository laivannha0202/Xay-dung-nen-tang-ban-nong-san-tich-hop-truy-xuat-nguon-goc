# MOBILE-FIX-004 — Protected Route + Return-To + Pending Action

- Thời gian: `2026-09-06T22:43:56`
- Kết quả: **FAIL**

## Luồng sau phiên

```text
Product A
→ Add to Cart
→ chưa login
→ /dang-nhap?returnTo=/san-pham/A
→ Login
→ Product A
→ consume pendingAction
→ Add to Cart
```

```text
Cart / Checkout / Orders / Account / Order Detail / Complaint
→ Login
→ quay lại đúng route trước đó
```

## File thay đổi

- `apps/mobile/src/lib/auth-navigation.ts`
- `apps/mobile/src/app/(auth)/dang-nhap.tsx`
- `apps/mobile/src/app/san-pham/[id].tsx`
- `apps/mobile/src/app/gio-hang.tsx`
- `apps/mobile/src/app/thanh-toan.tsx`
- `apps/mobile/src/app/(tabs)/don-hang.tsx`
- `apps/mobile/src/app/(tabs)/tai-khoan.tsx`
- `apps/mobile/src/app/don-hang/[id].tsx`
- `apps/mobile/src/app/khieu-nai/tao.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| auth-navigation.ts | PASS | returnTo validator + login href + pending action store đã sẵn sàng |
| Login params | PASS | Đọc returnTo từ route params |
| Login redirect | PASS | Đã thay 2 Home-only redirect bằng returnTo |
| Product login redirect | PASS | Product truyền returnTo + pending add-to-cart |
| Product pending effect | PASS | Sau login Product consume action một lần và gọi mutation |
| Protected apps/mobile/src/app/gio-hang.tsx | PASS | returnTo='/gio-hang' |
| Protected apps/mobile/src/app/thanh-toan.tsx | PASS | returnTo='/thanh-toan' |
| Protected apps/mobile/src/app/(tabs)/don-hang.tsx | PASS | returnTo='/don-hang' |
| Protected apps/mobile/src/app/(tabs)/tai-khoan.tsx | PASS | returnTo='/tai-khoan' |
| Order detail returnTo | PASS | Dynamic order id được giữ qua login |
| Complaint returnTo | PASS | Giữ order-item context qua login |
| No raw router.push('/dang-nhap') | FAIL | Còn: apps/mobile/src/app/tai-khoan/khieu-nai.tsx, apps/mobile/src/app/tai-khoan/wishlist.tsx, apps/mobile/src/app/tai-khoan/dia-chi.tsx, apps/mobile/src/app/tai-khoan/trang-trai-theo-doi.tsx, apps/mobile/src/app/tai-khoan/ho-so.tsx, apps/mobile/src/app/tai-khoan/khieu-nai/[id].tsx |
| Centralized protected redirects | PASS | 7 screen dùng moDangNhap(): apps/mobile/src/app/gio-hang.tsx, apps/mobile/src/app/thanh-toan.tsx, apps/mobile/src/app/don-hang/[id].tsx, apps/mobile/src/app/(tabs)/don-hang.tsx, apps/mobile/src/app/(tabs)/tai-khoan.tsx, apps/mobile/src/app/khieu-nai/tao.tsx, apps/mobile/src/app/san-pham/[id].tsx |
| Reject protocol-relative | PASS | returnTo validation |
| Reject schemes | PASS | returnTo validation |
| Reject backslash | PASS | returnTo validation |
| Reject auth loop | PASS | returnTo validation |
| Limit returnTo length | PASS | returnTo validation |
| Login uses returnTo | PASS | Login không còn hard-code Home |
| Product pending action | PASS | Add-to-cart tiếp tục sau login |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-004 chưa đạt. Không chuyển sang 005.**

Mục fail:

- [ ] No raw router.push('/dang-nhap'): Còn: apps/mobile/src/app/tai-khoan/khieu-nai.tsx, apps/mobile/src/app/tai-khoan/wishlist.tsx, apps/mobile/src/app/tai-khoan/dia-chi.tsx, apps/mobile/src/app/tai-khoan/trang-trai-theo-doi.tsx, apps/mobile/src/app/tai-khoan/ho-so.tsx, apps/mobile/src/app/tai-khoan/khieu-nai/[id].tsx

## Command logs

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

Exit code: `0`

```text
$ tsc --noEmit -p tsconfig.json && pnpm -r --filter './apps/**' --filter './packages/**' --if-present run typecheck
Scope: 8 of 9 workspace projects
apps/api typecheck$ prisma generate --config prisma7.config.ts && tsc --noEmit -p tsconfig.json
packages/api-client typecheck$ pnpm run ensure && tsc --noEmit -p tsconfig.json
packages/api-client typecheck: $ node tools/dam-bao-generated.mjs
apps/api typecheck: Loaded Prisma config from prisma7.config.ts.
apps/api typecheck: Prisma schema loaded from prisma/schema.prisma.
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 1.97s
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
