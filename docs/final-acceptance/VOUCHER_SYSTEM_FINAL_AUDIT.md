# Hệ thống voucher AgriMarket — báo cáo nghiệm thu

Ngày: 2026-11-23 · Nhánh: `feat/premium-visual-redesign-v5` · HEAD trước khi commit: `34268e7`

> **Bản cập nhật 2 — bốn lỗi còn lại.** Mục 1–6 dưới đây là biên bản lần sửa thứ nhất và
> được giữ nguyên. Lần sửa thứ hai (giới hạn lượt dùng, trạng thái API công khai, báo giá
> cũ trên Mobile, ví tính từ giá gốc) ghi ở mục 12, cùng `VOUCHER_FINAL_REGRESSION.md`.

## 1. Chức năng trước khi sửa

| Hạng mục | Trạng thái trước |
|---|---|
| Nhập mã khuyến mãi ở checkout web | Có, nhưng mất `address_id` khi áp mã → phí giao quay về "tạm tính" |
| Danh sách voucher cho khách | Chỉ 10 mã, không phân biệt điều kiện/đã lưu/đã hết hạn |
| Trang ưu đãi công khai | Không có |
| Ví voucher (lưu theo tài khoản) | Không có, không có bảng lưu |
| Mobile | **Không gửi `promotion_code`** ở `/checkout/preview` và `/orders` — voucher không thể dùng |
| Số lượt dùng | `used_count` tăng bằng `UPDATE không điều kiện`, hai đơn đồng thời có thể vượt giới hạn |
| Mã không dùng được | Preview trả lỗi 409 làm hỏng toàn bộ trang thanh toán, không nói lý do cụ thể |
| Đổi voucher cùng số tiền giảm | `quote_version` không đổi → có thể xác nhận đơn theo mã khác |

## 2. Lỗi đã phát hiện

1. **Mất địa chỉ khi áp voucher (Web).** `loadPreview(code)` gọi với `address_id` rỗng → `address_status: MISSING`, phí giao thành tạm tính; xác nhận đơn bị chặn dù đã chọn địa chỉ.
2. **Voucher không tồn tại/hết hạn/hết lượt làm sập bước xem giá** (`errors.conflict` từ `buildQuote`) thay vì chỉ báo mã đó không dùng được.
3. **Mobile không có voucher** ở cả hai phía: preview và submit.
4. **Vượt giới hạn lượt dùng** khi hai khách đặt cùng lúc: kiểm tra `used_count` chỉ là đọc, không khoá.
5. **`quote_version` bỏ sót danh tính voucher**: đổi HUNGYEN10 (10%) sang một mã 50.000₫ trên đơn 500.000₫ vẫn giữ nguyên version.
6. **Không có nơi lưu voucher của khách**, nên không thể có ví dùng chung Web–Mobile.
7. Seed dev DB chỉ có 2 mã; mã `HUNGYEN10` (min 200.000₫) chỉ tồn tại ở seeder đơn demo.
8. **Đơn đặt với mã đã mất hiệu lực giữa preview và submit** trước đây: version đổi nhưng thông báo là `PRICE_CHANGED`, gộp chung với đổi giá.

## 3. Cách sửa

### Backend

- `apps/api/src/services/promotions.ts` (mới): một nguồn sự thật cho trạng thái voucher
  (`AVAILABLE / UPCOMING / EXPIRED / PAUSED / USED_UP / MIN_SUBTOTAL / INVALID`), hàm tính giảm
  giá (chặn trên bằng tiền hàng), lý do bằng tiếng Việt có số tiền còn thiếu, và
  `consumePromotionUse` với điều kiện trong SQL.
- `apps/api/src/services/pricing.ts`
  - `buildQuote` không còn ném lỗi khi mã không dùng được: trả `promotion_error { code, state, reason }`
    và tiếp tục định giá tiền hàng (không giảm giá).
  - `quoteVersion` bao gồm `promotion_id` → đổi mã, dù cùng số tiền giảm, buộc xác nhận lại.
  - Giữ nguyên thứ tự tiền: subtotal (sau giảm lô) → ship trên subtotal → voucher → tổng.
