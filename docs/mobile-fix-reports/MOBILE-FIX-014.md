# MOBILE-FIX-014 — Search Facets

- Thời gian: `2026-09-07T08:41:00`
- Kết quả: **PASS**

## Before

```text
GET public products?gioiHan=100
 -> Mobile derive category/farm/certificate
 -> facet có thể thiếu dữ liệu ngoài 100 item đầu
```

## After

```text
GET /san-pham-cong-khai/facets
 -> Backend whereCongKhai() toàn bộ public products
 -> category + count
 -> farm + count
 -> verified/non-expired certificate + count
 -> Orval hook
 -> FilterBottomSheet
```

## Truth boundaries

- Facet counts là số sản phẩm trong toàn bộ public product universe.
- Chứng nhận facet chỉ gồm chứng nhận đã xác minh và còn hạn.
- Tỉnh/thành vẫn là text query trên địa chỉ farm; Mobile không parse tỉnh.
- Facet API lỗi không làm product search/list lỗi theo.

## File thay đổi

- `apps/api/src/modules/san-pham/dto/phan-hoi-facet-san-pham-cong-khai.dto.ts`
- `apps/api/src/modules/san-pham/san-pham-cong-khai.controller.ts`
- `apps/api/src/modules/san-pham/san-pham-cong-khai.service.ts`
- `packages/api-client/openapi/agrimarket.json`
- `apps/mobile/src/components/search-filter/filter-bottom-sheet.tsx`
- `apps/mobile/src/app/(tabs)/kham-pha.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 013B PHU_HOP | PASS | Home semantics complete |
| 013B fake seasonal removed | PASS | Home regression |
| Public whereCongKhai | PASS | Facet source-of-truth |
| Incomplete 100-product facets exist | PASS | Expected pre-014 state |
| Public facet endpoint | PASS | GET /san-pham-cong-khai/facets |
| Facet same public visibility | PASS | Complete public universe |
| Facet no 100-item cap | PASS | No pagination inference |
| Facet valid certificates | PASS | Verified + non-expired |
| Facet certificate de-dup | PASS | One product counted once per certificate type |
| OpenAPI facet path | PASS | Public typed contract |
| pnpm api-client:generate | PASS | exit=0 |
| pnpm api-client:ensure | PASS | exit=0 |
| Generated facet operation | PASS | Orval function |
| Generated facet hook | PASS | Orval React Query hook |
| Facet loading/error props | PASS | Independent facet state |
| Facet retry UI | PASS | Facet failure does not hide product list |
| Generated facet hook | PASS | Dedicated Backend facets |
| Old 100-item facet query removed | PASS | No incomplete client inference |
| Facet counts visible | PASS | Chip labels show complete public counts |
| Facet retry connected | PASS | Independent retry |
| All product filters preserved | PASS | Existing search contract |
| Facet route before dynamic id | PASS | Static route safe |
| Facet route remains public | PASS | Guest search |
| Category facet value = slug | PASS | Matches danhMuc filter |
| Farm facet value = id | PASS | Matches trangTraiId filter |
| Certificate facet value = loai | PASS | Matches chungNhan filter |
| No facet pagination cap | PASS | Complete public universe |
| Search stays public | PASS | No auth gate |
| No raw fetch | PASS | Generated hooks only |
| pnpm --filter @agrimarket/api typecheck | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-014 PASS.**

### Manual Android acceptance

- [ ] Guest mở Khám phá không bị yêu cầu login.
- [ ] Bộ lọc tải category/farm/certificate từ endpoint facets.
- [ ] Count facet khớp toàn bộ public dataset.
- [ ] Chọn category/farm/certificate lọc đúng.
- [ ] Tỉnh/thành, giá, harvest range vẫn lọc đúng.
- [ ] CON_HANG/HET_HANG và sort vẫn hoạt động.
- [ ] Facet endpoint lỗi -> product list vẫn hoạt động + có retry facet riêng.
- [ ] Không còn `gioiHan: 100` để dựng facet.

Phiên tiếp theo: **MOBILE-FIX-015 — Register Alignment**.

## Command logs

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

### `pnpm --filter @agrimarket/api typecheck`

Exit code: `0`

```text
$ prisma generate --config prisma7.config.ts && tsc --noEmit -p tsconfig.json
Loaded Prisma config from prisma7.config.ts.

Prisma schema loaded from prisma/schema.prisma.
┌─────────────────────────────────────────────────────────┐
│  Update available 7.10.0 -> 8.0.0-rc.13                 │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 391ms

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

Exit code: `0`

```text
$ tsc --noEmit -p tsconfig.json && pnpm -r --filter './apps/**' --filter './packages/**' --if-present run typecheck
Scope: 8 of 9 workspace projects
apps/api typecheck$ prisma generate --config prisma7.config.ts && tsc --noEmit -p tsconfig.json
packages/api-client typecheck$ pnpm run ensure && tsc --noEmit -p tsconfig.json
packages/api-client typecheck: $ node tools/dam-bao-generated.mjs
apps/api typecheck: Loaded Prisma config from prisma7.config.ts.
apps/api typecheck: Prisma schema loaded from prisma/schema.prisma.
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 441ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/customer-web typecheck: Generating route types...
apps/customer-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Generating route types...
apps/admin-web typecheck: ✓ Types generated successfully
apps/mobile typecheck: Done
apps/customer-web typecheck: Done
apps/admin-web typecheck: Done
```

### `git diff --check`

Exit code: `0`

```text

```
