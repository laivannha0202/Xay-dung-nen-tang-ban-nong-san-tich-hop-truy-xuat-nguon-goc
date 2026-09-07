# MOBILE-FIX-003 — Auth Session Single-Flight

- Thời gian: `2026-09-06T22:35:11`
- Kết quả: **PASS**

## Mục tiêu

Đảm bảo nhiều API request đồng thời khi access token hết hạn chỉ tạo một refresh request.

```text
API A ─┐
API B ─┼─ access token hết hạn
API C ─┘
       ↓
  lamMoiPromise
       ↓
  1 × apiLamMoi()
       ↓
 access token mới
       ↓
 A/B/C cùng tiếp tục
```

## File thay đổi

- `apps/mobile/src/lib/phien-xac-thuc.ts`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Add lamMoiPromise | PASS | Đã thêm shared refresh promise |
| Refresh implementation | PASS | Đã tách internal refresh + single-flight wrapper |
| Login refresh race guard | PASS | Login chờ refresh đang chạy |
| Logout refresh race guard | PASS | Logout chờ refresh rồi revoke token mới nhất |
| Shared refresh promise | PASS | lamMoiPromise được khai báo |
| Internal refresh function | PASS | refresh thật đã được tách khỏi public wrapper |
| Public refresh wrapper | PASS | public API trả shared Promise |
| Promise assignment | PASS | chỉ tạo refresh promise khi chưa tồn tại |
| Promise cleanup | PASS | promise được reset sau khi refresh hoàn tất |
| damBaoAccessToken uses single-flight | PASS | mọi bearer request đi qua single-flight wrapper |
| Restore uses single-flight | PASS | app restore cũng dùng cùng refresh wrapper |
| Single apiLamMoi call site | PASS | apiLamMoi() call sites = 1 |
| Login waits in-flight refresh | PASS | chặn refresh cũ ghi đè login mới |
| Logout waits in-flight refresh | PASS | đọc/revoke refresh token mới nhất |
| Access token remains memory-only | PASS | không thay đổi security model hiện tại |
| Refresh token remains SecureStore abstraction | PASS | không thay đổi secure-token abstraction |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-003 PASS.**

Đã xử lý:

- concurrent refresh single-flight;
- restore cùng dùng single-flight;
- login không bị refresh cũ ghi đè;
- logout đợi refresh và revoke refresh token mới nhất;
- access token vẫn memory-only;
- refresh token vẫn qua SecureStore abstraction.

Phiên tiếp theo: **MOBILE-FIX-004 — Protected Route + Return-To + Pending Action**.

## Command logs

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 449ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
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
