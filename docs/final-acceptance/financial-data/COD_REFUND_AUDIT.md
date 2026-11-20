# COD, payment and refund audit (2026-11-19)

Scope: every demo order (16) and every payment (28) in the seeded database, plus the code paths that
write them. Query helper used during the audit: read-only SQL against `agrimarket`.

## Current state — reconciled

| Check | Result |
|---|---|
| Orders whose `total ≠ subtotal − discount + ship` | 0 |
| PAID orders without a matching payment row | 0 |
| Refunds exceeding collected amount | 0 (one request: AGM-2026-0106, 55.000₫ requested against 55.000₫ collected) |
| Orders whose ship fee contradicts the 20.000₫/0₫ policy | 0 |
| Batches whose `reserved_qty` disagrees with open allocations | 0 |

Aggregate of demo orders: 16 orders, subtotal 1.196.000₫, discount 0₫, ship 120.000₫, total
1.316.000₫. All payments are method `COD` — VNPay/VNPAY-style online capture is not
integrated, so no gateway reconciliation exists to audit.

## Defects fixed

### 1. COD offered to collect an already-collected balance
`apps/admin-web/app/admin/don-hang/[id]/page.tsx` derived the cash-on-delivery figure from
`payment_status` alone. An order with a partial payment showed the **full** total as collectable, and
a cancelled order still showed a collection instruction. Now:

```ts
const collectable = o.payment_method === 'COD' && !['CANCELLED', 'DELIVERY_FAILED'].includes(o.status)
const paidVnd = o.payment?.status === 'PAID' ? Number(o.payment.amount_vnd) : 0
const cod = collectable ? Math.max(0, o.total_vnd - paidVnd) : 0
```

The API now exposes `payment.amount_vnd` on the admin order detail for exactly this computation.

### 2. PAID order without a receipt
`AGM-DEMO-MONGTOI` (13.000₫) was inserted by `seed-demo-v71.ts` with `payment_status='PAID'` and no
`payments` row, because the review seeder writes orders directly instead of going through checkout.
The seeder now backfills a receipt for every `AGM-DEMO-%` PAID order that lacks one, and
`13-money-reconciliation.test.ts` fails the build if a PAID order ever has none again.

### 3. Refund cap
`maxRefund = total_vnd − refundedOrPending`, where pending/approved/completed requests count against
the cap. Verified against the single live refund request: cap 55.000₫, request 55.000₫ — a second
request for the same order is refused. Over-refund is impossible because the cap never uses
`payments.amount_vnd` (which could exceed `total` only through a data-entry error) as a floor.

## Refund policy as implemented

- A customer opens a request (`refund_requests`, status `PENDING`) from the order page.
- Admin approves → `APPROVED`; completing it writes the refund and marks `COMPLETED`.
- Cancellation of a PAID order is the COD case: cash was collected on delivery, so the refund has to
  be paid back out; the order page surfaces the cap so the operator cannot type a larger number.

## Known limitations (documented, not fixed)

- **No online payment gateway.** Every payment is `COD`; a `VNPAY`/`MOMO` integration would need a
  new `method` value and a signed callback route. Out of scope for this audit.
- **Refunds are manual.** No bank-transfer reconciliation file is produced.
- **`payments` has no partial-payment UI.** The schema supports several rows per order and the COD
  math now handles them, but the admin form records one payment at a time.
