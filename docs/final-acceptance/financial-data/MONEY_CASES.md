# Ten money cases, end to end

Each row is a shape the shop actually meets. "Expected" is the pricing contract
(`apps/api/src/services/pricing.ts`): per-allocation price → per-batch discount → subtotal
(batch discount only) → voucher → ship fee on **subtotal after batch discount, before voucher** →
total. "Verified by" names the check that would fail if the row drifted.

| # | Case | Numbers | Expected | Verified by |
|---|---|---|---|---|
| 1 | Plain order, under threshold | 2 kg cà chua × 42.000₫ = 84.000₫; ship 20.000₫ | total 104.000₫, ship charged | `07-service-area` "quotes 20.000₫ under 500.000₫" |
| 2 | Free ship exactly at 500.000₫ | subtotal 500.000₫ | ship 0₫ | `07-service-area` threshold case |
| 3 | Batch promotion 20% on cà chua | 5 kg × 42.000₫ = 210.000₫, −42.000₫ lô | subtotal 210.000₫, discount 42.000₫ | `03-lifecycle` 50% batch promo case |
| 4 | Batch promo pushes subtotal under threshold | 5 kg × 42.000₫ − 42.000₫ = 168.000₫ | ship 20.000₫ charged on 168.000₫ | `13-money-reconciliation` "delivery fee follows the Hưng Yên policy" |
| 5 | Voucher HUNGYEN10, 10%, min 200.000₫ | subtotal 210.000₫ − 42.000₫ lô = 168.000₫; voucher 16.800₫ | ship computed on 168.000₫, **not** on 151.200₫ | `13-money-reconciliation` (ship ignores voucher) |
| 6 | Voucher below its minimum | subtotal 150.000₫, HUNGYEN10 | voucher rejected, discount 0 | `03-lifecycle` voucher minimum test |
| 7 | COD delivered | total 90.000₫, one payment PAID 90.000₫ | admin COD "cần thu" = 0₫ | `13-money-reconciliation` "every PAID order has exactly the receipt it claims" |
| 8 | COD unpaid, still shipping | total 75.000₫, no payment | COD "cần thu" = 75.000₫ | admin `don-hang/[id]` `collectable` branch (pays only when not CANCELLED/DELIVERY_FAILED) |
| 9 | Refund full, COD | total 55.000₫, refund PENDING 55.000₫ | refund cap 55.000₫, cannot exceed collected | `13-money-reconciliation` "no refund exceeds the amount actually collected" |
| 10 | Cancel after reserve, before ship | 5 kg reserved, then cancel | `on_hand` unchanged, `reserved` back to 0 | `02-allocation` "#8 cancelling a reserved order frees reserved" |

## Findings that changed behaviour

1. **COD double collection.** The admin order page read `payment_status='PAID'` as "nothing to
   collect", but it also showed the full order total as cash-on-delivery when a *partial* payment
   existed. It now computes `total_vnd − payment.amount_vnd`, clamped at 0, and skips cancelled or
   failed-delivery orders.
2. **One discount bucket, two reasons.** `orders.discount_vnd` holds batch markdown **and** voucher
   in one number, so the order page printed "Giảm giá" with no attribution. `discountSplit()` reads
   `promotion_snapshot.discount_vnd` (the voucher part) and splits it back out for admin, storefront
   and print documents.
3. **PAID order with no receipt.** Demo review orders were inserted with `payment_status='PAID'` and
   no `payments` row, which made the COD block offer to collect money already marked collected. The
   v7.1 seeder now backfills the receipt; test 13 fails if a PAID order has none.
4. **Fractional packs.** `quantity = 1,5 gói` was accepted and rounded somewhere downstream. The
   server now rejects a fractional quantity for any pack unit (`bó, gói, hộp, chai, quả, nải`) at
   quote time and on cart update; steppers step by `qtyStep(unit)`.
5. **Print documents.** Phiếu bán / giao / đóng gói / thanh toán now carry the same split
   (Tiền hàng giá gốc → Giảm giá theo lô → Voucher → Phí giao → Tổng) so a printed bill and the
   screen can never disagree.

## Inventory

- `inventory.reserved_qty` per batch equals the sum of open (`ACTIVE`, `shipped_qty = 0`)
  allocations — asserted in test 13.
- `order_line_allocations.reserved_qty` is the historical reservation size and is intentionally kept
  when the line ships (the ship handler decrements `inventory`, not the allocation), so it must not
  be read as "still held".
- Shipping moves `on_hand` down by the reservation and `reserved` down by the same amount in one
  transaction, then writes an `OUT` movement and a `STOCK_OUT` batch event.
