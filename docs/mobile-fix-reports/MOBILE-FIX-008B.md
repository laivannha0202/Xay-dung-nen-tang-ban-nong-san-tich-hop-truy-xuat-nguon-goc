# MOBILE-FIX-008B — VNPay service repair

- Thời gian: `2026-09-07T07:36:27`
- Kết quả: **PASS**

## Lỗi 008 đã sửa

1. Ghi hoàn chỉnh `ThanhToanService` với VNPay Sandbox branch.
2. Đồng bộ service signature với controller `request.ip`.
3. VNPay transaction reference trong DB dùng alpha-numeric ngay từ đầu.
4. Static raw-fetch scan dùng regex `\bfetch\s*\(` nên không bắt nhầm `refetch()`.
5. Không invalidate checkout trước khi VNPay browser return; cancel có thể mở lại cùng Payment.

## File thay đổi

- `apps/api/src/modules/thanh-toan/thanh-toan.service.ts`
- `apps/mobile/src/app/thanh-toan.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Foundation apps/api/src/modules/thanh-toan/thanh-toan.controller.ts | PASS | found |
| Foundation apps/api/src/modules/thanh-toan/thanh-toan-callback.controller.ts | PASS | found |
| Foundation apps/api/src/modules/thanh-toan/thanh-toan-callback.service.ts | PASS | found |
| Foundation apps/api/src/modules/thanh-toan/dto/tao-thanh-toan.dto.ts | PASS | found |
| Foundation apps/api/src/modules/thanh-toan/dto/phan-hoi-thanh-toan.dto.ts | PASS | found |
| Foundation apps/mobile/src/lib/api-thanh-toan.ts | PASS | found |
| Foundation apps/mobile/src/app/thanh-toan.tsx | PASS | found |
| Foundation apps/mobile/src/app/thanh-toan/ket-qua.tsx | PASS | found |
| Foundation packages/api-client/openapi/agrimarket.json | PASS | found |
| Controller already forwards request.ip | PASS | 008 partial patch |
| Callback mobile redirect exists | PASS | 008 partial patch |
| VNPAY enum exists | PASS | 008 DTO patch |
| Mobile VNPay adapter exists | PASS | 008 mobile patch |
| Write apps/api/src/modules/thanh-toan/thanh-toan.service.ts | PASS | Đã tạo/cập nhật |
| Do not invalidate checkout before VNPay return | PASS | Cancel/dismiss vẫn giữ local checkout attempt để mở lại cùng Payment |
| Service accepts request IP | PASS | Fixes controller/service TS2554 mismatch |
| Controller passes request IP | PASS | vnp_IpAddr source |
| Gateway registry injected | PASS | Signed URL creation |
| ConfigService injected | PASS | PAYMENT_PUBLIC_BASE_URL |
| VNPay branch wired | PASS | Online create path |
| Gateway createPayment wired | PASS | Signed payment URL |
| VNPay idempotency key | PASS | Same payment attempt reuses same transaction |
| VNPay DB reference is alpha-numeric | PASS | No hyphen mismatch with gateway onlyAlphaNumeric |
| Generic COD key unchanged | PASS | COD/MOCK behavior preserved |
| Online Payment remains PENDING before callback | PASS | Callback owns final state |
| Callback returns order identity | PASS | Deep-link verification target |
| Verified callback before redirect | PASS | Gateway query is not trusted directly |
| Deep-link scheme restricted | PASS | No arbitrary redirect |
| Mobile opens VNPay | PASS | System auth browser |
| Mobile verifies backend payment | PASS | Return query param is not source of truth |
| Payment return uses fixed project scheme | PASS | Matches backend MOBILE_PAYMENT_RETURN_URL |
| No raw fetch in mobile online payment files | PASS | refetch() is no longer a false positive |
| pnpm api-client:ensure | PASS | exit=0 |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-008 + 008B PASS static/type validation.**

### Manual VNPay Sandbox acceptance

- [ ] Cấu hình `VNPAY_TMN_CODE` thật.
- [ ] Cấu hình `VNPAY_HASH_SECRET` thật.
- [ ] `PAYMENT_PUBLIC_BASE_URL` truy cập được từ điện thoại/browser.
- [ ] Dùng development build/standalone có scheme `agrimarket`.
- [ ] Checkout → VNPay Sandbox mở payment URL.
- [ ] VNPay success → Backend callback tìm đúng transaction.
- [ ] Success → Payment `PAID`, reservation `DA_BAN`.
- [ ] Failure → Payment `FAILED`, reservation release.
- [ ] App return → GET Payment Status và hiển thị Backend state.
- [ ] Đóng browser trước callback → Checkout cho mở lại cùng Payment, không tạo Order mới.

Phiên tiếp theo: **MOBILE-FIX-009 — Order + Payment + Shipment**.

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 2.04s
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/customer-web typecheck: Generating route types...
apps/admin-web typecheck: Generating route types...
apps/customer-web typecheck: ✓ Types generated successfully
apps/admin-web typecheck: ✓ Types generated successfully
apps/mobile typecheck: Done
apps/admin-web typecheck: Done
apps/customer-web typecheck: Done
```

### `git diff --check`

Exit code: `0`

```text

```
