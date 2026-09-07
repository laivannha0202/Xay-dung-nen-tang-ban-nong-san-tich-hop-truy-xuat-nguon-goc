# MOBILE-FIX-018B — Image Cache Repair

- Thời gian: `2026-09-07T09:27:50`
- Kết quả: **PASS**

## Root cause

MOBILE-FIX-018 tìm đúng `source={{ uri: imageUrl }}` nhưng replacement phụ thuộc indentation cố định.
Sau MOBILE-FIX-016, TSX đã được format lại nên replacement không chạy.

## Fix

```tsx
<Image
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk"
  recyclingKey={imageUrl}
  ...
/>
```

018B chỉ sửa ProductCard/FarmCard; React Query AppState và FlatList từ 018 được giữ nguyên.

## File thay đổi

- `apps/mobile/src/components/design-system/product-card.tsx`
- `apps/mobile/src/components/design-system/farm-card.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 018 React Query AppState focus | PASS | Native lifecycle patch exists |
| 018 Wishlist FlatList | PASS | Virtualized wishlist exists |
| 018 Followed Farms FlatList | PASS | Virtualized farm list exists |
| product-card.tsx image cache | PASS | Memory+disk cache and recycled-view key |
| product-card.tsx expo-image preserved | PASS | No image library regression |
| farm-card.tsx image cache | PASS | Memory+disk cache and recycled-view key |
| farm-card.tsx expo-image preserved | PASS | No image library regression |
| React Query AppState preserved | PASS | 018 lifecycle unchanged |
| Wishlist virtualization preserved | PASS | 018 virtualized list unchanged |
| Farm virtualization preserved | PASS | 018 virtualized list unchanged |
| Product image cache | PASS | Repeated product images reuse cache |
| Farm image cache | PASS | Repeated farm images reuse cache |
| No raw fetch introduced | PASS | Generated/adapters boundary preserved |
| pnpm --filter @agrimarket/mobile exec expo install --check | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-018 + 018B PASS.**

Phiên tiếp theo: **MOBILE-FIX-019 — Unit/Integration Test**.

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 675ms
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
apps/admin-web typecheck: ✓ Types generated successfully
apps/customer-web typecheck: Generating route types...
apps/customer-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Done
apps/customer-web typecheck: Done
apps/mobile typecheck: Done
```

### `git diff --check`

Exit code: `0`

```text

```
