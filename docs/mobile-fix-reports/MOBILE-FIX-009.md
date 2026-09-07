# MOBILE-FIX-009 — Order + Payment + Shipment

- Thời gian: `2026-09-07T07:54:22`
- Kết quả: **PASS**

## Luồng

```text
Order Detail
 + Payment Status
 + Inventory Reservation
 + Shipment Tracking
 + Shipment Event Timeline
```

## File thay đổi

- `apps/mobile/src/lib/api-giao-hang.ts`
- `apps/mobile/src/app/don-hang/[id].tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 008B VNPay service branch | PASS | found |
| 008B Gateway registry wired | PASS | found |
| 008B Alpha-numeric VNPay ref | PASS | found |
| 008B Service request IP | PASS | found |
| 008B Payment status adapter | PASS | found |
| 008B VNPay mobile adapter | PASS | found |
| pnpm api-client:ensure | PASS | exit=0 |
| Order detail operation | PASS | found |
| Payment status operation | PASS | found |
| Shipment tracking operation | PASS | found |
| Shipment adapter | PASS | Generated API -> mobile adapter |
| Order helpers | PASS | Payment/reservation/shipment labels |
| Order queries | PASS | Order + Payment + Shipment |
| Payment/Shipment UI | PASS | Real Backend state UI |
| Generated shipment call | PASS | No raw fetch |
| Payment query | PASS | GET Payment Status |
| Shipment query | PASS | GET Shipment Tracking |
| Payment 404 non-fatal | PASS | Order stays usable before Payment exists |
| Empty shipment explicit | PASS | No fake tracking |
| Shipment timestamp | PASS | Backend event timestamp |
| Refresh all sources | PASS | Order + Payment + Shipment |
| ReturnTo preserved | PASS | Protected route |
| Complaint preserved | PASS | Existing action |
| Review preserved | PASS | Existing review integration |
| No raw fetch | PASS | refetch() is allowed |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-009 PASS.**

### Manual Android acceptance

- [ ] COD order → Payment COD/PENDING.
- [ ] Online paid order → Payment PAID.
- [ ] Chưa shipment → `Chưa có vận đơn`.
- [ ] Có shipment → supplier + mã vận đơn + trạng thái.
- [ ] Có events → đúng timestamp Backend.
- [ ] Refresh cập nhật Payment + Shipment.
- [ ] Guest → Login → quay lại đúng Order ID.

Phiên tiếp theo: **MOBILE-FIX-010 — Review + Complaint**.

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 459ms
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
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
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

Exit code: `0`

```text

```
