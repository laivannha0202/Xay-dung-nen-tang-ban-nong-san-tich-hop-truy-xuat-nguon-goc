# MOBILE-FIX-013 — Home Semantics

- Thời gian: `2026-09-07T08:30:30`
- Kết quả: **FAIL**

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

- Không có file cần sửa.

## Checklist

| Check | Status | Detail |
|---|:---:|---|
| 012B strict guard | PASS | found |
| 012B no unsafe batch index | PASS | found |
| 012 Push sender preserved | PASS | found |
| pnpm api-client:ensure | PASS | exit=0 |
| Public product hook | PASS | found |
| Availability semantics | FAIL | missing |
| Backend relevance sort | FAIL | missing |
| Backend newest sort | FAIL | missing |
| Certification filter | PASS | found |
| Harvest range filter | PASS | found |

## Kết luận

**MOBILE-FIX-013 chưa đạt. Không chuyển sang 014.**

Các mục fail:

- [ ] Availability semantics: missing
- [ ] Backend relevance sort: missing
- [ ] Backend newest sort: missing

## Command logs

### `pnpm api-client:ensure`

Exit code: `0`

```text
$ pnpm --filter @agrimarket/api-client ensure
$ node tools/dam-bao-generated.mjs
```
