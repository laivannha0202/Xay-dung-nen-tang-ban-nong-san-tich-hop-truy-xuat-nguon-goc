/**
 * Single source of truth for the "sellable batch" invariant (Admin V3.0 §15.1,
 * Customer V1.0 §15.1). Every read path — catalog availability, checkout,
 * shipping, reports — uses these fragments so they cannot drift.
 */
export const TODAY = `(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`

/** Requires aliases: b = batches, p = products, i = inventory. */
export const SELLABLE_SQL = `
  b.quality_status = 'PASS'
  AND b.publication_status = 'PUBLISHED'
  AND b.safety_status = 'NORMAL'
  AND b.expiry_date >= ${TODAY}
  AND p.status = 'ACTIVE'
  AND (i.on_hand_qty - i.reserved_qty) > 0
`

/** Shipment needs a valid batch; reserved stock is already counted in on_hand. */
export const SHIPPABLE_SQL = `
  b.quality_status = 'PASS'
  AND b.publication_status = 'PUBLISHED'
  AND b.safety_status = 'NORMAL'
  AND b.expiry_date >= ${TODAY}
`

/** VND is integer-only on the wire and in the DB. */
export function roundVnd(n: number): number {
  return Math.round(n)
}

/** Quantities are numeric(12,3): 3 decimal places, kg/bó/hộp. */
export function roundQty(n: number): number {
  return Math.round(n * 1000) / 1000
}
