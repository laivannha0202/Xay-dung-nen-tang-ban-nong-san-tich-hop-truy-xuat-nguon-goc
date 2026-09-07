# MOBILE-FIX-018 — Performance

- Thời gian: `2026-09-07T09:24:53`
- Kết quả: **FAIL**

## Changes

### React Query

- Native `AppState` drives TanStack `focusManager`.
- Foreground refresh only follows existing stale/query policy.
- Inactive query cache keeps a bounded 5-minute GC window.
- Existing retry/error policy from MOBILE-FIX-002 is not replaced.

### Images

- ProductCard/FarmCard use expo-image memory+disk caching.
- `recyclingKey` prevents stale recycled image content.

### Lists

- Wishlist uses FlatList.
- Followed Farms uses FlatList.
- Both use bounded initial/batch/window rendering and pull-to-refresh.
- Search and Orders remain ScrollView because their server pages are bounded at 12/10 items.

## File thay đổi

- `apps/mobile/src/providers/app-providers.tsx`
- `apps/mobile/src/app/tai-khoan/wishlist.tsx`
- `apps/mobile/src/app/tai-khoan/trang-trai-theo-doi.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 017 canGoBack helper | PASS | Deep-link-safe navigation |
| 017 tab history | PASS | Tab history preserved |
| 017 single notification listener | PASS | No duplicate lifecycle |
| React Query AppState focus | PASS | Native foreground lifecycle |
| Query cache GC | PASS | Inactive cache retained 5 minutes |
| Existing retry policy preserved | PASS | MOBILE-FIX-002 query retry remains |
| product-card.tsx image cache | FAIL | Memory+disk cache and safe recycling |
| farm-card.tsx image cache | FAIL | Memory+disk cache and safe recycling |
| Wishlist FlatList | PASS | Virtualized list |
| Wishlist tuning | PASS | Bounded render window |
| Wishlist pull-to-refresh | PASS | No separate full-screen reload |
| Farm FlatList | PASS | Virtualized list |
| Farm tuning | PASS | Bounded render window |
| Farm pull-to-refresh | PASS | Native refresh gesture |
| Account shared errors | PASS | MOBILE-FIX-011 preserved |
| Account protected returnTo | PASS | MOBILE-FIX-004 preserved |
| Account safe back | PASS | MOBILE-FIX-017 preserved |
| Search remains server paginated | PASS | No unnecessary list rewrite |
| Orders remain server paginated | PASS | No unnecessary list rewrite |
| AppState listener cleanup | PASS | No lifecycle leak |
| Product image cache | FAIL | Repeated product images reuse cache |
| Farm image cache | FAIL | Repeated farm images reuse cache |
| No new raw fetch | PASS | Generated/adapters only |
| pnpm --filter @agrimarket/mobile exec expo install --check | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-018 chưa đạt. Không chuyển sang 019.**

Các mục fail:

- [ ] product-card.tsx image cache: Memory+disk cache and safe recycling
- [ ] farm-card.tsx image cache: Memory+disk cache and safe recycling
- [ ] Product image cache: Repeated product images reuse cache
- [ ] Farm image cache: Repeated farm images reuse cache

## Command logs

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 626ms
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
apps/mobile pretypecheck: Done
apps/admin-web pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
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

Exit code: `0`

```text

```
