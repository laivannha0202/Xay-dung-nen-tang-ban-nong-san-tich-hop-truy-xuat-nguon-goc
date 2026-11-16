import { createHash } from 'node:crypto'
import { z } from 'zod'
import { q, tx, txq, type Tx } from '../db.js'
import { AppError, errors } from '../lib/errors.js'
import { SELLABLE_SQL, roundQty, roundVnd } from './invariants.js'

export interface ItemInput {
  product_id: string
  quantity: number
}

export interface PlannedAllocation {
  warehouse_id: string
  batch_id: string
  batch_code: string
  expiry_date: string
  qty: number
  unit_price_vnd: number
  discount_vnd: number
  discount_percent: number
}

export interface PlannedLine {
  product_id: string
  sku: string
  product_name: string
  unit: string
  quantity: number
  unit_price_vnd: number
  total_vnd: number
  allocations: PlannedAllocation[]
}

export interface Quote {
  lines: PlannedLine[]
  subtotal_vnd: number
  promotion_discount_vnd: number
  ship_fee_vnd: number
  total_vnd: number
  promotion: { id: string; code: string; name: string } | null
  version: string
}

const FREE_SHIP_THRESHOLD = 500_000
const BASE_SHIP_FEE = 20_000

export function shipFeeFor(subtotal: number): number {
  return subtotal >= FREE_SHIP_THRESHOLD ? 0 : BASE_SHIP_FEE
}

export async function allocationStrategy(c: Tx | null): Promise<'FIFO' | 'FEFO'> {
  const row = c
    ? await txq<{ value: string }>(c, `SELECT value FROM settings WHERE key='allocation_strategy'`)
    : await q<{ value: string }>(`SELECT value FROM settings WHERE key='allocation_strategy'`)
  return row[0]?.value === 'FEFO' ? 'FEFO' : 'FIFO'
}

interface StockRow {
  warehouse_id: string
  batch_id: string
  batch_code: string
  expiry_date: string
  available: number
  discount_percent: number
}

/**
 * Plans batch allocation for one product. P1 = FIFO by earliest stock receipt
 * (code as tie-break); P2 = FEFO by expiry. Always filters sellable batches first.
 * With `lock`, rows are locked for update inside the caller's transaction.
 */
async function planProduct(
  c: Tx,
  productId: string,
  quantity: number,
  strategy: 'FIFO' | 'FEFO',
): Promise<StockRow[]> {
  const order = strategy === 'FEFO'
    ? 'b.expiry_date ASC, b.code ASC'
    : 'i.received_at ASC NULLS LAST, b.code ASC'
  const rows = await txq<StockRow>(
    c,
    `SELECT i.warehouse_id, i.batch_id, b.code AS batch_code, b.expiry_date,
            (i.on_hand_qty - i.reserved_qty) AS available,
            COALESCE(bp.discount_percent, 0) AS discount_percent
       FROM inventory i
       JOIN batches b ON b.id = i.batch_id
       JOIN products p ON p.id = b.product_id
       LEFT JOIN batch_promotions bp
              ON bp.batch_id = b.id AND bp.status = 'ACTIVE'
             AND now() BETWEEN bp.starts_at AND bp.ends_at
      WHERE b.product_id = $1 AND ${SELLABLE_SQL}
      ORDER BY ${order}
      FOR UPDATE OF i`,
    [productId],
  )
  const needed = roundQty(quantity)
  const total = rows.reduce((s, r) => s + r.available, 0)
  if (total < needed) return []
  return rows
}

export interface PricedItem {
  product_id: string
  quantity: number
}

/**
 * Builds a quote: server-side price, per-batch allocation plan and totals.
 * No inventory is reserved here; this is safe to call for preview.
 */
