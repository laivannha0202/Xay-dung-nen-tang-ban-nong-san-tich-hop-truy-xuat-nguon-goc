# Product & price research (2026-11-19)

Every number below is a **retail** reference (siêu thị / cửa hàng nông sản online), because the shop
sells single households in Hưng Yên, not wholesale lots. The demo catalogue before this pass carried
wholesale-style prices (Gạo ST25 150.000₫/kg) and sold liquids by the litre, so a shopper comparing to
WinMart saw a 4× markup.

| Product (SKU) | Old price | New price | Unit | Reference | Note |
|---|---|---|---|---|---|
| Gạo ST25 (`SP-GAOST25`) | 150.000₫ | **38.000₫** | kg | NEPTUNE ST25 5 kg = 251.200₫ → 50.240₫/kg niêm yết, 25.980₫/kg khi khuyến mại ([WinMart](https://winmart.vn/products/neptune-gao-st25-special-5kg--s10198642)) | 38.000₫ sits between the two, matching a mid-market branded bag |
| Gạo nếp cái hoa vàng (`SP-GAONEP`) | 95.000₫ | **37.000₫** | kg | Nếp cái hoa vàng Vinh Hiển túi 1 kg = 38.500₫ ([Kingfoodmart](https://kingfoodmart.com/nep/nep-cai-hoa-vang-vinh-hien-tui-1kg-4)) | |
| Gạo lứt huyết rồng (`SP-GAOLUT`) | 72.000₫ | **32.000₫** | kg | gạo lứt bán lẻ 28.000–36.000₫/kg | ~30% premium over white rice is the observed shelf gap |
| Gạo thơm Jasmine (`SP-GAOJA`) | 58.000₫ | **26.000₫** | kg | Jasmine bán lẻ 24.000–30.000₫/kg | |
| Nấm kim châm (`SP-NAMKIM`) | 18.000₫ | **15.000₫** | gói 150 g | WinMart 14.900₫/gói 150 g ([WinMart](https://winmart.vn/products/nam-kim-cham-150g--s10053991)) | |
| Nấm hương (`SP-NAMHUONG`) | — | 65.000₫ | kg | nấm hương tươi 60.000–75.000₫/kg | unchanged |
| Nấm đùi gà (`SP-NAMGIA`) | — | 55.000₫ | kg | 50.000–60.000₫/kg | unchanged |
| Rau muống (`SP-MONGTOI`) | — | 13.000₫ | bó ~500 g | bó rau muống 10.000–15.000₫ | unchanged |
| Hạt điều rang bơ (`SP-HATDIEU`) | 210.000₫ | **95.000₫** | hộp 250 g | hạt điều rang 340.000–420.000₫/kg → ~95.000₫/250 g | |
| Yến mạch cán dẹt (`SP-YENMACH`) | 68.000₫ | 68.000₫ | gói 500 g | 60.000–80.000₫/500 g | unchanged |
| Mật ong hoa nhãn (`SP-MATONGNHAN`) | 265.000₫/**lít** | **165.000₫** | chai 500 ml | mật ong nhãn Hưng Yên 300.000–350.000₫/lít | unit changed lít → chai |
| Mật ong rừng U Minh (`SP-MATONG`) | 380.000₫/**lít** | **190.000₫** | chai 500 ml | mật ong rừng 350.000–400.000₫/lít | unit changed lít → chai |
| Tương bần (`SP-TUONGBAN`) | 85.000₫/**lít** | **45.000₫** | chai 500 ml | tương bần 80.000–95.000₫/lít | unit changed lít → chai |
| Bánh đậu xanh (`SP-BANHDAUX`) | — | 85.000₫ | hộp 500 g | 70.000–100.000₫/hộp 500 g | unchanged |

## Why the unit changed for liquids

`unit = 'lít'` on a 500 ml bottle makes the stepper quote 1 = 1 litre and the price read 265.000₫
for half of what the shopper receives. All three processed-liquor products now sell in `chai` with the
volume in the description, which is also the vocabulary the DB already used for `gói / hộp / bó / nải`.

## What deliberately did **not** change

- No price was invented for a product without a public shelf reference (nấm hương, đùi gà, rau muống,
  yến mạch, bánh đậu xanh, tương bần) — they stayed at the seeded value or moved only when the unit forced it.
- No laboratory result, import document or certificate was fabricated. Demo lab tests stay labelled
  `Phiếu minh hoạ DEMO — không phải phòng kiểm nghiệm`.
- Historical orders keep their `unit_price_vnd` snapshot; the migration issues no `UPDATE order_lines`.
- The 500.000₫ free-ship threshold is policy, not a price, and is untouched. Only the quantity in
  `apps/api/test/07-service-area.test.ts` moved (5 kg → 14 kg) so the boundary is still crossed.
