# MOBILE-FIX-005 — Logout + Session Expired UX

- Thời gian: `2026-09-06T23:10:26`
- Kết quả: **PASS**

## Session state sau phiên

```text
Không có refresh token
→ chua-dang-nhap / chua-co-phien

Refresh 400/401/403
→ xóa token
→ chua-dang-nhap / het-phien
→ thông báo phiên hết hạn

Refresh network/5xx
→ GIỮ refresh token
→ chua-dang-nhap / loi-ket-noi
→ thông báo kiểm tra kết nối

User bấm Đăng xuất
→ revoke backend nếu có thể
→ luôn xóa local token + pending action + query cache
→ Home
```

## File thay đổi

- `apps/mobile/src/stores/xac-thuc.store.ts`
- `apps/mobile/src/lib/phien-xac-thuc.ts`
- `apps/mobile/src/components/auth/session-auth-notice.tsx`
- `apps/mobile/src/providers/app-providers.tsx`
- `apps/mobile/src/app/(tabs)/tai-khoan.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Foundation apps/mobile/src/lib/api-error.ts | PASS | found |
| Foundation apps/mobile/src/lib/auth-navigation.ts | PASS | found |
| Foundation apps/mobile/src/lib/phien-xac-thuc.ts | PASS | found |
| Foundation apps/mobile/src/providers/app-providers.tsx | PASS | found |
| Foundation apps/mobile/src/app/(tabs)/tai-khoan.tsx | PASS | found |
| layTrangThaiHttp available | PASS | MOBILE-FIX-002 error normalizer |
| xoaHanhDongSauDangNhap available | PASS | MOBILE-FIX-004 pending action cleanup |
| single-flight refresh available | PASS | MOBILE-FIX-003 foundation |
| Auth reason state | PASS | Store phân biệt anonymous / expired / connection / logout |
| Refresh failure classification | PASS | 400/401/403 expire token; transient errors preserve refresh token |
| Explicit logout cleanup | PASS | access + refresh + pending action luôn được dọn |
| SessionAuthNotice | PASS | Alert riêng cho expired session và transient restore failure |
| Mount SessionAuthNotice | PASS | Mounted trong AppProviders |
| Account logout state | PASS | Có loading state |
| Account logout handlers | PASS | Logout local + clear cache + Home |
| Account logout button | PASS | CTA người dùng thật |
| Store has auth reason | PASS | reason state |
| No token means anonymous | PASS | cold start without refresh token |
| Expired refresh clears token | PASS | invalid refresh token |
| Transient refresh preserves token | PASS | network/server failure |
| Logout clears pending action | PASS | explicit logout cleanup |
| Session notice mounted | PASS | global session UX |
| Expired alert exists | PASS | user-facing expiration explanation |
| Connection alert exists | PASS | network is not mislabeled as expiration |
| Account logout CTA exists | PASS | customer can explicitly logout |
| Logout clears query cache | PASS | account data not left in query cache |
| Transient branch does not delete refresh token | PASS | xoaRefreshToken chỉ nằm trước nhánh transient |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-005 PASS.**

### Manual Android acceptance

- [ ] Login → Tài khoản → Đăng xuất → confirm → Home.
- [ ] Sau logout mở Cart/Account → yêu cầu login.
- [ ] Login user A → logout → login user B → không thấy cache user A.
- [ ] Refresh token invalid → hiện thông báo phiên hết hạn.
- [ ] Tắt Backend/mạng lúc restore → hiện lỗi kết nối, refresh token không bị xóa.
- [ ] Bật lại Backend rồi reload app → có thể restore session từ refresh token còn giữ.

Phiên tiếp theo: **MOBILE-FIX-006 — Checkout Contract V2**.

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 1.97s
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/mobile pretypecheck: $ node tools/dam-bao-generated.mjs
apps/customer-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/admin-web pretypecheck: $ node tools/dam-bao-generated.mjs
apps/mobile pretypecheck: Done
apps/mobile typecheck$ tsc --noEmit
apps/customer-web pretypecheck: Done
apps/customer-web typecheck$ next typegen && tsc --noEmit -p tsconfig.json
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