export async function buildQuote(
  c: Tx,
  items: PricedItem[],
  promotionCode: string | null,
): Promise<Quote> {
  const strategy = await allocationStrategy(c)
  const lines: PlannedLine[] = []
  const shortages: { product_name: string; requested: number; available: number }[] = []

  for (const item of items) {
    const product = await txq<{
      id: string; sku: string; name: string; unit: string; base_price_vnd: number; status: string
    }>(c, `SELECT id, sku, name, unit, base_price_vnd, status FROM products WHERE id = $1`, [
      item.product_id,
    ])
    const p = product[0]
    if (!p) throw errors.invalid('Sản phẩm không tồn tại trong giỏ hàng.')
    if (p.status !== 'ACTIVE') {
      throw errors.conflict('PRODUCT_UNAVAILABLE', `Sản phẩm "${p.name}" đã ngừng kinh doanh.`)
    }

    const stock = await planProduct(c, p.id, item.quantity, strategy)
    if (stock.length === 0) {
      const avail = await txq<{ available: number }>(
        c,
        `SELECT COALESCE(SUM(i.on_hand_qty - i.reserved_qty),0) AS available
           FROM inventory i JOIN batches b ON b.id = i.batch_id JOIN products p ON p.id = b.product_id
          WHERE b.product_id = $1 AND ${SELLABLE_SQL}`,
        [p.id],
      )
      shortages.push({
        product_name: p.name,
        requested: item.quantity,
        available: Math.max(0, avail[0]?.available ?? 0),
      })
      continue
    }

    let remaining = roundQty(item.quantity)
    const allocations: PlannedAllocation[] = []
    for (const s of stock) {
      if (remaining <= 0) break
      const take = Math.min(remaining, s.available)
      if (take <= 0) continue
      const gross = roundVnd(take * p.base_price_vnd)
      const net = roundVnd((gross * (100 - s.discount_percent)) / 100)
      allocations.push({
        warehouse_id: s.warehouse_id,
        batch_id: s.batch_id,
        batch_code: s.batch_code,
        expiry_date: s.expiry_date,
        qty: take,
        unit_price_vnd: p.base_price_vnd,
        discount_vnd: gross - net,
        discount_percent: s.discount_percent,
      })
      remaining = roundQty(remaining - take)
    }
    if (remaining > 0) {
      shortages.push({ product_name: p.name, requested: item.quantity, available: item.quantity - remaining })
      continue
    }

    lines.push({
      product_id: p.id,
      sku: p.sku,
      product_name: p.name,
      unit: p.unit,
      quantity: roundQty(item.quantity),
      unit_price_vnd: p.base_price_vnd,
      total_vnd: allocations.reduce((s, a) => s + (roundVnd(a.qty * a.unit_price_vnd) - a.discount_vnd), 0),
      allocations,
    })
  }

  if (shortages.length > 0) throw errors.outOfStock(shortages)

  const subtotal = lines.reduce((s, l) => s + l.total_vnd, 0)

  let promotionDiscount = 0
  let promotion: Quote['promotion'] = null
  if (promotionCode) {
    const promo = await txq<{
      id: string; code: string; name: string; type: 'PERCENT' | 'AMOUNT'; value: number
      usage_limit: number | null; used_count: number; min_subtotal_vnd: number
    }>(
      c,
      `SELECT id, code, name, type, value, usage_limit, used_count, min_subtotal_vnd
         FROM promotions
        WHERE upper(code) = upper($1) AND status = 'ACTIVE'
          AND now() BETWEEN start_at AND end_at`,
      [promotionCode],
    )
    const pr = promo[0]
    if (!pr) throw errors.conflict('PROMOTION_EXPIRED', 'Mã khuyến mãi không còn hiệu lực.')
    if (pr.usage_limit !== null && pr.used_count >= pr.usage_limit) {
      throw errors.conflict('PROMOTION_EXPIRED', 'Mã khuyến mãi đã hết lượt sử dụng.')
    }
    if (subtotal < pr.min_subtotal_vnd) {
      throw errors.conflict(
        'PROMOTION_EXPIRED',
        `Đơn hàng tối thiểu ${pr.min_subtotal_vnd.toLocaleString('vi-VN')}₫ để dùng mã này.`,
      )
    }
    promotionDiscount = pr.type === 'PERCENT'
      ? roundVnd((subtotal * pr.value) / 100)
      : Math.min(pr.value, subtotal)
    promotion = { id: pr.id, code: pr.code, name: pr.name }
  }

  const shipFee = shipFeeFor(subtotal)
  const total = Math.max(0, subtotal - promotionDiscount) + shipFee
  const version = quoteVersion({ subtotal, promotionDiscount, shipFee, total })

  return {
    lines,
    subtotal_vnd: subtotal,
    promotion_discount_vnd: promotionDiscount,
    ship_fee_vnd: shipFee,
    total_vnd: total,
    promotion,
    version,
  }
}