- `apps/api/src/routes/customer.ts`
  - `POST /checkout/preview`: `available_promotions` là danh sách có trạng thái tính theo **giỏ của chính khách** (giàu thông tin hơn 10 mã cũ), kèm `saved`, `remaining_vnd`, `discount_vnd`.
  - `POST /orders`: kiểm tra mã còn dùng được **trước** khi so version; nếu không → `409 PROMOTION_EXPIRED` kèm lý do; sau đó `consumePromotionUse` khoá lượt dùng trong transaction (thua = rollback toàn bộ, không giữ kho, không tiêu lượt).
  - Mới: `GET /me/promotions`, `POST /me/promotions/:promotionId`, `DELETE /me/promotions/:promotionId` — chỉ chủ ví; lưu trùng không tạo bản ghi thứ hai; bỏ lưu không đụng `promotions`.
- `apps/api/src/routes/public.ts`: `GET /promotions` — chỉ chương trình đang chạy, công khai, không lộ dữ liệu cá nhân.

### Web

- `/uu-dai` (`app/uu-dai/page.tsx` + `components/offer-board.tsx`): bảng ưu đãi thẻ phiếu (giá trị – mã – điều kiện – hạn), nút **Lưu voucher** / **Đã lưu**, khách chưa đăng nhập thấy lời mời đăng nhập.
- `/tai-khoan/voucher` (`components/voucher-wallet.tsx`): nhóm **Có thể sử dụng / Chưa đủ điều kiện / Đã hết hạn hoặc hết lượt**, mỗi thẻ hiện lý do và số tiền còn thiếu; bỏ lưu được.
- Thẻ **Ví voucher** trong `/tai-khoan`, mục **Voucher** trong thanh tài khoản, mục **Ưu đãi** trên thanh danh mục.
- Checkout (`components/checkout-flow.tsx` + `voucher-picker.tsx`):
  - Tách *mã đang nhập* và *mã đã áp* — gõ sai vẫn giữ chữ để sửa, tổng tiền luôn theo mã server đã nhận.
  - Mọi lần đổi mã/địa chỉ đều gọi lại `/checkout/preview` với **cả `promotion_code` và `address_id` đang chọn** (`addressRef`).
  - Khu **Voucher AgriMarket** riêng trong cột chính: ví → ưu đãi đang chạy → nhập mã → mã chưa dùng được (mở rộng được).
  - `quoting` khoá nút **Xác nhận đặt hàng** và đổi nhãn "Đang tính lại giá…" — không xác nhận bằng báo giá cũ.
  - Bấm **Gỡ mã** quay về giá gốc, địa chỉ giữ nguyên.

### Mobile (React Native)

- `src/vouchers.tsx` (mới): màn **Ưu đãi AgriMarket** + ví trong Hồ sơ, cùng ngôn ngữ trạng thái với web; `VoucherSheet` (BottomSheet có sẵn, Android back đóng) cho checkout.
- `src/screens.tsx`: checkout gửi `promotion_code` ở **cả** `/checkout/preview` và `/orders`; lỗi `PROMOTION_EXPIRED` xoá mã, báo lý do, cấp idempotency key mới.
- `src/nav.ts`: route `checkout` nhận `code?`, thêm route `vouchers`; mục **Ví voucher** trong menu tài khoản.

## 4. Migration

`apps/api/migrations/015_customer_saved_promotions.sql` — bảng `customer_saved_promotions`
(`customer_id`, `promotion_id`, `saved_at`, `UNIQUE(customer_id, promotion_id)`, FK `ON DELETE CASCADE`,
index theo khách và theo chương trình). Không sửa dữ liệu cũ, không reset DB.

## 5. API

| Method | Path | Quyền |
|---|---|---|
| GET | `/promotions` | công khai |
| GET | `/me/promotions` | khách đang đăng nhập |
| POST | `/me/promotions/:promotionId` | chỉ ví của chính mình |
| DELETE | `/me/promotions/:promotionId` | chỉ ví của chính mình |
| POST | `/checkout/preview` | thêm `promotion_error`, `available_promotions[]` |
| POST | `/orders` | `PROMOTION_EXPIRED` khi mã mất hiệu lực |

