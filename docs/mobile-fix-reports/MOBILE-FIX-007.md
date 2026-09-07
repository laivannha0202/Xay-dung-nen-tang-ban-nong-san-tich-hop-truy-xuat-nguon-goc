# MOBILE-FIX-007 — COD End-to-End

- Thời gian: `2026-09-06T23:42:32`
- Kết quả: **PASS**

## Luồng COD sau phiên

```text
Checkout Preview Backend
        +
Address Book Backend
        ↓
UUID #1: maYeuCauDonHang
        ↓
POST /don-hang
        ↓
Backend validate price/cart
reserve FEFO
snapshot order
clear cart atomic
        ↓
UUID #2: maYeuCauThanhToan
        ↓
POST /thanh-toan
phuongThuc=COD
        ↓
Payment=PENDING
Reservation=DA_BAN
        ↓
invalidate Cart / Checkout / Orders
        ↓
Order Detail
```

## Failure semantics

- Create Order retry dùng lại cùng order idempotency key trong checkout attempt.
- Payment lỗi sau khi Order đã tạo: giữ Order và chỉ retry COD Payment.
- Cart được dọn trong Backend transaction, không chỉ xóa cache ở Mobile.

## File thay đổi

- `apps/mobile/package.json`
- `pnpm-lock.yaml`
- `apps/api/src/modules/don-hang/don-hang.service.ts`
- `apps/mobile/src/lib/api-checkout.ts`
- `apps/mobile/src/lib/api-thanh-toan.ts`
- `apps/mobile/src/app/thanh-toan.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Foundation apps/mobile/src/lib/api-checkout.ts | PASS | found |
| Foundation apps/mobile/src/app/thanh-toan.tsx | PASS | found |
| Foundation apps/api/src/modules/don-hang/don-hang.service.ts | PASS | found |
| Checkout V2 adapter | PASS | MOBILE-FIX-006 |
| Address Book checkout | PASS | MOBILE-FIX-006 |
| Order backend idempotency | PASS | Backend returns existing order for same key |
| pnpm --filter @agrimarket/api-client ensure | PASS | exit=0 |
| Generated taoThanhToan | PASS | found |
| Generated layThanhToanDonHangCuaToi | PASS | found |
| pnpm --filter @agrimarket/mobile add expo-crypto@~57.0.2 | PASS | exit=0 |
| expo-crypto dependency | PASS | Installed ~57.0.2 |
| Atomic cart clear | PASS | mucGioHang.deleteMany nằm trong Create Order transaction |
| Write apps/mobile/src/lib/api-checkout.ts | PASS | Đã tạo/cập nhật |
| Write apps/mobile/src/lib/api-thanh-toan.ts | PASS | Đã tạo/cập nhật |
| Write apps/mobile/src/app/thanh-toan.tsx | PASS | Đã tạo/cập nhật |
| expo-crypto configured | PASS | UUID v4 generator dependency |
| Two idempotency keys | PASS | Order + Payment keys |
| Create Order wired | PASS | Checkout -> POST /don-hang |
| COD Payment wired | PASS | Order -> POST /thanh-toan |
| COD payload exact | PASS | COD không gửi mock result |
| Payment status asserted | PASS | Không coi response bất kỳ là success |
| Retry payment without duplicate order | PASS | Order result reused after payment failure |
| Double submit guarded | PASS | Mutation pending blocks repeated tap |
| Cart invalidated after success | PASS | Mobile refetches Backend cart |
| Orders invalidated after success | PASS | Order list refresh |
| Navigate to created order | PASS | COD success opens detail |
| Backend cart clear atomic | PASS | Cart clear in order transaction |
| Backend idempotency remains before cart read | PASS | Retry same order key works even after cart was cleared |
| No client final total payload | PASS | Backend remains monetary source of truth |
| Single atomic cart clear | PASS | deleteMany cart call sites in DonHangService = 1 |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-007 PASS.**

### Manual Android acceptance bắt buộc

- [ ] Login → thêm sản phẩm → Cart → Checkout.
- [ ] Chọn địa chỉ → `Đặt hàng COD`.
- [ ] Chỉ tạo đúng 1 Order khi bấm nhanh nhiều lần.
- [ ] Sau success mở đúng Order Detail.
- [ ] Payment của Order là `COD / PENDING`.
- [ ] Reservation của payment/order là `DA_BAN`.
- [ ] Mở lại Cart → cart trống.
- [ ] Order xuất hiện trong tab Đơn hàng.
- [ ] Thử gây lỗi payment sau khi order tạo: retry không tạo Order thứ hai.

Phiên tiếp theo: **MOBILE-FIX-008 — Online Payment (nếu giữ trong scope)**.

## Command logs

### `pnpm --filter @agrimarket/api-client ensure`

Exit code: `0`

```text
$ node tools/dam-bao-generated.mjs
```

### `pnpm --filter @agrimarket/mobile add expo-crypto@~57.0.2`

Exit code: `0`

```text
✓ Lockfile passes supply-chain policies (verified 3h ago)
Progress: resolved 1, reused 0, downloaded 0, added 0
Progress: resolved 80, reused 0, downloaded 0, added 0
Progress: resolved 92, reused 0, downloaded 0, added 0
Progress: resolved 95, reused 0, downloaded 0, added 0
Progress: resolved 96, reused 0, downloaded 0, added 0
Progress: resolved 97, reused 0, downloaded 0, added 0
Progress: resolved 98, reused 0, downloaded 0, added 0
Progress: resolved 157, reused 0, downloaded 0, added 0
Progress: resolved 233, reused 0, downloaded 0, added 0
Progress: resolved 312, reused 0, downloaded 0, added 0
Progress: resolved 406, reused 0, downloaded 0, added 0
Progress: resolved 484, reused 0, downloaded 0, added 0
Progress: resolved 492, reused 0, downloaded 0, added 0
Progress: resolved 498, reused 0, downloaded 0, added 0
Progress: resolved 529, reused 0, downloaded 0, added 0
Progress: resolved 694, reused 0, downloaded 0, added 0
Progress: resolved 828, reused 0, downloaded 0, added 0
Progress: resolved 893, reused 0, downloaded 0, added 0
Progress: resolved 934, reused 0, downloaded 0, added 0
Progress: resolved 990, reused 0, downloaded 0, added 0
Progress: resolved 1060, reused 0, downloaded 0, added 0
Progress: resolved 1097, reused 0, downloaded 0, added 0
Progress: resolved 1099, reused 0, downloaded 0, added 0
Progress: resolved 1126, reused 0, downloaded 0, added 0
Progress: resolved 1221, reused 0, downloaded 0, added 0
Progress: resolved 1360, reused 0, downloaded 0, added 0
Progress: resolved 1414, reused 0, downloaded 0, added 0
Progress: resolved 1595, reused 0, downloaded 0, added 0
Progress: resolved 1616, reused 0, downloaded 0, added 0
Progress: resolved 1628, reused 0, downloaded 0, added 0
Progress: resolved 1632, reused 0, downloaded 0, added 0
[WARN] 6 deprecated subdependencies found: cron-parser@4.9.0, glob@7.2.3, glob@9.3.5, inflight@1.0.6, uuid@7.0.3, uuid@9.0.1
[WARN] Issues with peer dependencies found. Run "pnpm peers check" to list them.
Progress: resolved 1632, reused 1, downloaded 0, added 0
Progress: resolved 1632, reused 9, downloaded 0, added 0
Progress: resolved 1632, reused 12, downloaded 0, added 0
Progress: resolved 1632, reused 12, downloaded 8, added 0
Progress: resolved 1632, reused 12, downloaded 9, added 0
[WARN] GET https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.28.2.tgz error (UND_ERR_SOCKET). Will retry in 10 seconds. 2 retries left.
Progress: resolved 1632, reused 12, downloaded 16, added 0
Progress: resolved 1632, reused 12, downloaded 23, added 0
.                                        |   +1 -119 +------------
Progress: resolved 1632, reused 12, downloaded 33, added 0
Progress: resolved 1632, reused 12, downloaded 34, added 0
Progress: resolved 1632, reused 12, downloaded 39, added 0
[WARN] GET https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.28.2.tgz error (UND_ERR_SOCKET). Will retry in 10 seconds. 2 retries left.
Progress: resolved 1632, reused 12, downloaded 43, added 0
Progress: resolved 1632, reused 12, downloaded 44, added 0
Progress: resolved 1632, reused 12, downloaded 49, added 0
Progress: resolved 1632, reused 12, downloaded 51, added 0
Progress: resolved 1632, reused 12, downloaded 56, added 0
Progress: resolved 1632, reused 12, downloaded 62, added 1
Progress: resolved 1632, reused 12, downloaded 63, added 1
Progress: resolved 1632, reused 12, downloaded 64, added 1, done
Done in 1m 18.6s using pnpm v11.24.0
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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 2.31s
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
