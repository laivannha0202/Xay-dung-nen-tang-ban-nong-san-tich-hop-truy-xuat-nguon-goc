# MOBILE-FIX-004B — Account Return-To Completion

- Thời gian: `2026-09-06T22:56:46`
- Kết quả: **PASS**

## Phạm vi

Dọn nốt các raw redirect auth còn sót sau MOBILE-FIX-004:

- `/tai-khoan/khieu-nai`
- `/tai-khoan/wishlist`
- `/tai-khoan/dia-chi`
- `/tai-khoan/trang-trai-theo-doi`
- `/tai-khoan/ho-so`
- `/tai-khoan/khieu-nai/[id]`

## File thay đổi

- `apps/mobile/src/app/tai-khoan/khieu-nai.tsx`
- `apps/mobile/src/app/tai-khoan/wishlist.tsx`
- `apps/mobile/src/app/tai-khoan/dia-chi.tsx`
- `apps/mobile/src/app/tai-khoan/trang-trai-theo-doi.tsx`
- `apps/mobile/src/app/tai-khoan/ho-so.tsx`
- `apps/mobile/src/app/tai-khoan/khieu-nai/[id].tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| auth-navigation helper | PASS | moDangNhap + chuanHoaReturnTo đã tồn tại |
| apps/mobile/src/app/tai-khoan/khieu-nai.tsx | PASS | returnTo='/tai-khoan/khieu-nai' |
| apps/mobile/src/app/tai-khoan/wishlist.tsx | PASS | returnTo='/tai-khoan/wishlist' |
| apps/mobile/src/app/tai-khoan/dia-chi.tsx | PASS | returnTo='/tai-khoan/dia-chi' |
| apps/mobile/src/app/tai-khoan/trang-trai-theo-doi.tsx | PASS | returnTo='/tai-khoan/trang-trai-theo-doi' |
| apps/mobile/src/app/tai-khoan/ho-so.tsx | PASS | returnTo='/tai-khoan/ho-so' |
| apps/mobile/src/app/tai-khoan/khieu-nai/[id].tsx | PASS | Giữ complaint id động qua login |
| No raw router.push('/dang-nhap') | PASS | Không còn raw login redirect |
| Centralized auth redirects | PASS | 13 screen hiện dùng moDangNhap() |
| ReturnTo apps/mobile/src/app/tai-khoan/khieu-nai.tsx | PASS | moDangNhap(router, '/tai-khoan/khieu-nai') |
| ReturnTo apps/mobile/src/app/tai-khoan/wishlist.tsx | PASS | moDangNhap(router, '/tai-khoan/wishlist') |
| ReturnTo apps/mobile/src/app/tai-khoan/dia-chi.tsx | PASS | moDangNhap(router, '/tai-khoan/dia-chi') |
| ReturnTo apps/mobile/src/app/tai-khoan/trang-trai-theo-doi.tsx | PASS | moDangNhap(router, '/tai-khoan/trang-trai-theo-doi') |
| ReturnTo apps/mobile/src/app/tai-khoan/ho-so.tsx | PASS | moDangNhap(router, '/tai-khoan/ho-so') |
| ReturnTo complaint detail | PASS | Dynamic complaint id được preserve |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-004 + 004B đã hoàn tất phần static validation.**

Toàn bộ auth entry screen hiện dùng centralized `moDangNhap()` và không còn raw `router.push('/dang-nhap')`.

### Manual test nên chạy trên Android

- [ ] Guest → Hồ sơ → Login → Hồ sơ.
- [ ] Guest → Địa chỉ → Login → Địa chỉ.
- [ ] Guest → Wishlist → Login → Wishlist.
- [ ] Guest → Trang trại theo dõi → Login → đúng màn.
- [ ] Guest → Khiếu nại → Login → danh sách khiếu nại.
- [ ] Guest → Chi tiết khiếu nại ID → Login → đúng ID.
- [ ] Product → Add Cart → Login → Product → tự Add Cart.
- [ ] Cart → Login → Cart.
- [ ] Checkout → Login → Checkout.
- [ ] Orders → Login → Orders.

Phiên tiếp theo: **MOBILE-FIX-005 — Logout + Session Expired UX**.

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 2.27s
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/customer-web typecheck: Generating route types...
apps/customer-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Generating route types...
apps/admin-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Done
apps/customer-web typecheck: Done
apps/mobile typecheck: Done
```

### `git diff --check`

Exit code: `0`

```text

```
