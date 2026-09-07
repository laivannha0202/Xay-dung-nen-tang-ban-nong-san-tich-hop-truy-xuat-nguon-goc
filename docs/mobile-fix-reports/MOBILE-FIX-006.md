# MOBILE-FIX-006 — Checkout Contract V2

- Thời gian: `2026-09-06T23:25:09`
- Kết quả: **FAIL**

## Contract sau phiên

```text
Cart Backend
   ↓
GET /gio-hang/checkout-preview
   ↓
Backend price / stock / shipping / total
   ↓
Mobile chọn Address Book Backend
   ↓
TaoDonHangMobileInput
  - maYeuCau
  - diaChiGiaoHangId
  - items[]
      bienTheSanPhamId
      soLuong
      donGiaDuKien
   ↓
POST /don-hang (nối UI ở MOBILE-FIX-007)
   ↓
Backend validate price + reserve FEFO + create order
```

## Nguyên tắc tiền

- Mobile **không** là source of truth cho tổng tiền.
- `donGiaDuKien` chỉ là optimistic concurrency check.
- Checkout summary hiển thị dữ liệu từ Backend preview.
- Create Order Backend phải validate lại giá/tồn.

## File thay đổi

- `apps/mobile/src/lib/api-checkout.ts`
- `apps/mobile/src/app/thanh-toan.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| pnpm --filter @agrimarket/api-client ensure | PASS | exit=0 |
| Generated layCheckoutPreview | PASS | found |
| Generated taoDonHang | PASS | found |
| Generated address list | PASS | found |
| Generated contract files | PASS | packages/api-client/generated/index.ts, packages/api-client/generated/model/index.ts |
| Address query adapter | PASS | Account API có Address Book Backend |
| Central auth navigation | PASS | MOBILE-FIX-004 |
| Shared response unwrap | PASS | MOBILE-FIX-002 |
| Write apps/mobile/src/lib/api-checkout.ts | PASS | Đã tạo/cập nhật |
| Write apps/mobile/src/app/thanh-toan.tsx | PASS | Đã tạo/cập nhật |
| Create-order adapter exists | PASS | Adapter chuẩn bị cho COD session 007 |
| Create-order uses generated client | PASS | Không direct fetch |
| Create-order has idempotency key | PASS | Backend requires UUID |
| Create-order has backend address id | PASS | Address Book id |
| Preview item maps expected price | PASS | Backend sẽ validate lại giá/tồn |
| No client final total in order payload | PASS | Không gửi final monetary source of truth |
| Checkout uses Address Book API | PASS | Địa chỉ Backend thật |
| Checkout selects default address | PASS | Fallback địa chỉ đầu tiên |
| No local address TextInput | PASS | Bỏ draft local address form |
| Checkout total from preview | PASS | Không tính total client |
| Checkout shipping from preview | PASS | Backend pricing source |
| Auth returnTo preserved | PASS | MOBILE-FIX-004 không bị regression |
| Order submit not wired yet | PASS | Để MOBILE-FIX-007 nối COD end-to-end |
| No manual checkout money calculation | FAIL | Suspicious: tongThanhToan\s*= |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | FAIL | exit=2 |
| pnpm typecheck | FAIL | exit=2 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-006 chưa đạt. Không chuyển sang 007.**

Các mục fail:

- [ ] No manual checkout money calculation: Suspicious: tongThanhToan\s*=
- [ ] pnpm --filter @agrimarket/mobile typecheck: exit=2
- [ ] pnpm typecheck: exit=2

## Command logs

### `pnpm --filter @agrimarket/api-client ensure`

Exit code: `0`

```text
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

Exit code: `2`

```text
$ pnpm --filter @agrimarket/api-client ensure
$ node tools/dam-bao-generated.mjs
$ tsc --noEmit
src/app/thanh-toan.tsx(225,23): error TS18048: 'macDinh' is possibly 'undefined'.
/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @agrimarket/mobile@0.0.0 typecheck: `tsc --noEmit`
Exit status 2
```

### `pnpm typecheck`

Exit code: `2`

```text
$ tsc --noEmit -p tsconfig.json && pnpm -r --filter './apps/**' --filter './packages/**' --if-present run typecheck
Scope: 8 of 9 workspace projects
apps/api typecheck$ prisma generate --config prisma7.config.ts && tsc --noEmit -p tsconfig.json
packages/api-client typecheck$ pnpm run ensure && tsc --noEmit -p tsconfig.json
packages/api-client typecheck: $ node tools/dam-bao-generated.mjs
apps/api typecheck: Loaded Prisma config from prisma7.config.ts.
apps/api typecheck: Prisma schema loaded from prisma/schema.prisma.
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 2.14s
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
apps/admin-web typecheck: Generating route types...
apps/customer-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: Done
apps/customer-web typecheck: Done
apps/mobile typecheck: src/app/thanh-toan.tsx(225,23): error TS18048: 'macDinh' is possibly 'undefined'.
apps/mobile typecheck: Failed
/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/mobile:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @agrimarket/mobile@0.0.0 typecheck: `tsc --noEmit`
Exit status 2
[ELIFECYCLE] Command failed with exit code 2.
```

### `git diff --check`

Exit code: `0`

```text

```
