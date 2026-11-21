# Kiểm thử hồi quy tài chính — COD, phí giao, đối soát

Nhánh `feat/premium-visual-redesign-v5`, mốc `c353674`. Mọi dòng dưới đây là lệnh đã chạy trong
phiên này.

## 1. Lỗi tài chính tìm được và cách sửa

| # | Lỗi | Biểu hiện | Sửa |
|---|---|---|---|
| F1 | Ba nơi tự tính "còn thu khi giao" theo ba công thức khác nhau | Phiếu giao hàng, chi tiết đơn admin, chi tiết đơn khách có thể lệch nhau; đơn đã huỷ vẫn in số tiền phải thu | Một hàm `codDue()` trong `packages/core/src/format.ts`, dùng chung cả ba chỗ |
| F2 | COD không trừ tiền đã thu | Đơn thu một phần vẫn in đủ tổng; tài xế thu hai lần | `codDue` = `total − paid`, sàn 0 |
| F3 | Đơn `CANCELLED` / `DELIVERY_FAILED` vẫn tính COD | In phiếu đòi tiền hàng không giao | `codDue` trả 0 cho hai trạng thái này |
| F4 | Chi tiết đơn khách lấy **một** dòng `payments` bất kỳ (`ORDER BY created_at DESC LIMIT 1`) | Đơn có dòng UNPAID cũ + dòng PAID mới sẽ hiện sai "chưa thanh toán" | `loadOrder()` gộp `SUM(amount_vnd) FILTER (WHERE status='PAID')` + `BOOL_OR(status='PAID')` |
| F5 | Chi tiết đơn khách không có dòng "còn phải trả" | Khách không biết còn nợ bao nhiêu | Thêm dòng "Đã thanh toán" / "Còn trả khi nhận hàng" (COD) hoặc "Còn phải thanh toán" (chuyển khoản) |
| F6 | Trang chi tiết đơn admin chỉ hiện "Còn thu khi giao" khi **đã thu một phần** | Đơn COD chưa thu đồng nào không hiện số tiền tài xế phải thu | Hiện khi `cod > 0`, bất kể đã thu hay chưa |

Đã xác nhận **sửa từ trước** ở `c353674` (không làm lại): gộp thanh toán ở `/admin/orders/:id`,
ngưỡng miễn phí giao hàng tính trên `subtotal − discount + voucher`, dọn liên hệ nông trại demo.

## 2. Quy tắc tiền tệ sau khi sửa

```
shipFee   = subtotal_sau_giảm_lô >= 500.000 ? 0 : 20.000     // pricing.ts: shipFeeFor()
total     = max(0, subtotal − promotionDiscount) + shipFee    // voucher KHÔNG làm mất freeship
paid_vnd  = SUM(payments.amount_vnd WHERE status='PAID')
codDue    = 0 nếu không phải COD, hoặc đơn CANCELLED/DELIVERY_FAILED
          = max(0, total − paid_vnd)   ngược lại
```

`shipFeeFor` và `codDue` là nguồn duy nhất; UI không tự làm phép trừ nữa.

## 3. Kiểm thử đã chạy

`cd apps/api && npx vitest run test/13-money-reconciliation.test.ts` → **15/15 PASS** (1,1s).

| Nhóm | Test | Nội dung |
|---|---|---|
| Đối soát đơn | every order total equals subtotal − discount + ship fee | Mọi đơn trong DB thoả công thức |
| | every PAID order has exactly the receipt it claims | Không có đơn PAID thiếu chứng từ |
| | no refund exceeds the amount actually collected | Hoàn ≤ đã thu |
| | delivery fee follows the Hưng Yên policy on subtotal after batches, before the voucher | 20.000₫ / 0₫ đúng chính sách |
| | a 50.000₫ voucher on a 500.000₫ order keeps free shipping | Voucher không đẩy đơn xuống dưới ngưỡng |
| | admin order detail reports every paid receipt, not one arbitrary row | Gộp mọi dòng PAID |
| Ngưỡng freeship | charges 20.000₫ at 499.999₫ and 0₫ from exactly 500.000₫ | Biên chính xác 499.999 / 500.000 / 500.001 qua `shipFeeFor()` thật |
| | a voucher never re-adds the fee | 500.000₫ + voucher 50.000₫ → phí 0, tổng 450.000₫ |
| | batch markdown can drop goods under the threshold | 550.000₫ − 100.000₫ lô = 450.000₫ → phí 20.000₫ |
| COD | unpaid order owes the full total | 120.000₫ chưa thu → còn 120.000₫ |
| | fully paid order owes nothing | `is_paid=true`, còn 0 |
| | part payment leaves only the remainder | thu 50.000/120.000 → còn 70.000 |
| | a cancelled order and a failed delivery are not collected at all | `codDue` = 0 cho `CANCELLED` và `DELIVERY_FAILED` |
| | COD due is never negative | thu vượt tổng → 0, không âm |
| Kho | reserved quantity per batch equals its open allocations | Tồn kho giữ chỗ khớp phân bổ |

