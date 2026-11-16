import { beforeAll, describe, expect, it } from 'vitest'
import { batchIdByCode, bootstrap, json, productIdBySlug, setStock, type Ctx } from './helpers.js'

let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

const iso = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10)

async function preview(headers: Record<string, string>, product_id: string, quantity: number) {
  const res = await ctx.app.inject({
    method: 'POST', url: '/api/v1/checkout/preview', headers, payload: { items: [{ product_id, quantity }] },
  })
  return { status: res.statusCode, body: await json(res) }
}

describe('allocation, reservation, expiry (§9 #6–#12)', () => {
  it('#6: two customers reserving the last stock — only one order wins, stock never negative', async () => {
    const p = await productIdBySlug('buoi-da-xanh')
    const batch = await batchIdByCode('LO-2026-0007')
    await setStock(batch, 5)
    const h1 = await ctx.customer(1)
    const h2 = await ctx.customer(2)
    const q1 = await preview(h1, p, 4)
    const q2 = await preview(h2, p, 4)
    expect(q1.status).toBe(200)
    expect(q2.status).toBe(200)

    const place = (h: Record<string, string>, address: string, key: string, version: string) =>
      ctx.app.inject({
        method: 'POST', url: '/api/v1/orders', headers: { ...h, 'idempotency-key': key },
        payload: { address_id: address, payment_method: 'COD', quote_version: version, items: [{ product_id: p, quantity: 4 }] },
      })

    const [r1, r2] = await Promise.all([
      place(h1, await addressId(1), 'k-race-1', q1.body.version),
      place(h2, await addressId(2), 'k-race-2', q2.body.version),
    ])
    const codes = [r1.statusCode, r2.statusCode].sort()
    expect(codes).toEqual([201, 409])

    const stock = await stockOf(batch)
    expect(stock.on_hand_qty).toBe(5)
    expect(stock.reserved_qty).toBe(4)
  })

  it('#7: 7kg from A(4kg)+B(6kg) allocates A4+B3 in FIFO receipt order', async () => {
    const p = await productIdBySlug('ca-chua-bien')
    const a = await batchIdByCode('LO-2026-0001')
    const b = await batchIdByCode('LO-2026-0002')
    await setStock(a, 4)
    await setStock(b, 6)
    const h = await ctx.customer(1)
    const q = await preview(h, p, 7)
    expect(q.status).toBe(200)
    const allocs = q.body.lines[0].allocations
    expect(allocs.map((x: { batch_code: string; qty: number }) => [x.batch_code, x.qty])).toEqual([
      ['LO-2026-0001', 4],
      ['LO-2026-0002', 3],
    ])
  })

  it('#8: cancelling a reserved order frees reserved but never raises on_hand', async () => {
    const p = await productIdBySlug('gao-st25')
    const batch = await batchIdByCode('LO-2026-0008')
    await setStock(batch, 20)
    const h = await ctx.customer(1)
    const q = await preview(h, p, 5)
    const created = await ctx.app.inject({
      method: 'POST', url: '/api/v1/orders', headers: { ...h, 'idempotency-key': 'k-cancel' },
      payload: { address_id: await addressId(1), payment_method: 'COD', quote_version: q.body.version, items: [{ product_id: p, quantity: 5 }] },
    })
    expect(created.statusCode).toBe(201)
    const orderId = created.json().order_id as string

    const before = await stockOf(batch)
    expect(before).toEqual({ on_hand_qty: 20, reserved_qty: 5 })

    const cancel = await ctx.app.inject({
      method: 'POST', url: `/api/v1/me/orders/${orderId}/cancel`, headers: h, payload: { reason: 'Đổi ý' },
    })
    expect(cancel.statusCode).toBe(200)
    expect(await stockOf(batch)).toEqual({ on_hand_qty: 20, reserved_qty: 0 })
  })

  it('#9: shipping decrements on_hand and reserved and keeps the allocation row', async () => {
    const p = await productIdBySlug('gao-st25')
    const batch = await batchIdByCode('LO-2026-0008')
    await setStock(batch, 20)
    const h = await ctx.customer(1)
    const q = await preview(h, p, 3)
    const created = await ctx.app.inject({
      method: 'POST', url: '/api/v1/orders', headers: { ...h, 'idempotency-key': 'k-ship' },
      payload: { address_id: await addressId(1), payment_method: 'COD', quote_version: q.body.version, items: [{ product_id: p, quantity: 3 }] },
    })
    const orderId = created.json().order_id as string
    const admin = await ctx.admin()
    await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${orderId}/confirm`, headers: admin, payload: {} })
    const ship = await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${orderId}/ship`, headers: admin, payload: {} })
    expect(ship.statusCode).toBe(200)
    expect(await stockOf(batch)).toEqual({ on_hand_qty: 17, reserved_qty: 0 })

    const detail = await json(await ctx.app.inject({ url: `/api/v1/admin/orders/${orderId}`, headers: admin }))
    const alloc = detail.lines[0].allocations[0]
    expect(alloc.shipped_qty).toBe(3)
    expect(detail.status).toBe('SHIPPING')
  })

  it('#10: repeating the same idempotency key creates one order only', async () => {
    const p = await productIdBySlug('gao-st25')
    const h = await ctx.customer(1)
    const q = await preview(h, p, 1)
    const payload = { address_id: await addressId(1), payment_method: 'COD', quote_version: q.body.version, items: [{ product_id: p, quantity: 1 }] }
    const first = await ctx.app.inject({ method: 'POST', url: '/api/v1/orders', headers: { ...h, 'idempotency-key': 'k-dupe' }, payload })
    const second = await ctx.app.inject({ method: 'POST', url: '/api/v1/orders', headers: { ...h, 'idempotency-key': 'k-dupe' }, payload })
    expect(first.statusCode).toBe(201)
    expect(second.statusCode).toBe(200)
    expect(second.json().order_id).toBe(first.json().order_id)
  })

  it('#11: a price change between preview and confirm forces a re-quote', async () => {
    const p = await productIdBySlug('gao-st25')
    const h = await ctx.customer(1)
    const q = await preview(h, p, 1)
    const res = await ctx.app.inject({
      method: 'POST', url: '/api/v1/orders', headers: { ...h, 'idempotency-key': 'k-price' },
      payload: { address_id: await addressId(1), payment_method: 'COD', quote_version: 'stale-version', items: [{ product_id: p, quantity: 1 }] },
    })
    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('PRICE_CHANGED')
    expect(res.json().error.quote.version).toBe(q.body.version)
  })

  it('#12: an expired batch cannot ship; reallocation moves to a valid batch', async () => {
    const p = await productIdBySlug('ca-chua-bien')
    const a = await batchIdByCode('LO-2026-0001')
    const b = await batchIdByCode('LO-2026-0002')
    await setStock(a, 2)
    await setStock(b, 50)
    const h = await ctx.customer(1)
    const q = await preview(h, p, 2)
    const created = await ctx.app.inject({
      method: 'POST', url: '/api/v1/orders', headers: { ...h, 'idempotency-key': 'k-expire' },
      payload: { address_id: await addressId(1), payment_method: 'COD', quote_version: q.body.version, items: [{ product_id: p, quantity: 2 }] },
    })
    const orderId = created.json().order_id as string
    const admin = await ctx.admin()
    await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${orderId}/confirm`, headers: admin, payload: {} })

    // Force the reserved batch to expire between reservation and shipment.
    const { q: sql } = await import('../src/db.js')
    await sql(`UPDATE batches SET expiry_date = current_date - 1 WHERE id=$1`, [a])

    const ship = await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${orderId}/ship`, headers: admin, payload: {} })
    expect(ship.statusCode).toBe(409)
    expect(ship.json().error.code).toBe('BATCH_BLOCKED')

    const detail = await json(await ctx.app.inject({ url: `/api/v1/admin/orders/${orderId}`, headers: admin }))
    const alloc = detail.lines[0].allocations.find((x: { status: string }) => x.status === 'ACTIVE')
    const realloc = await ctx.app.inject({
      method: 'POST', url: `/api/v1/admin/orders/${orderId}/reallocate`, headers: admin,
      payload: { allocation_id: alloc.id, batch_id: b, quantity: 2, reason: 'Lô hết hạn' },
    })
    expect(realloc.statusCode).toBe(200)
    const shipped = await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${orderId}/ship`, headers: admin, payload: {} })
    expect(shipped.statusCode).toBe(200)
  })
})

async function stockOf(batchId: string) {
  const { q } = await import('../src/db.js')
  const rows = await q<{ on_hand_qty: number; reserved_qty: number }>(
    `SELECT on_hand_qty, reserved_qty FROM inventory WHERE batch_id=$1`, [batchId],
  )
  return rows[0]
}

async function addressId(n: number) {
  const { q } = await import('../src/db.js')
  const rows = await q<{ id: string }>(
    `SELECT a.id FROM addresses a JOIN users u ON u.id=a.user_id WHERE u.email=$1 LIMIT 1`,
    [`khach${n}@example.com`],
  )
  return rows[0]!.id
}

describe('authorisation (§9 #5)', () => {
  it('customer cannot call admin endpoints nor read another customer order', async () => {
    const h1 = await ctx.customer(1)
    const h2 = await ctx.customer(2)
    const adminCall = await ctx.app.inject({ url: '/api/v1/admin/dashboard', headers: h1 })
    expect(adminCall.statusCode).toBe(403)

    const mine = await json(await ctx.app.inject({ url: '/api/v1/me/orders', headers: h1 }))
    const foreign = await ctx.app.inject({ url: `/api/v1/me/orders/${mine.data[0].id}`, headers: h2 })
    expect(foreign.statusCode).toBe(404)

    const anon = await ctx.app.inject({ url: '/api/v1/admin/dashboard' })
    expect(anon.statusCode).toBe(401)
  })
})
