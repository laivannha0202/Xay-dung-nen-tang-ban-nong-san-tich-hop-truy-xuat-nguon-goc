# Product data & traceability corrections (2026-11-19)

The catalogue is demo data, but a provenance page that names the wrong province is still a lie on
screen. Every correction below is applied by
`apps/api/migrations/013_product_data_normalization.sql` (idempotent) and mirrored in the seeders so a
fresh `pnpm db:seed` produces the same result.

## 1. Origin vs. farm mismatch

A lot's passport shows the **farm's** province and commune, not the product's `origin_note`, so a lot
attached to the wrong farm publishes a wrong origin.

| Product | Was attached to | Province shown | Now attached to | Province shown |
|---|---|---|---|---|
| Gạo ST25 | Vườn nhà màng Đơn Dương | Lâm Đồng | Ruộng lúa Sóc Trăng (new) | Sóc Trăng |
| Mật ong rừng U Minh | Vườn nhà màng Đơn Dương | Lâm Đồng | Rừng tràm U Minh Hạ (new) | Cà Mau |
| Nấm kim châm / hương / đùi gà | Vườn cam Khoái Châu (orange orchard) | Hưng Yên | Trang trại nấm Hưng Yên (new) | Hưng Yên |
| Mật ong nhãn / tương bần / bánh đậu xanh | Vườn cam Khoái Châu | Hưng Yên | Cơ sở chế biến đặc sản Hưng Yên (new) | Hưng Yên |

Seasons were re-pointed, not recreated, so batch codes, QR tokens, allocations and historical orders
all keep their identity. The two new origin farms are created with `WHERE NOT EXISTS` so re-running
the migration is a no-op.

## 2. Slug contradicted the product

`slug = 'mong-toi'` (mồng tơi) served a product named **Rau muống**. Slug is now `rau-muong-bo`, the
image file was renamed to match, and the v7.1 seeder's review key follows the new slug. The SKU
(`SP-MONGTOI`) and every batch code stay put — they are internal keys, not URLs.

## 3. Non-ASCII SKU

`SP-DUAHẠU` embedded a precomposed `Ạ`, so an SKU that is otherwise ASCII could not be typed,
matched or used in an export without NFD/NFC surprises. Renamed to `SP-DUABO`; the season and lot
codes derived from it (`SS-DEMO-…`, `LO-DEMO-…`) moved with it.

## 4. Pre-merger commune names

The ward dataset carries 104 post-merger units. Farm `commune` values that no longer exist
(`Tân Dân`, `Bần Yên Nhân`) are rewritten to the ward that replaced them (`Xã Khoái Châu`,
`Phường Mỹ Hào`) so the passport and the delivery form agree. `district` keeps the historical huyện
name — it is descriptive text, not a foreign key.

## 5. Duplicate lot created during the SKU rename

Re-running `seed-demo-catalog.ts` after the SKU change derived a new lot code for the same product and
hit the QR-token unique index on a half-built lot. The orphan rows (no inventory, no allocations, no
order references) were deleted and the codes reconciled to `LO-DEMO-DUABO`. The seeder is unchanged:
its natural key is `LO-DEMO-<sku-suffix>`, which is correct once the SKU is stable.

## 6. Missing pack size in the description

`Yến mạch` said nothing about the bag, `Hạt điều` nothing about the box, `Nấm kim châm` nothing about
the weight. Pack sizes now appear in the description text (no schema change), so a shopper comparing
per-100 g prices has the denominator on the page.

## What was **not** invented

No lab result, import declaration, certificate number or cultivation log was fabricated. Demo lab
tests keep the literal laboratory name `Phiếu minh hoạ DEMO — không phải phòng kiểm nghiệm`, and the
seeded certificates remain the ones already present (`VN-2026-0291`, `VG-2026-0142`, `GG-2025-8891`).
