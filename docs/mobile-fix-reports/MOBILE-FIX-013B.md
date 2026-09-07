# MOBILE-FIX-013B — Home Semantics

- Thời gian: `2026-09-07T08:33:45`
- Kết quả: **PASS**

## 013B preflight repair

- 013 cũ tạo false-negative vì chỉ scan một phần generated files.
- 013B kiểm tra hook/parameter trên toàn generated tree và enum values từ OpenAPI source-of-truth.
- TypeScript compilation sau patch là proof cuối cùng rằng literal query values khớp generated contract.

## Semantic changes

```text
OLD Mobile inference
  24 products
   -> slice = 'mới thu hoạch'
   -> local sort = 'gợi ý'
   -> one/category = 'theo mùa'
   -> count in feed = 'farm nổi bật'

NEW Backend semantics
  GET public products + khaDung=CON_HANG
  GET public products + sapXep=PHU_HOP
  GET public products + sapXep=MOI_NHAT
  GET public products + thuHoachTu=<30 days>
  GET public products + chungNhan=Organic
```

## Important truth boundaries

- `MOI_NHAT` được gọi là sản phẩm mới công khai, không gọi là thu hoạch mới.
- Thu hoạch gần đây dùng filter Backend theo bản ghi harvest.
- `PHU_HOP` dùng ranking Backend, không sort availability/certificate/stock ở Mobile.
- Danh mục/trang trại derive từ feed chỉ được mô tả là xuất hiện trong feed.
- Home vẫn public/guest.

## File thay đổi

- `apps/mobile/src/app/(tabs)/index.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 012B strict guard | PASS | found |
| 012B no unsafe batch index | PASS | found |
| 012 Push sender preserved | PASS | found |
| pnpm api-client:ensure | PASS | exit=0 |
| Public product hook | PASS | Generated Orval hook |
| Generated availability parameter | PASS | Generated client accepts availability query |
| Availability semantics | PASS | OpenAPI contains CON_HANG |
| Generated sort parameter | PASS | Generated client accepts sort query |
| Backend relevance sort | PASS | OpenAPI contains PHU_HOP |
| Backend newest sort | PASS | OpenAPI contains MOI_NHAT |
| Certification filter | PASS | Public query supports certificate filter |
| Harvest range filter | PASS | Public query supports harvest date range |
| Backend PHU_HOP | PASS | Recommendation/ranking from Backend |
| Backend MOI_NHAT | PASS | Product publish recency |
| Backend CON_HANG | PASS | Availability source of truth |
| Backend harvest range | PASS | Recent harvest is query semantics |
| Backend Organic filter | PASS | No accent/name heuristic |
| Backend exact metrics | PASS | Hero counts come from API tong |
| Old fake seasonal label | PASS | removed |
| Old client recommendation copy | PASS | removed |
| Old farm ranking copy | PASS | removed |
| Old fake latest harvest selection | PASS | removed |
| Old client ranking variable | PASS | removed |
| Old seasonal variable | PASS | removed |
| Old normalized Organic heuristic | PASS | removed |
| No client product sort ranking | PASS | No availability/cert/stock recommendation sort in Mobile |
| Farm semantics honest | PASS | Feed membership only |
| Category semantics honest | PASS | No global-count claim |
| Harvest semantics honest | PASS | Publish date and harvest date are separated |
| Home remains guest/public | PASS | No auth gate introduced |
| No raw fetch | PASS | Generated public hooks only |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-013 + 013B PASS.**

### Manual Android acceptance

- [ ] Guest mở Home không bị yêu cầu login.
- [ ] Hero `sản phẩm công khai` khớp API `tong`.
- [ ] Hero `còn hàng` khớp query `khaDung=CON_HANG`.
- [ ] Section `Phù hợp` chỉ chứa sản phẩm có thể đặt.
- [ ] Section `Mới công khai` phản ánh `sapXep=MOI_NHAT`.
- [ ] Section harvest chỉ xuất hiện khi Backend có harvest trong 30 ngày.
- [ ] Harvest card hiển thị ngày thật từ product detail.
- [ ] Organic không xuất hiện nếu Backend không trả chứng nhận Organic.
- [ ] Không còn label `Theo mùa`, `Recommendation MVP`, `Trang trại nổi bật`.

Phiên tiếp theo: **MOBILE-FIX-014 — Search Facets**.

## Command logs

### `pnpm api-client:ensure`

Exit code: `0`

```text
$ pnpm --filter @agrimarket/api-client ensure
$ node tools/dam-bao-generated.mjs
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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 417ms
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
apps/admin-web typecheck: Done
apps/customer-web typecheck: Done
apps/mobile typecheck: Done
```

### `git diff --check`

Exit code: `0`

```text

```