Toàn bộ test API: `pnpm test` → **16 tệp, 90 test PASS** (33s).

## 4. Kiểm chứng bằng giao diện

| Màn hình | Đơn | Hiển thị |
|---|---|---|
| `/tai-khoan/don-hang/<id>` (COD, chưa thu) | AGM-2026-0154, tổng 56.000₫ | "Còn trả khi nhận hàng 56.000₫" |
| `/tai-khoan/don-hang/<id>` (COD, thu đủ) | AGM-DEMO-MONGTOI, tổng 13.000₫ | "Đã thanh toán 13.000₫", không có dòng còn nợ |

## 5. Các bước kiểm tra toàn hệ thống

| Lệnh | Kết quả |
|---|---|
| `pnpm -r typecheck` | 6 gói PASS |
| `pnpm test` | 90/90 PASS |
| `pnpm verify:local` | **10/10 PASS** — env, postgres, test DB (13 migration), typecheck, api tests, admin build, customer build, expo typecheck, expo export, secret scan (1122 tệp) |
| `pnpm e2e:local` | **10/10 PASS** — trang chủ, đăng nhập khách, giỏ hàng, địa chỉ, đặt đơn, xác nhận đơn, chặn checkout sai quyền, đăng nhập admin, console vùng giao (104 xã/phường), biểu đồ dashboard |
| `pnpm acceptance` | **38/38 PASS** — vòng đời đầy đủ: nhà cung cấp → nông trại → mùa vụ → nhật ký canh tác → chặn thu hoạch trong thời gian cách ly → lô → chặn phát hành thiếu kiểm nghiệm → kiểm nghiệm PASS → phát hành + cấp QR → tra cứu công khai → nhập kho → đặt đơn → idempotency → giữ chỗ → giao hàng → recall → ẩn lô khỏi bán |

## 6. Dữ liệu demo (đã kiểm tra trong DB, không sửa thêm)

- 35 nông trại, 15 `is_demo=true`.
- `Ruộng lúa Sóc Trăng`, `Rừng tràm U Minh Hạ`: `manager_name`/`manager_phone` rỗng.
- `Vườn cam Khoái Châu` (`is_demo=true`) vẫn giữ `Đỗ Văn Hợp` / `0912555777`. Đây **trùng khớp**
  liên hệ nhà cung cấp thật `NCC-HY-001` (HTX Rau an toàn Hưng Yên) trong `seed-demo-catalog.ts:93`
  và `seed-demo-v71.ts:185`, nên không xoá: xoá đi sẽ mất liên hệ có thật. Trang tra cứu công khai
  đã ẩn số điện thoại quản lý (bước "trace hides manager phone" PASS ở `pnpm acceptance`).
- 40 đơn trong DB, không có đơn nào nhiều dòng PAID (unique index `payments_order_paid` chặn).

## 7. Giới hạn

- Không có cổng thanh toán mới, không tích hợp vận chuyển mới — ngoài phạm vi yêu cầu.
- Chưa thử đồng thời hai admin bấm "xác nhận thanh toán" đúng cùng mili-giây trên hai máy; đường
  ghi đã khoá `FOR UPDATE` + no-op khi đã PAID, nhưng đây là suy luận từ mã, không phải phép thử.
- `verify:local` chạy `next build` vào cùng thư mục `.next` với dev server, nên dev server phải
  khởi động lại sau đó. Không phải lỗi sản phẩm.
