import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { batchIdByCode, bootstrap, productIdBySlug, setStock, warehouseId, type Ctx } from './helpers.js'
import { q } from '../src/db.js'

/** Regression gates for money/stock defects found in the 2026-11-17 logic audit. */
let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

async function addressId(n: number) {
  const rows = await q<{ id: string }>(
    `SELECT a.id FROM addresses a JOIN users u ON u.id=a.user_id WHERE u.email=$1 LIMIT 1`,
    [`khach${n}@example.com`],
  )
  return rows[0]!.id
}

async function placeOrder(n: number, productId: string, qty: number, key: string): Promise<string> {
  const h = await ctx.customer(n)
  const preview = await ctx.app.inject({
    method: 'POST', url: '/api/v1/checkout/preview', headers: h,
    payload: { items: [{ product_id: productId, quantity: qty }] },
  })
  expect(preview.statusCode).toBe(200)
  const res = await ctx.app.inject({
    method: 'POST', url: '/api/v1/orders', headers: { ...h, 'idempotency-key': key },
    payload: {
      address_id: await addressId(n), payment_method: 'COD',
      quote_version: preview.json().version, items: [{ product_id: productId, quantity: qty }],
    },
  })
  expect(res.statusCode).toBe(201)
  return res.json().order_id as string
}

async function firstAllocation(orderId: string) {
  const rows = await q<{ id: string; warehouse_id: string; batch_id: string; reserved_qty: number }>(
    `SELECT a.id, a.warehouse_id, a.batch_id, a.reserved_qty
       FROM order_line_allocations a JOIN order_lines l ON l.id=a.order_line_id
      WHERE l.order_id=$1 AND a.status='ACTIVE'`,
    [orderId],
  )
  return rows[0]!
}

beforeEach(async () => {
  await setStock(await batchIdByCode('LO-2026-0001'), 100)
  await setStock(await batchIdByCode('LO-2026-0002'), 100)
})

describe('ADM-08-03 reallocation cannot oversell', () => {
  it('rejects a quantity larger than the reservation', async () => {
    const p = await productIdBySlug('ca-chua-bien')
    const orderId = await placeOrder(2, p, 2, 'gate-realloc-qty-1')
    const alloc = await firstAllocation(orderId)
    const res = await ctx.app.inject({
      method: 'POST', url: `/api/v1/admin/orders/${orderId}/reallocate`, headers: await ctx.admin(),
      payload: { allocation_id: alloc.id, batch_id: await batchIdByCode('LO-2026-0002'), quantity: 50, reason: 'Thử vượt giữ chỗ' },
    })
    expect(res.statusCode).toBe(422)
    const inv = await q<{ reserved_qty: number }>(
      `SELECT reserved_qty FROM inventory WHERE batch_id=$1`, [alloc.batch_id],
    )
    expect(inv[0]!.reserved_qty).toBe(2)
  })

  it('moves the reservation to the new warehouse row of the target batch', async () => {
    const p = await productIdBySlug('ca-chua-bien')
    const orderId = await placeOrder(2, p, 2, 'gate-realloc-move-1')
    const alloc = await firstAllocation(orderId)
    const targetBatch = await batchIdByCode('LO-2026-0002')
    const res = await ctx.app.inject({
      method: 'POST', url: `/api/v1/admin/orders/${orderId}/reallocate`, headers: await ctx.admin(),
      payload: { allocation_id: alloc.id, batch_id: targetBatch, quantity: 2, reason: 'Đổi sang lô cận hạn' },
    })
    expect(res.statusCode).toBe(200)
    const target = await q<{ reserved_qty: number }>(
      `SELECT reserved_qty FROM inventory WHERE batch_id=$1 AND warehouse_id=$2`,
      [targetBatch, await warehouseId()],
    )
    expect(target[0]!.reserved_qty).toBe(2)
  })
})

describe('ADM-10-03 refunds never exceed money received', () => {
  it('rejects a refund larger than the recorded payment', async () => {
    const p = await productIdBySlug('ca-chua-bien')
    const orderId = await placeOrder(2, p, 1, 'gate-refund-cap-1')
    const total = (await q<{ total_vnd: number }>(`SELECT total_vnd FROM orders WHERE id=$1`, [orderId]))[0]!.total_vnd

    const unpaid = await ctx.app.inject({
      method: 'POST', url: '/api/v1/admin/refunds', headers: await ctx.admin(),
      payload: { order_id: orderId, amount_vnd: 1000, reason: 'Đơn chưa thu tiền' },
    })
    expect(unpaid.statusCode).toBe(422)

    await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${orderId}/payment`, headers: await ctx.admin(), payload: {} })
    const over = await ctx.app.inject({
      method: 'POST', url: '/api/v1/admin/refunds', headers: await ctx.admin(),
      payload: { order_id: orderId, amount_vnd: total + 1, reason: 'Thử hoàn vượt số đã thu' },
    })
    expect(over.statusCode).toBe(422)

    const ok = await ctx.app.inject({
      method: 'POST', url: '/api/v1/admin/refunds', headers: await ctx.admin(),
      payload: { order_id: orderId, amount_vnd: total, reason: 'Hoàn toàn bộ đơn' },
    })
    expect(ok.statusCode).toBe(201)
    const again = await ctx.app.inject({
      method: 'POST', url: '/api/v1/admin/refunds', headers: await ctx.admin(),
      payload: { order_id: orderId, amount_vnd: 1, reason: 'Hoàn thêm lần nữa' },
    })
    expect(again.statusCode).toBe(422)
  })
})