Admin: không thêm trang mới. `/admin/khuyen-mai` và `POST/PATCH /admin/promotions` giữ nguyên (trùng mã, % >90, giới hạn lượt, tạm dừng) — chỉ đổi cách đọc lượt dùng.

## 6. Kết quả tính toán (kiểm thử thật, không suy diễn)

| Case | Kỳ vọng | Kết quả |
|---|---|---|
| 300.000₫ + RAUMAU2026 (10%) | −30.000, ship 20.000, tổng 290.000 | PASS |
| 500.000₫ + FREESHIP50 | −50.000, ship 0 (ngưỡng trên tiền hàng), tổng 450.000 | PASS |
| 300.000₫ + voucher 900.000₫ | giảm chặn ở 300.000, tổng = 20.000 | PASS |
| 632.000₫, 3 dòng lô, +RAUMAU2026 | 632.000 → **568.800** (−63.200) | PASS (ảnh `checkout-applied-1440.png`) |
| Gỡ mã | về 632.000 | PASS (ảnh `checkout-removed-1440.png`) |
| 50.000₫ + RAUMAU2026 (min 100.000) | `MIN_SUBTOTAL`, lý do "còn thiếu 50.000₫", không giảm | PASS |
| Đổi mã cùng số giảm | version khác nhau | PASS |
| Hết hạn giữa preview và submit | `409 PROMOTION_EXPIRED` | PASS |
| 2 khách tranh lượt cuối | 1 đơn 201, 1 đơn 409, `used_count = 1` | PASS |
| Gửi lặp idempotency-key | 1 đơn, 1 lượt | PASS |

Công thức giữ nguyên: `max(0, subtotal − voucher) + ship_fee`, `ship_fee` xét trên subtotal **trước** voucher; ngưỡng 500.000₫, phí 20.000₫ không đổi.

## 7. Kiểm thử

| Lệnh | Kết quả |
|---|---|
| `pnpm -r typecheck` | PASS (5 workspace) |
| `pnpm test` | **103/103** PASS, gồm `test/14-vouchers.test.ts` (12 case mới) |
| `pnpm verify:local` | **10/10** PASS (env, postgres, test DB 14 migrations, typecheck, api, admin build, customer build, expo typecheck, expo export, secret scan) |
| `pnpm e2e:local` | **10/10** PASS |
| `pnpm acceptance` | **38/38** PASS |
| Browser 1440/1280/768/390/360 | `overflowX = 0` mọi trang; xem `docs/screenshots/final/voucher-system/layout-report.json` |

Ghi chú trung thực: lần chạy e2e đầu tiên FAIL vì tiến trình `next dev` admin cũ còn treo trên cổng 3001 trả 500 cho `/dang-nhap`; sau khi khởi động lại thì 10/10 PASS. Không sửa hay bỏ qua test nào.

## 8. Ảnh minh chứng

`docs/screenshots/final/voucher-system/`

- `offers-1440/1280/768/390/360.png` — trang ưu đãi các kích thước
- `wallet-1440.png`, `wallet-390.png` — ví voucher desktop + mobile web
- `wallet-expired-1440.png`, `wallet-expired-390.png` — voucher hết hạn hiển thị trong ví (chụp với FREESHIP50 tạm đặt `end_at` quá khứ, đã khôi phục)
- `checkout-before-1440/390.png` — trước khi áp mã (632.000₫)
- `checkout-applied-1440/390.png` — đã áp mã (568.800₫)
- `checkout-removed-1440.png` — sau khi gỡ mã (632.000₫)
- `checkout-not-eligible-1280.png` — mã chưa đủ điều kiện (mở rộng "Mã chưa dùng được")
- `layout-report.json` — số liệu tràn ngang từng lần chụp

## 9. Chức năng chưa thể nghiệm thu

