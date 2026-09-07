# MOBILE-FIX-010 — Review + Complaint

- Thời gian: `2026-09-07T08:02:38`
- Kết quả: **FAIL**

## Luồng hoàn thiện

```text
Order item đã giao
  ├─ Review eligibility -> Create review -> Revalidate Backend
  └─ Complaint eligibility
       -> chọn lý do + mô tả
       -> evidence upload
       -> Create complaint
       -> seed detail cache
       -> invalidate complaint history
       -> mở complaint vừa tạo
```

## Ranh giới dữ liệu

- Review eligibility do Backend quyết định.
- Complaint eligibility và deadline do Backend quyết định.
- Mobile không tạo complaint processing status vì contract hiện không có field đó.
- `fetch(asset.uri)` nếu còn tồn tại chỉ dùng đọc ảnh local trên thiết bị; backend upload vẫn qua generated `taiTepTin`.

## File thay đổi

- `apps/mobile/src/components/orders/danh-gia-muc-don-hang.tsx`
- `apps/mobile/src/app/khieu-nai/tao.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Foundation apps/mobile/src/lib/api-giao-hang.ts | PASS | found |
| Foundation apps/mobile/src/app/don-hang/[id].tsx | PASS | found |
| Foundation apps/mobile/src/lib/api-phan-hoi.ts | PASS | found |
| Foundation apps/mobile/src/components/orders/danh-gia-muc-don-hang.tsx | PASS | found |
| Foundation apps/mobile/src/app/khieu-nai/tao.tsx | PASS | found |
| Foundation apps/mobile/src/app/tai-khoan/khieu-nai.tsx | PASS | found |
| Foundation apps/mobile/src/app/tai-khoan/khieu-nai/[id].tsx | PASS | found |
| Foundation apps/mobile/src/lib/api-tai-khoan.ts | PASS | found |
| Foundation apps/mobile/src/lib/api-error.ts | PASS | found |
| Foundation apps/mobile/src/lib/auth-navigation.ts | PASS | found |
| 009 Order + Payment | PASS | found |
| 009 Shipment | PASS | found |
| Review entry from order | PASS | found |
| Complaint entry from order | PASS | found |
| pnpm api-client:ensure | PASS | exit=0 |
| Generated taoDanhGia | PASS | found |
| Generated review eligibility | PASS | found |
| Generated complaint eligibility | PASS | found |
| Generated taoKhieuNai | PASS | found |
| Generated complaint history | PASS | found |
| Generated complaint detail | PASS | found |
| Generated evidence upload | PASS | found |
| Shared response unwrap | PASS | MOBILE-FIX-002 boundary preserved |
| Review generated calls | PASS | No raw backend fetch |
| Complaint generated calls | PASS | Eligibility + upload + create |
| Review Backend eligibility | PASS | Backend decides eligibility |
| Review duplicate-safe UX | PASS | Existing review/eligibility blocks repeat form |
| Review revalidation | PASS | Refresh server truth after submit |
| Review friendly errors | PASS | Shared API error normalizer |
| Review retry | PASS | User can retry eligibility query |
| Complaint Backend eligibility | PASS | Backend decides delivered/deadline eligibility |
| Evidence constraints preserved | PASS | <=5 files, <=5 MiB, JPEG/PNG/WebP |
| Complaint cache synchronization | PASS | Seed detail + invalidate history |
| Complaint success detail link | PASS | Created complaint can be opened immediately |
| Complaint returnTo item | PASS | Login returns to exact complaint draft route |
| No raw backend fetch | PASS | fetch(asset.uri) is local device Blob conversion only |
| Complaint history Backend | PASS | Real customer history |
| Complaint detail Backend | PASS | Real customer detail |
| Complaint list returnTo | PASS | MOBILE-FIX-004 preserved |
| Complaint detail returnTo | PASS | Dynamic complaint id preserved |
| No fake complaint workflow status | PASS | Backend DTO has no complaint processing-status field |
| Order still has Review | PASS | 009 order integration preserved |
| Order still has Complaint | PASS | 009 order action preserved |
| Review adapter generated | PASS | Shared API client |
| Complaint adapter generated | PASS | Shared API client |
| Review success server revalidation | PASS | No stale eligibility |
| Complaint history invalidated | PASS | New complaint appears in account history |
| Complaint detail cache seeded | PASS | Immediate detail route |
| Evidence upload is generated | PASS | No direct backend upload fetch |
| pnpm lint | FAIL | exit=1 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-010 chưa đạt. Không chuyển sang 011.**

Các mục fail:

- [ ] pnpm lint: exit=1

## Command logs

### `pnpm api-client:ensure`

Exit code: `0`

```text
$ pnpm --filter @agrimarket/api-client ensure
$ node tools/dam-bao-generated.mjs
```

### `pnpm lint`

Exit code: `1`

```text
$ eslint .

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/api/test/dong-goi.e2e-spec.ts
  66:17  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile/src/app/khieu-nai/tao.tsx
  20:10  error  'thongBaoLoiApi' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

✖ 2 problems (1 error, 1 warning)

[ELIFECYCLE] Command failed with exit code 1.
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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 456ms
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