export function quoteVersion(t: {
  subtotal: number
  promotionDiscount: number
  shipFee: number
  total: number
}): string {
  return createHash('sha256')
    .update(`${t.subtotal}|${t.promotionDiscount}|${t.shipFee}|${t.total}`)
    .digest('hex')
    .slice(0, 32)
}

export const orderItemsSchema = z.object({
  items: z
    .array(z.object({ product_id: z.string().uuid(), quantity: z.number().positive().max(100000) }))
    .min(1, 'Giỏ hàng trống')
    .max(50),
  promotion_code: z.string().trim().max(64).nullish(),
})

export async function nextOrderCode(c: Tx): Promise<string> {
  const row = await txq<{ n: number }>(
    c,
    `SELECT COUNT(*)::int + 1 AS n FROM orders WHERE placed_at >= date_trunc('year', now())`,
  )
  const seq = String(row[0]?.n ?? 1).padStart(4, '0')
  return `AGM-${new Date().getFullYear()}-${seq}`
}

export async function allocateAndReserve(
  c: Tx,
  orderId: string,
  quote: Quote,
): Promise<void> {
  for (const line of quote.lines) {
    const lineRow = await txq<{ id: string }>(
      c,
      `INSERT INTO order_lines (order_id, product_id, product_name, sku, unit, unit_price_vnd, quantity, total_vnd)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [orderId, line.product_id, line.product_name, line.sku, line.unit, line.unit_price_vnd, line.quantity, line.total_vnd],
    )
    const lineId = lineRow[0]!.id
    for (const a of line.allocations) {
      // Conditional update is the real guard against overselling (DB-level, not app-level).
      const upd = await txq(
        c,
        `UPDATE inventory
            SET reserved_qty = reserved_qty + $3, updated_at = now()
          WHERE warehouse_id = $1 AND batch_id = $2 AND on_hand_qty - reserved_qty >= $3
          RETURNING on_hand_qty, reserved_qty`,
        [a.warehouse_id, a.batch_id, a.qty],
      )
      if (upd.length === 0) {
        throw errors.outOfStock([{ product_name: line.product_name, requested: line.quantity, available: 0 }])
      }
      await txq(
        c,
        `INSERT INTO order_line_allocations
           (order_line_id, warehouse_id, batch_id, reserved_qty, shipped_qty, unit_price_vnd, discount_vnd, status)
         VALUES ($1,$2,$3,$4,0,$5,$6,'ACTIVE')`,
        [lineId, a.warehouse_id, a.batch_id, a.qty, a.unit_price_vnd, a.discount_vnd],
      )
    }
  }
}

export async function releaseAllocations(c: Tx, orderId: string, newStatus: 'RELEASED' | 'NEEDS_REALLOCATION' | 'CANCELLED') {
  const allocs = await txq<{ id: string; warehouse_id: string; batch_id: string; reserved_qty: number }>(
    c,
    `SELECT a.id, a.warehouse_id, a.batch_id, a.reserved_qty
       FROM order_line_allocations a JOIN order_lines l ON l.id = a.order_line_id
      WHERE l.order_id = $1 AND a.status = 'ACTIVE' AND a.shipped_qty = 0 AND a.reserved_qty > 0
      FOR UPDATE OF a`,
    [orderId],
  )
  for (const a of allocs) {
    await txq(
      c,
      `UPDATE inventory SET reserved_qty = reserved_qty - $3, updated_at = now()
        WHERE warehouse_id = $1 AND batch_id = $2`,
      [a.warehouse_id, a.batch_id, a.reserved_qty],
    )
    await txq(c, `UPDATE order_line_allocations SET status = $2 WHERE id = $1`, [a.id, newStatus])
  }
  return allocs.length
}

export async function audit(
  c: Tx | null,
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  reason = '',
  before: unknown = null,
  after: unknown = null,
) {
  const sql = `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before, after, reason)
               VALUES ($1,$2,$3,$4,$5,$6,$7)`
  const params = [actorId, action, entityType, entityId,
    before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, reason]
  if (c) await txq(c, sql, params)
  else await q(sql, params)
}

export async function batchEvent(
  c: Tx,
  batchId: string,
  type: string,
  title: string,
  description = '',
  actorId: string | null = null,
  meta: Record<string, unknown> = {},
) {
  await txq(
    c,
    `INSERT INTO batch_events (batch_id, type, title, description, actor_id, meta)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [batchId, type, title, description, actorId, JSON.stringify(meta)],
  )
}

export { tx, q, txq }
export type { Tx }