- **Native trên thiết bị/emulator: CHƯA CHẠY.** Logic voucher của app đã typecheck và export web bundle (`expo export` PASS), nhưng chưa bật màn thật trên Android/iOS. Không có ảnh Native nào được tạo.
- Đồng bộ Web ↔ Mobile được chứng minh ở tầng API/dữ liệu (cùng `/me/promotions`), **không** qua trình giả lập.
- Đọc phí giao theo xã/phường trên thiết bị thật: chưa kiểm.
- Kiểm thử bàn phím/focus mới chỉ ở mức markup (nút, `aria-expanded`, `role="alert"`), chưa chạy axe.

## 10. Lỗi còn lại

- Chưa có chức năng hoàn lượt khi đơn bị huỷ — chính sách chưa được chủ dự án xác định, nên
  `used_count` **không giảm** khi đơn `CANCELLED`. Định nghĩa lượt sử dụng hiện hành: một lượt
  chỉ được ghi khi đơn được tạo thành công, và vẫn tính dù đơn sau đó bị huỷ.
- Danh sách "voucher đã sử dụng" không tách riêng: dữ liệu lịch sử (`orders.promotion_id`) đủ để làm, nhưng chưa hiển thị.
- **Native trên emulator/thiết bị vẫn CHƯA chạy** — xem mục 12.5.

### 10.1 Giới hạn lượt dùng — đã chuẩn hoá ở lần sửa thứ hai

`limitWindow` (giới hạn theo tháng dương lịch) và `used_in_window` đã bị **xoá**. `usage_limit`
giờ là giới hạn cho toàn bộ vòng đời chương trình, và `promotions.used_count` là bộ đếm duy nhất
— cùng cột mà `consumePromotionUse` dùng làm điều kiện khoá trong SQL. Không còn chênh lệch
giữa "còn lượt trong tháng" và "còn lượt thật".

## 11. Commit

| SHA | Nội dung |
|---|---|
| `01e054a` | Backend: `promotions` service, migration 015, `/me/promotions`, `/promotions`, `promotion_error`, khoá lượt dùng |
| `794eaa3` | `test/14-vouchers.test.ts` (12 case) |
| `194f9be` | Web: `/uu-dai`, `/tai-khoan/voucher`, thẻ voucher, lối vào tài khoản + thanh danh mục |
| `9cfe930` | Web checkout: giữ địa chỉ, giữ mã, khoá nút khi đang tính lại giá |
| `43a6b14` | Mobile: màn ví/ưu đãi, `promotion_code` ở preview + orders, bottom sheet; ảnh minh chứng |

## 12. Lần sửa thứ hai — bốn lỗi còn lại

Base: `34268e7`. Chi tiết test và bằng chứng: `VOUCHER_FINAL_REGRESSION.md`.

### 12.1 Giới hạn lượt dùng không nhất quán (HIGH)

**Root cause.** `PROMOTION_SELECT` đếm `used_in_window` bằng `COUNT(orders)` trong tháng dương
lịch (bỏ đơn `CANCELLED`), trong khi `consumePromotionUse` khoá trên `used_count` tích luỹ. Hai
bộ đếm khác nhau: giao diện thấy "còn lượt", submit thấy "hết lượt". Bộ đếm dựa trên đơn còn có
thể tụt khi đơn bị huỷ, trong khi `used_count` không tụt — vĩnh viễn hai con số.

**Sửa.** Xoá `limitWindow`/`used_in_window`; `promotionState` đọc `p.used_count` — đúng cột mà
`consumePromotionUse` kiểm tra trong `UPDATE … WHERE used_count < usage_limit`. Một bộ đếm, một
định nghĩa: **một lượt = một đơn tạo thành công**; huỷ đơn không hoàn lượt (chính sách chưa
được chốt). `consumePromotionUse` kiểm tra thêm `status='ACTIVE'` và cửa sổ thời gian, nên một
chương trình bị tạm dừng giữa lúc xem giá và lúc đặt vẫn không tiêu lượt.

**Nhãn.** "N lượt/tháng" → "tối đa N lượt cho cả chương trình" (thẻ voucher Web + Mobile).

