# MOBILE-FIX-008 — VNPay Sandbox End-to-End

- Thời gian: `2026-09-06T23:56:08`
- Kết quả static/type: **FAIL**

## Luồng

```text
Create Order
  ↓
POST /thanh-toan VNPAY_SANDBOX
  ↓
Payment=PENDING + signed paymentUrl
  ↓
expo-web-browser
  ↓
VNPay Sandbox
  ↓
Backend /thanh-toan/callback/VNPAY_SANDBOX/mobile
  ↓
verify signature + amount
  ↓
PAID + DA_BAN   |   FAILED + release
  ↓
302 agrimarket://thanh-toan/ket-qua?donHangId=...
  ↓
Mobile GET Payment Status
  ↓
Verified result UI
```

## Environment

- `VNPAY_TMN_CODE`: credential sandbox merchant.
- `VNPAY_HASH_SECRET`: secret sandbox merchant.
- `PAYMENT_PUBLIC_BASE_URL`: URL Backend mà browser trên thiết bị truy cập được.
- `MOBILE_PAYMENT_RETURN_URL=agrimarket://thanh-toan/ket-qua`.

Điện thoại thật local cần `PAYMENT_PUBLIC_BASE_URL` dùng LAN IP hoặc HTTPS tunnel/public URL.
Expo Go không đăng ký custom scheme project; full deep-link test cần development build/standalone.

## File thay đổi

- `apps/api/src/modules/thanh-toan/dto/tao-thanh-toan.dto.ts`
- `apps/api/src/modules/thanh-toan/dto/phan-hoi-thanh-toan.dto.ts`
- `apps/api/src/modules/thanh-toan/dto/phan-hoi-callback-thanh-toan.dto.ts`
- `apps/api/src/modules/thanh-toan/thanh-toan.controller.ts`
- `apps/api/src/modules/thanh-toan/thanh-toan-callback.service.ts`
- `apps/api/src/modules/thanh-toan/thanh-toan-callback.controller.ts`
- `.env.example`
- `packages/api-client/openapi/agrimarket.json`
- `apps/mobile/src/lib/api-thanh-toan.ts`
- `apps/mobile/src/lib/payment-return.ts`
- `apps/mobile/src/app/thanh-toan/ket-qua.tsx`
- `apps/mobile/src/app/thanh-toan.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Foundation apps/api/src/modules/thanh-toan/dto/tao-thanh-toan.dto.ts | PASS | found |
| Foundation apps/api/src/modules/thanh-toan/thanh-toan.service.ts | PASS | found |
| Foundation apps/api/src/modules/thanh-toan/thanh-toan-callback.service.ts | PASS | found |
| Foundation apps/mobile/src/lib/api-thanh-toan.ts | PASS | found |
| Foundation apps/mobile/src/app/thanh-toan.tsx | PASS | found |
| Foundation packages/api-client/openapi/agrimarket.json | PASS | found |
| 007 COD wired | PASS | COD flow |
| 007 payment status adapter | PASS | GET Payment Status |
| 007 atomic cart clear | PASS | Backend cart cleanup |
| Write apps/api/src/modules/thanh-toan/dto/tao-thanh-toan.dto.ts | PASS | Đã tạo/cập nhật |
| Write apps/api/src/modules/thanh-toan/dto/phan-hoi-thanh-toan.dto.ts | PASS | Đã tạo/cập nhật |
| Write apps/api/src/modules/thanh-toan/dto/phan-hoi-callback-thanh-toan.dto.ts | PASS | Đã tạo/cập nhật |
| Insert VNPay methods | FAIL | Không tìm thấy layTheoDonHangCuaToi anchor |
| Payment controller forwards IP | PASS | VNPay vnp_IpAddr lấy từ authenticated request |
| Callback returns order identifiers | PASS | Mobile redirect có order identity |
| Mobile callback route | PASS | Backend verified callback -> fixed agrimarket deep link |
| Payment callback env | PASS | Local/production callback configuration documented |
| OpenAPI payment enum | PASS | Existing taoThanhToan generated contract supports VNPay |
| OpenAPI online response fields | PASS | Generated response can carry gateway URL |
| pnpm api-client:generate | PASS | exit=0 |
| pnpm api-client:ensure | PASS | exit=0 |
| Write apps/mobile/src/lib/api-thanh-toan.ts | PASS | Đã tạo/cập nhật |
| Write apps/mobile/src/lib/payment-return.ts | PASS | Đã tạo/cập nhật |
| Write apps/mobile/src/app/thanh-toan/ket-qua.tsx | PASS | Đã tạo/cập nhật |
| Write apps/mobile/src/app/thanh-toan.tsx | PASS | Đã tạo/cập nhật |
| Backend payment enum includes VNPay | PASS | DTO validates real sandbox method |
| Gateway create is wired | FAIL | Signed payment URL comes from gateway adapter |
| Online payment remains idempotent | PASS | Retry same payment key |
| Online reservation stays pending before callback | PASS | Callback owns final PAID/FAILED transition |
| Callback redirect is verified first | PASS | No direct gateway-status trust |
| Redirect scheme whitelist | PASS | Avoid arbitrary open redirect |
| Generated client includes VNPay enum | PASS | Shared Orval client synchronized |
| Generated client includes paymentUrl | PASS | Online response typed |
| Mobile uses generated taoThanhToan | PASS | No raw fetch |
| Checkout opens system auth browser | PASS | VNPay leaves app safely |
| Checkout offers COD and VNPay | PASS | User can select payment method |
| Mobile result verifies Backend status | PASS | Query param is not source of truth |
| No legacy fake verification warning | PASS | Result screen reflects current API capability |
| No direct fetch in online mobile files | FAIL | Shared client boundary preserved |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | FAIL | exit=2 |
| git diff --check | PASS | exit=0 |
| VNPay sandbox credentials | WARN | Chưa có root .env để kiểm tra; code vẫn có thể PASS static validation |

## Kết luận

**MOBILE-FIX-008 chưa đạt. Không chuyển sang 009.**

Các mục fail:

- [ ] Insert VNPay methods: Không tìm thấy layTheoDonHangCuaToi anchor
- [ ] Gateway create is wired: Signed payment URL comes from gateway adapter
- [ ] No direct fetch in online mobile files: Shared client boundary preserved
- [ ] pnpm typecheck: exit=2

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

Exit code: `2`

```text
$ tsc --noEmit -p tsconfig.json && pnpm -r --filter './apps/**' --filter './packages/**' --if-present run typecheck
Scope: 8 of 9 workspace projects
apps/api typecheck$ prisma generate --config prisma7.config.ts && tsc --noEmit -p tsconfig.json
packages/api-client typecheck$ pnpm run ensure && tsc --noEmit -p tsconfig.json
packages/api-client typecheck: $ node tools/dam-bao-generated.mjs
apps/api typecheck: Loaded Prisma config from prisma7.config.ts.
apps/api typecheck: Prisma schema loaded from prisma/schema.prisma.
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 1.89s
packages/api-client typecheck: Done
apps/api typecheck: src/modules/thanh-toan/thanh-toan.controller.ts(72,7): error TS2554: Expected 2 arguments, but got 3.
apps/api typecheck: Failed
/home/nha/Downloads/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc/apps/api:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @agrimarket/api@0.0.0 typecheck: `prisma generate --config prisma7.config.ts && tsc --noEmit -p tsconfig.json`
Exit status 2
[WARN]  Local package.json exists, but node_modules missing, did you mean to install?
[ELIFECYCLE] Command failed with exit code 2.
```

### `git diff --check`

Exit code: `0`

```text

```
