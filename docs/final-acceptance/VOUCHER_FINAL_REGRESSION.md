# Voucher — regression cuối (lần sửa thứ hai)

Ngày: 2026-11-23 · Nhánh `feat/premium-visual-redesign-v5` · Base `34268e7` · Commit `81fdf6d`

## 1. Bốn lỗi và trạng thái

| # | Lỗi | Mức | Trạng thái | File |
|---|---|---|---|---|
| 1 | Giới hạn lượt dùng không nhất quán (tháng vs toàn chương trình) | HIGH | Đã sửa | `apps/api/src/services/promotions.ts` |
| 2 | `GET /promotions` ép `state: 'AVAILABLE'` | MEDIUM | Đã sửa | `apps/api/src/routes/public.ts`, `promotions.ts` |
| 3 | Mobile đặt hàng bằng báo giá cũ | HIGH | Đã sửa | `apps/customer-mobile/src/useFetch.ts`, `screens.tsx`; `apps/customer-web/components/checkout-flow.tsx` |
| 4 | Ví voucher tính điều kiện từ `base_price_vnd` | MEDIUM | Đã sửa | `apps/api/src/routes/customer.ts`, `apps/api/src/services/pricing.ts` |

Kèm theo: nhãn "lượt/tháng" → "tối đa N lượt cho cả chương trình" (thẻ voucher Web + Mobile) và
tách danh sách ưu đãi thành **Đang áp dụng / Chưa đủ điều kiện / Đã hết hiệu lực** ở
`offer-board.tsx`, `vouchers.tsx`, `voucher-picker.tsx` — nút "Dùng ngay" không còn xuất hiện
cho mã hết lượt.

## 2. Chính sách lượt sử dụng — chốt

- `promotions.usage_limit` = **tổng số lượt cho cả vòng đời chương trình**, không làm mới theo tháng.
- Bộ đếm duy nhất: `promotions.used_count`. Không còn `used_in_window`.
- Một lượt được ghi **chỉ khi đơn tạo thành công** (`consumePromotionUse` trong cùng transaction
  với đơn; thua cuộc → rollback toàn bộ).
- Đơn `CANCELLED` **không hoàn lượt** (chính sách hoàn lượt chưa được chốt). Hệ quả: bộ đếm không
  bao giờ giảm, nên không có chênh lệch giữa các phép đếm.
- `consumePromotionUse` kiểm tra thêm `status='ACTIVE'` + `now() BETWEEN start_at AND end_at`:
  chương trình bị tạm dừng sau lúc xem giá không tiêu lượt.

## 3. Test đã chạy

| Lệnh | Kết quả |
|---|---|
| `pnpm -r typecheck` | PASS — 5/5 workspace |
| `pnpm test` | **108/108** PASS (17/17 trong `test/14-vouchers.test.ts`) |
| `pnpm verify:local` | **10/10** PASS (env, postgres, test DB, typecheck, api tests, admin build, customer build, expo typecheck, expo export, secret scan) |
| `pnpm e2e:local` | **10/10** PASS |
| `node scripts/acceptance-walk.mjs` (`pnpm acceptance`) | **38/38** PASS |

### Case mới trong `apps/api/test/14-vouchers.test.ts`

| Case | Kỳ vọng | Kết quả |
|---|---|---|
| 99/100 lượt | board + preview `AVAILABLE`, giảm giá áp dụng | PASS |
| 100/100 lượt | board + preview `USED_UP`, không giảm, đặt đơn → `409 PROMOTION_EXPIRED`, `used_count` vẫn 100 | PASS |
| Sang tháng mới (mọi đơn `placed_at` ở tháng trước) | vẫn `USED_UP`, không tự reset | PASS |
| Board: hết lượt | hiện `USED_UP`, `discount_vnd = 0` | PASS |
| Board: hết hạn / chưa bắt đầu / tạm dừng | không có trong danh sách | PASS |
| Board khách chưa đăng nhập | trạng thái chương trình thật, `discount_vnd = 0`, tối thiểu chỉ in ra | PASS |
| Cùng chương trình trong preview của khách có giỏ nhỏ | `MIN_SUBTOTAL` — Web/Mobile cùng response | PASS |
| Ví: giỏ 84.000₫ có lô giảm 20% | `subtotal_vnd = 67.200₫`; min 75.000 → `MIN_SUBTOTAL` ở **cả ví và preview** | PASS |
| Ví: min 60.000 | `AVAILABLE`, `discount_vnd = 6.720₫` = 10% × 67.200, khớp `checkout/preview` | PASS |
| Mở ví | tồn kho khả dụng không đổi (không khoá, không giữ chỗ) | PASS |

Các case cũ vẫn giữ: tranh lượt cuối (1 × 201, 1 × 409), idempotency replay 1 lượt, tiền ship
(499.999 → 20.000; 500.000 → 0; 500.001 → 0), `max(0, subtotal − voucher) + ship`, chặn trên
voucher bằng subtotal.

## 4. Kiểm tra trên trình duyệt (dev server thật, dữ liệu thật)

| Việc | Kết quả |
|---|---|
| `/uu-dai` với RAUMAU2026 đặt `used_count = 100` | Chuyển sang nhóm **Đã hết hiệu lực**, "Mã đã hết lượt sử dụng", không còn nút dùng — đã khôi phục `used_count = 0` sau khi kiểm |
| `/uu-dai` nhóm header | "Đang áp dụng", "Chưa đủ điều kiện đơn hàng", "Đã hết hiệu lực" |
| Nhãn giới hạn lượt | "tối đa 100 lượt cho cả chương trình" |
| `/thanh-toan` (giỏ 315.000₫, đăng nhập khach1) | Ví: RAUMAU2026 "Dùng · −31.500₫", FREESHIP50 "Dùng · −50.000₫"; mục "Mã chưa đủ điều kiện" tách riêng |
| Không tràn ngang | Kiểm ở 1440/1280/768/390/360 — `scrollWidth === clientWidth` mọi trang đã chạm (ảnh `docs/screenshots/final/voucher-system/`) |

## 5. Chưa chạy — BLOCKED

- **Native emulator/thiết bị: BLOCKED.** Môi trường này không có Android emulator hay thiết bị
  thật. Đã chạy `expo typecheck` và `expo export` (PASS) — tức mã Native biên dịch được — nhưng
  **không** có bằng chứng UI Native nào, và không tạo ảnh giả.
- Logic chống race mới của Mobile (`useFetch.pending` + `resetQuote`) được chứng minh ở mức kiểu
  và ở đường code; chưa bấm trên màn hình thật. Không tuyên bố PASS cho Native.
- Race UI trên Web (`previewSeq`) cũng chưa dựng được kịch bản trễ mạng thật; đã kiểm luồng
  chọn voucher → tính lại → nút **Xác nhận đặt hàng** khoá/đổi nhãn khi `quoting`.

## 6. Giới hạn còn lại

- Hoàn lượt khi huỷ đơn: chưa có, cần chủ dự án chốt chính sách.
- Trang ưu đãi công khai không có giỏ hàng nên không hiển thị số tiền giảm cụ thể — đúng thiết kế:
  mức giảm được tính ở checkout.
