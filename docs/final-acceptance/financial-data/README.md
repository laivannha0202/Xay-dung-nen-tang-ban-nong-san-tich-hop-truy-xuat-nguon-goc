# Final acceptance — financial & product data

Five audits, one database snapshot (seeded demo plus the two orders that were created through the
real checkout), all fixes applied and covered by tests.

| Document | Question it answers |
|---|---|
| [`MONEY_CASES.md`](./MONEY_CASES.md) | Does every order add up, and does each of the ten money shapes produce the expected total? |
| [`COD_REFUND_AUDIT.md`](./COD_REFUND_AUDIT.md) | Does COD collect the right amount, and can a refund exceed what was collected? |
| [`PRODUCT_PRICE_RESEARCH.md`](./PRODUCT_PRICE_RESEARCH.md) | Are the demo prices defensible against real retail shelves? |
| [`PRODUCT_AND_TRACE_DATA.md`](./PRODUCT_AND_TRACE_DATA.md) | Does each lot's passport name the province the product really comes from? |
| [`SHIPPING_FEE_AUDIT.md`](./SHIPPING_FEE_AUDIT.md) | Is the Hưng Yên shipping policy applied in exactly one place, on the right subtotal? |

## Files changed

Code

- `apps/api/src/services/invariants.ts` — `quantityAllowed()`: fractions only for kg/g/lít/ml.
- `apps/api/src/services/pricing.ts` — rejects a fractional pack quantity at quote time.
- `apps/api/src/routes/customer.ts` — same rule on cart update.
- `packages/core/src/format.ts` — `discountSplit()`, `qtyStep()`.
- `apps/admin-web/app/admin/don-hang/[id]/page.tsx` — COD = total − collected, split discount lines.
- `apps/admin-web/app/admin/in/[kind]/[id]/page.tsx` — split discount on the four print documents.
- `apps/customer-web/app/tai-khoan/don-hang/[id]/page.tsx` — split discount on the customer bill.
- `apps/customer-web/components/forms.tsx`, `cart-view.tsx`, `apps/customer-mobile/src/screens.tsx` —
  steppers step by unit.
- `apps/api/src/scripts/seed.ts`, `seed-demo-v71.ts`, `seed-demo-catalog.ts`, `demo-farms.ts` —
  prices, units, origin farms, review-order receipts.

Data

- `apps/api/migrations/013_product_data_normalization.sql` — idempotent price/unit/slug/origin fixes.

Tests

- `apps/api/test/13-money-reconciliation.test.ts` — new: order arithmetic, receipts, refund cap,
  ship-fee policy, reservation invariant.
- `apps/api/test/12-audit-fixes.test.ts` — quantity unit rules.
- `apps/api/test/07-service-area.test.ts` — free-ship boundary quantity.

## Verification

```
pnpm -r typecheck                              pass
apps/api: pnpm test                            pass (15 files, 77 tests)
apps/api: pnpm exec vitest run test/13-…       pass (5 tests)
```

## Deliberately out of scope

- No online payment gateway (all payments are COD).
- No carrier integration; the flat 20.000₫ fee is the frozen policy.
- No history rewrite: no `order_lines` price, `payments` amount or `orders` total was retro-edited.
- No new certificates, lab results or import documents were fabricated; demo rows stay `is_demo`.
