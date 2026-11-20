/**
 * Single source of truth for the "sellable batch" invariant (Admin V3.0 §15.1,
 * Customer V1.0 §15.1). Every read path — catalog availability, checkout,
 * shipping, reports — uses these fragments so they cannot drift.
 */
export const TODAY = `(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`

/**
 * Current business date (Asia/Ho_Chi_Minh) as `YYYY-MM-DD`. Report default ranges
 * must use this, not UTC, or a payment made after 07:00 ICT falls outside `to`.
 */
export function todayVN(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
}

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

/**
 * Units sold by weight/volume are the only ones allowed a fractional quantity. A "bó", "gói",
 * "hộp", "chai", "quả" or "nải" is a countable pack: 1,25 bó is not an order we can pick.
 */
const MEASURED_UNITS: Record<string, true> = {
  kg: true, g: true, gram: true, 'lít': true, lit: true, ml: true,
}

export function quantityAllowed(unit: string, quantity: number): boolean {
  if (!(quantity > 0) || quantity > 100000) return false
  if (MEASURED_UNITS[unit.trim().toLowerCase()]) return true
  return Math.abs(quantity - Math.round(quantity)) < 1e-9
}