### 12.2 API công khai hiển thị sai trạng thái (MEDIUM)

**Root cause.** `GET /promotions` ghi đè `state: 'AVAILABLE'`, `reason: ''` cho mọi dòng, và
truyền `subtotal = 0` vào `toView` để né `MIN_SUBTOTAL` — hết lượt, hết hạn đều hiện như dùng được.

**Sửa.** Bỏ ghi đè. `toView` nhận `subtotal: number | null`; `null` = "không có giỏ" → trạng thái
chương trình (AVAILABLE / USED_UP / UPCOMING / EXPIRED / PAUSED) là thật, còn đơn tối thiểu chỉ
in ra như điều kiện, không kết luận thay khách. `discount_vnd = 0` khi chưa có giỏ. `listPublicPromotions`
chỉ trả chương trình đang trong cửa sổ (`status='ACTIVE' AND now() BETWEEN start_at AND end_at`),
nên tạm dừng / chưa bắt đầu / hết hạn không bị quảng bá.

### 12.3 Mobile có thể đặt hàng bằng báo giá cũ (HIGH)

**Root cause.** `useFetch` giữ `data` cũ trong lúc `reload` và không có `pending`; nút xác nhận chỉ
kiểm tra `quote` khác null. Đổi voucher/địa chỉ → bấm ngay → gửi `quote_version` của báo giá cũ.
Không có chống race: kết quả chậm của voucher A ghi đè kết quả mới của B.

**Sửa (mobile).**
- `useFetch`: thêm `pending` (true từ lúc key đổi tới lúc kết quả về), `reset()`, và số thứ tự
  request — chỉ request mới nhất được `setData`/`setError`, request cũ bị bỏ.
- `screens.tsx` (checkout): mọi thay đổi voucher/địa chỉ gọi `resetQuote()` trước (báo giá cũ
  biến mất ngay), hiện thẻ "Đang tính lại giá…", nút đổi nhãn và `disabled` khi `quotePending`,
  `placeOrder` chặn nếu `quotePending`; lỗi tải hiện "Chưa tính lại được giá" + nút **Thử lại**.
- `PRICE_CHANGED` / `PROMOTION_EXPIRED` / `OUT_OF_STOCK` → `resetQuote()` rồi tải lại (không dùng
  payload cũ để dựng lại tổng tiền).

**Sửa (web).** `loadPreview` có `previewSeq` — chỉ kết quả mới nhất ghi vào state; `submit` chặn khi `quoting`.

### 12.4 Ví voucher tính điều kiện từ giá gốc (MEDIUM)

**Root cause.** `GET /me/promotions` tính `SUM(ROUND(quantity * base_price_vnd))`, bỏ qua phân bổ
lô và giảm giá cận hạn — trong khi checkout dùng `buildQuote` (giá sau giảm lô). Giỏ vừa đủ ngưỡng
trước giảm lô sẽ "đủ" trong ví nhưng "thiếu" ở checkout.

**Sửa.** `buildQuote(c, items, null, lock = false)`: cùng hàm, cùng phân bổ lô, cùng giảm giá,
chỉ tắt `FOR UPDATE OF i` để mở ví không khoá hàng và không giữ chỗ. Ví dùng `quote.subtotal_vnd`
để chấm `min_subtotal_vnd` và `discount_vnd`. Giỏ không định giá được (hết hàng, ngừng bán) →
ví hiện chương trình theo trạng thái riêng, không kết luận điều kiện.

### 12.5 Kiểm thử lần hai

| Lệnh / phạm vi | Kết quả |
|---|---|
| `pnpm -r typecheck` | PASS (5 workspace) |
| `pnpm test` (toàn bộ API) | **108/108** PASS — 17 case trong `test/14-vouchers.test.ts` (5 case mới) |
| `pnpm verify:local` | **10/10** PASS |
| `pnpm e2e:local` / `pnpm acceptance` | xem `VOUCHER_FINAL_REGRESSION.md` |
| Native emulator/thiết bị | **BLOCKED** — không có Android emulator/thiết bị trong môi trường này |
