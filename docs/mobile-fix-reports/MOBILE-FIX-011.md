# MOBILE-FIX-011 — Account Completion

- Thời gian: `2026-09-07T08:11:22`
- Kết quả: **PASS**

## Account scope

```text
Account
 ├─ Profile read/update
 ├─ Address CRUD/default
 ├─ Wishlist list/remove
 ├─ Followed farms list/unfollow
 ├─ Complaint history/detail
 ├─ Explicit logout
 └─ Notification screen foundation
```

## Ranh giới

- Push production để MOBILE-FIX-012.
- Loyalty/Voucher không được giả lập nếu chưa có customer contract.
- Mọi Account backend call đi qua generated shared client/adapters.

## File thay đổi

- `apps/mobile/src/app/(tabs)/tai-khoan.tsx`
- `apps/mobile/src/app/tai-khoan/ho-so.tsx`
- `apps/mobile/src/app/tai-khoan/dia-chi.tsx`
- `apps/mobile/src/app/tai-khoan/wishlist.tsx`
- `apps/mobile/src/app/tai-khoan/trang-trai-theo-doi.tsx`

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| Foundation apps/mobile/src/app/(tabs)/tai-khoan.tsx | PASS | found |
| Foundation apps/mobile/src/lib/api-tai-khoan.ts | PASS | found |
| Foundation apps/mobile/src/app/tai-khoan/ho-so.tsx | PASS | found |
| Foundation apps/mobile/src/app/tai-khoan/dia-chi.tsx | PASS | found |
| Foundation apps/mobile/src/app/tai-khoan/wishlist.tsx | PASS | found |
| Foundation apps/mobile/src/app/tai-khoan/trang-trai-theo-doi.tsx | PASS | found |
| Foundation apps/mobile/src/app/tai-khoan/khieu-nai.tsx | PASS | found |
| Foundation apps/mobile/src/app/tai-khoan/khieu-nai/[id].tsx | PASS | found |
| Foundation apps/mobile/src/app/tai-khoan/thong-bao.tsx | PASS | found |
| Foundation apps/mobile/src/components/orders/danh-gia-muc-don-hang.tsx | PASS | found |
| Foundation apps/mobile/src/app/khieu-nai/tao.tsx | PASS | found |
| 010B review complete | PASS | found |
| 010B complaint complete | PASS | found |
| 005 explicit logout | PASS | found |
| pnpm api-client:ensure | PASS | exit=0 |
| Profile read | PASS | found |
| Profile update | PASS | found |
| Address list | PASS | found |
| Address create | PASS | found |
| Address update | PASS | found |
| Address default | PASS | found |
| Address delete | PASS | found |
| Wishlist list | PASS | found |
| Wishlist remove | PASS | found |
| Farm follow list | PASS | found |
| Farm unfollow | PASS | found |
| Complaint history | PASS | found |
| Complaint detail | PASS | found |
| Shared response unwrap | PASS | MOBILE-FIX-002 boundary |
| No raw Account backend fetch | PASS | Generated @agrimarket/api-client only |
| Account protected returnTo | PASS | Guest returns to Account tab |
| Account profile error | PASS | Shared API error |
| Logout preserved | PASS | MOBILE-FIX-005 |
| Profile protected returnTo | PASS | Protected account child |
| Profile query error | PASS | Shared API error |
| Profile mutation error | PASS | Backend validation/conflict message |
| Profile cache update | PASS | Account summary stays synchronized |
| Address protected returnTo | PASS | Protected account child |
| Address create/update | PASS | Backend CRUD |
| Address default | PASS | Backend default address |
| Address delete | PASS | Backend delete |
| Address shared errors | PASS | Save/default/delete errors visible |
| Address cache reload | PASS | Checkout address source stays fresh |
| Wishlist protected returnTo | PASS | Protected account child |
| Wishlist Backend list | PASS | Real wishlist |
| Wishlist remove | PASS | Real remove |
| Wishlist cache invalidation | PASS | List stays fresh |
| Wishlist shared errors | PASS | Query + mutation errors |
| Farm protected returnTo | PASS | Protected account child |
| Farm Backend list | PASS | Real follows |
| Farm unfollow | PASS | Real unfollow |
| Farm cache invalidation | PASS | List stays fresh |
| Farm shared errors | PASS | Query + mutation errors |
| Complaint history | PASS | MOBILE-FIX-010 preserved |
| Complaint detail | PASS | MOBILE-FIX-010 preserved |
| Complaint list returnTo | PASS | Protected route |
| Complaint detail returnTo | PASS | Dynamic protected route |
| Notification screen exists | PASS | Production push deferred to MOBILE-FIX-012 |
| Loyalty/Voucher boundary | PASS | Không tạo dữ liệu giả; customer API absence remains explicit |
| No raw HTTP fetch in Account | PASS | Generated/mobile adapters only |
| pnpm lint | PASS | exit=0 |
| pnpm --filter @agrimarket/mobile typecheck | PASS | exit=0 |
| pnpm typecheck | PASS | exit=0 |
| git diff --check | PASS | exit=0 |

## Kết luận

**MOBILE-FIX-011 PASS.**

### Manual Android acceptance

- [ ] Account tab tải đúng hồ sơ và logout vẫn hoạt động.
- [ ] Guest mở Account/Profile/Address/Wishlist/Farms -> Login -> quay lại đúng route.
- [ ] Sửa hồ sơ -> Account summary cập nhật.
- [ ] Thêm/sửa/đặt mặc định/xóa địa chỉ -> Checkout đọc dữ liệu mới.
- [ ] Bỏ wishlist -> item biến mất sau refresh.
- [ ] Bỏ theo dõi farm -> farm biến mất sau refresh.
- [ ] Khi mutation lỗi -> UI hiện thông báo Backend thân thiện.
- [ ] Complaint history/detail vẫn hoạt động.
- [ ] Loyalty/Voucher không hiển thị số liệu giả.

Phiên tiếp theo: **MOBILE-FIX-012 — Push Production**.

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
apps/api typecheck: ✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 413ms
packages/api-client typecheck: Done
apps/api typecheck: Done
apps/customer-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
apps/admin-web pretypecheck$ pnpm --filter @agrimarket/api-client ensure
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
