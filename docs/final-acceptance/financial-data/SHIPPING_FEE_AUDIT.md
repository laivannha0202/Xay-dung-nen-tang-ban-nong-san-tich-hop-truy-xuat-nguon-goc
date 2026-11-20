# Shipping fee & delivery area audit (2026-11-19)

Policy is frozen and was not changed:

| Rule | Value |
|---|---|
| Delivery area | Hưng Yên only, 104 ward-level units (93 xã + 11 phường, province `33`) |
| Fee | 20.000₫/order |
| Free shipping | subtotal ≥ 500.000₫ |
| Handling | 24 working hours |

## Where the fee is computed

`apps/api/src/services/pricing.ts` — one place, on the server, for quote, cart estimate and order
creation:

```
ship = (subtotal − batch_discount) >= 500_000 ? 0 : 20_000
```

The voucher is applied **after** the ship fee is decided. That ordering is the contract: a voucher
must not be able to buy free shipping it did not earn. Test 13 asserts the relationship for every
order in the database, using `promotion_snapshot.discount_vnd` (the batch part) only.

## What was checked

| Check | Result |
|---|---|
| Every order's `ship_fee_vnd` matches the policy on its own subtotal | pass (`13-money-reconciliation`) |
| Quote under threshold charges 20.000₫ and reports `total = subtotal + 20.000₫` | pass (`07-service-area`) |
| Quote at/over threshold charges 0₫ | pass (`07-service-area`, 14 kg ST25) |
| Fee marked non-final while no address is chosen | pass (`07-service-area`) |
| Order refused when the chosen ward is switched off | pass (`07-service-area`) |
| Ward list returns exactly 104 units | pass (`11-ward-list`) |

## Change made by this audit

The free-shipping boundary test used to buy 5 kg of Gạo ST25. Once ST25 was priced at retail
(38.000₫/kg instead of the former 150.000₫), 5 kg no longer reaches 500.000₫, so the test was
updated to 14 kg (532.000₫) rather than by moving the threshold. **The policy threshold itself was
not touched.**

## Deliberate non-goals

- No external carrier integration (GHN/GHTK/Viettel Post) — the flat fee is the product decision.
- No distance-based or weight-based surcharge; the frozen policy does not include one.
- No multi-province shipping. `wards.in_service_area` is the single gate, and a ward outside Hưng Yên
  cannot be selected.
