# MOBILE-FIX-002 — API runtime & error handling

- Thời gian: `2026-09-06T22:32:36`
- Kết quả bắt buộc: **PASS**

## Mục tiêu phiên

- Một helper unwrap response dùng chung.
- Một error normalizer dùng chung.
- API base URL Mobile cấu hình tập trung.
- React Query retry policy thống nhất.
- Không thay đổi business contract.

## File thay đổi

- `apps/mobile/src/lib/api-response.ts`
- `apps/mobile/src/lib/api-error.ts`
- `apps/mobile/src/lib/api-runtime.ts`
- `apps/mobile/src/lib/api-checkout.ts`
- `apps/mobile/src/lib/api-don-hang.ts`
- `apps/mobile/src/lib/api-gio-hang.ts`
- `apps/mobile/src/lib/api-phan-hoi.ts`
- `apps/mobile/src/lib/api-tai-khoan.ts`
- `apps/mobile/src/lib/api-thong-bao.ts`
- `apps/mobile/src/lib/api-xac-thuc.ts`
- `apps/mobile/src/providers/app-providers.tsx`

## Checklist

| Check | Required | Status | Detail |
|---|:---:|:---:|---|
| File apps/mobile/src/lib/api-response.ts | YES | PASS | Đã tạo/cập nhật |
| File apps/mobile/src/lib/api-error.ts | YES | PASS | Đã tạo/cập nhật |
| File apps/mobile/src/lib/api-runtime.ts | YES | PASS | Đã tạo/cập nhật |
| Duplicate duLieu helpers | YES | PASS | Đã tìm và gom 7 helper về api-response.ts |
| API adapters changed | YES | PASS | Đã cập nhật 7 adapter |
| API runtime in AppProviders | YES | PASS | Đã dùng runtime tập trung |
| React Query retry policy | YES | PASS | Query 4xx không retry; mutation mặc định không retry |
| Direct fetch() scan | NO | PASS | Tìm thấy 1 file; chỉ ghi nhận để review, không tự thay vì có thể là native/external request |
| Local duLieu helper scan | YES | PASS | Không còn helper duLieu() lặp |
| pnpm lint | YES | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | YES | PASS | exit=0 |
| pnpm typecheck | YES | PASS | exit=0 |
| git diff --check | YES | PASS | exit=0 |

## Static scan notes

- Direct fetch(): apps/mobile/src/app/khieu-nai/tao.tsx

## Kết luận

**MOBILE-FIX-002 đạt các kiểm tra bắt buộc.**

Đã chuẩn hóa:

```text
Orval HTTP response
→ duLieuApi()

unknown API error
→ chuanHoaLoiApi()
→ thongBaoLoiApi()

AppProviders
→ cauHinhApiMobile()
→ TanStack retry policy
```

Phiên tiếp theo: **MOBILE-FIX-003 — Auth Session Single-Flight**.

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 2.65s
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/admin-web pretypecheck: Done
apps/admin-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
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
