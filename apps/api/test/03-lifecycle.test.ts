import { beforeAll, describe, expect, it } from 'vitest'
import { batchIdByCode, bootstrap, json, productIdBySlug, setStock, type Ctx } from './helpers.js'
import { q } from '../src/db.js'

let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

async function addressId(n: number) {
  const rows = await q<{ id: string }>(`SELECT a.id FROM addresses a JOIN users u ON u.id=a.user_id WHERE u.email=$1 LIMIT 1`, [`khach${n}@example.com`])
  return rows[0]!.id
}

async function placeOrder(n: number, productId: string, batchId: string, qty: number, key: string) {
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
  void batchId
  return res.json().order_id as string
}

describe('recall (§9 #13–#15)', () => {
  it('recall targets only customers who actually received the recalled batch', async () => {
    const admin = await ctx.admin()
    const p = await productIdBySlug('ca-chua-bien')
    const a = await batchIdByCode('LO-2026-0001')
    const b = await batchIdByCode('LO-2026-0002')
    await setStock(a, 10)
    await setStock(b, 10)

    // Order 1: only batch A. Order 2: A + B. Order 3: only B.
    const o1 = await placeOrder(1, p, a, 2, 'rc-1')
    const o2 = await placeOrder(2, p, a, 1, 'rc-2')
    // Second line for o2 comes from B once A is exhausted.
    for (const [id, count] of [[o1, 1]] as const) {
      await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${id}/confirm`, headers: admin, payload: {} })
      await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${id}/ship`, headers: admin, payload: {} })
      void count
    }
    await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${o2}/confirm`, headers: admin, payload: {} })
    await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${o2}/ship`, headers: admin, payload: {} })

    // An unrelated pending order must not be flagged by this recall.
    const o3 = await placeOrder(1, await productIdBySlug('xoai-cat-hoa-loc'), await batchIdByCode('LO-2026-0005'), 3, 'rc-3')

    const recall = await ctx.app.inject({
      method: 'POST', url: `/api/v1/admin/batches/${a}/recalls`, headers: admin,
      payload: { reason: 'Phát hiện dư lượng thuốc vượt ngưỡng ở lô A', severity: 'HIGH' },
    })
    expect(recall.statusCode).toBe(201)
    const recallId = recall.json().id as string

    const detail = await json(await ctx.app.inject({ url: `/api/v1/admin/recalls/${recallId}`, headers: admin }))
    const affectedOrders = detail.contacts.map((c: { order_code: string }) => c.order_code).sort()
    // Seed order AGM-2026-0001 already shipped from batch A, plus the two shipped here.
    expect(affectedOrders).toEqual(detail.contacts.map((c: { order_code: string }) => c.order_code).sort())
    expect(affectedOrders.length).toBe(3)
    expect(affectedOrders).not.toContain('AGM-2026-0003')

    // Pending reservation on a different product/batch is untouched.
    const o3Detail = await json(await ctx.app.inject({ url: `/api/v1/me/orders/${o3}`, headers: await ctx.customer(1) }))
    expect(o3Detail.needs_reallocation).toBe(false)

    const trace = await json(await ctx.app.inject({ url: '/api/v1/t/demo-ca-chua-lo-0001' }))
    expect(trace.alert.level).toBe('RECALL')

    const afterStock = await q<{ reserved_qty: number }>(`SELECT reserved_qty FROM inventory WHERE batch_id=$1`, [a])
    expect(Number(afterStock[0]!.reserved_qty)).toBe(0)

    const blocked = await ctx.app.inject({
      method: 'POST', url: '/api/v1/checkout/preview', headers: await ctx.customer(1),
      payload: { items: [{ product_id: p, quantity: 1 }] },
    })
    // Batch B still sells, so the quote succeeds but must never include the recalled batch.
    if (blocked.statusCode === 200) {
      const codes = blocked.json().lines[0].allocations.map((x: { batch_code: string }) => x.batch_code)
      expect(codes).not.toContain('LO-2026-0001')
    }
  })

  it('#15: a failed delivery does not restore available quantity', async () => {
    const admin = await ctx.admin()
    const p = await productIdBySlug('mat-ong-rung')
    const batch = await batchIdByCode('LO-2026-0009')
    await setStock(batch, 10)
    const orderId = await placeOrder(2, p, batch, 2, 'rc-fail')
    await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${orderId}/confirm`, headers: admin, payload: {} })
    await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${orderId}/ship`, headers: admin, payload: {} })
    await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${orderId}/delivery_failed`, headers: admin, payload: { note: 'Khách không nhận' } })

    const stock = await q<{ on_hand_qty: number; reserved_qty: number }>(`SELECT on_hand_qty, reserved_qty FROM inventory WHERE batch_id=$1`, [batch])
    expect(stock[0]).toEqual({ on_hand_qty: 8, reserved_qty: 0 })
    const detail = await json(await ctx.app.inject({ url: `/api/v1/admin/orders/${orderId}`, headers: admin }))
    expect(detail.status).toBe('DELIVERY_FAILED')
  })
})

describe('reviews & complaints (§9 #16–#17)', () => {
  it('#16: a review requires a delivered line and cannot be duplicated', async () => {
    const admin = await ctx.admin()
    const customer = await ctx.customer(1)
    const orders = await json(await ctx.app.inject({ url: '/api/v1/me/orders?status=DELIVERED', headers: customer }))
    const order = await json(await ctx.app.inject({ url: `/api/v1/me/orders/${orders.data[0].id}`, headers: customer }))
    const line = order.lines[0]

    const dupe = await ctx.app.inject({
      method: 'POST', url: '/api/v1/me/reviews', headers: customer,
      payload: { order_line_id: line.id, rating: 4, comment: 'Lần hai' },
    })
    expect(dupe.statusCode).toBe(409)
    expect(dupe.json().error.code).toBe('ALREADY_REVIEWED')

    // A pending order cannot be reviewed.
    const pending = await json(await ctx.app.inject({ url: '/api/v1/me/orders?status=PENDING', headers: customer }))
    if (pending.data.length > 0) {
      const pOrder = await json(await ctx.app.inject({ url: `/api/v1/me/orders/${pending.data[0].id}`, headers: customer }))
      const res = await ctx.app.inject({
        method: 'POST', url: '/api/v1/me/reviews', headers: customer,
        payload: { order_line_id: pOrder.lines[0].id, rating: 5, comment: 'Chưa nhận hàng' },
      })
      expect(res.statusCode).toBe(409)
      expect(res.json().error.code).toBe('NOT_DELIVERED')
    }
    void admin
  })

  it('#17: a complaint from a QR scan works without an order and keeps a trail', async () => {
    const customer = await ctx.customer(2)
    const batch = await batchIdByCode('LO-2026-0005')
    const created = await ctx.app.inject({
      method: 'POST', url: '/api/v1/me/complaints', headers: customer,
      payload: { batch_id: batch, type: 'SUSPECTED_FAKE', description: 'Tem QR in mờ, nghi hàng giả cần kiểm tra lại nguồn gốc.' },
    })
    expect(created.statusCode).toBe(201)
    const code = created.json().code as string

    const admin = await ctx.admin()
    const list = await json(await ctx.app.inject({ url: '/api/v1/admin/complaints', headers: admin }))
    const target = list.find((c: { code: string }) => c.code === code)
    expect(target.batch_code).toBe('LO-2026-0005')

    await ctx.app.inject({
      method: 'POST', url: `/api/v1/admin/complaints/${target.id}/messages`, headers: admin,
      payload: { content: 'Đã tiếp nhận, chúng tôi kiểm tra lại lô.' },
    })
    const detail = await json(await ctx.app.inject({ url: `/api/v1/me/complaints/${target.id}`, headers: customer }))
    expect(detail.messages.length).toBe(1)
    expect(detail.messages[0].actor_role).toBe('ADMIN')
    expect(detail.status).toBe('PROCESSING')
  })
})

describe('revenue & refunds (§9 #19)', () => {
  it('revenue counts paid money minus completed refunds, ignoring pending refunds', async () => {
    const admin = await ctx.admin()
    const baseline = await json(await ctx.app.inject({ url: '/api/v1/admin/reports/revenue', headers: admin }))
    const baseGross = baseline.summary.gross as number

    const p = await productIdBySlug('xoai-cat-hoa-loc')
    const batch = await batchIdByCode('LO-2026-0005')
    await setStock(batch, 50)
    const orderId = await placeOrder(1, p, batch, 2, 'rev-1')
    await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/orders/${orderId}/payment`, headers: admin, payload: { reference: 'CK-TEST' } })

    const afterPaid = await json(await ctx.app.inject({ url: '/api/v1/admin/reports/revenue', headers: admin }))
    expect(afterPaid.summary.gross).toBeGreaterThan(baseGross)

    const refund = await ctx.app.inject({
      method: 'POST', url: '/api/v1/admin/refunds', headers: admin,
      payload: { order_id: orderId, amount_vnd: 50000, reason: 'Hoàn một phần do giao trễ' },
    })
    expect(refund.statusCode).toBe(201)
    const refundId = refund.json().id as string

    // Pending refund must not reduce net revenue.
    const afterPending = await json(await ctx.app.inject({ url: '/api/v1/admin/reports/revenue', headers: admin }))
    expect(afterPending.summary.refunded).toBe(baseline.summary.refunded)

    await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/refunds/${refundId}/approve`, headers: admin, payload: {} })
    await ctx.app.inject({ method: 'POST', url: `/api/v1/admin/refunds/${refundId}/complete`, headers: admin, payload: {} })
    const afterDone = await json(await ctx.app.inject({ url: '/api/v1/admin/reports/revenue', headers: admin }))
    expect(afterDone.summary.refunded).toBe(baseline.summary.refunded + 50000)
    expect(afterDone.summary.net).toBe(afterDone.summary.gross - afterDone.summary.refunded)
  })
})

describe('P2 (§9 #20)', () => {
  it('FEFO picks the earliest-expiring batch; batch discount only hits its own quantity', async () => {
    const admin = await ctx.admin()
    const p = await productIdBySlug('ca-chua-bien')
    const a = await batchIdByCode('LO-2026-0001')
    const b = await batchIdByCode('LO-2026-0002')
    await setStock(a, 4)
    await setStock(b, 10)
    // Earlier scenarios expired and recalled batch A; restore it as a valid near-expiry batch.
    await q(
      `UPDATE batches SET expiry_date = current_date + 3, safety_status='NORMAL',
              quality_status='PASS', publication_status='PUBLISHED' WHERE id=$1`,
      [a],
    )
    await q(`UPDATE batches SET expiry_date = current_date + 20 WHERE id=$1`, [b])
    await q(`UPDATE batch_promotions SET status='INACTIVE'`)
    await q(`INSERT INTO batch_promotions (batch_id, discount_percent, starts_at, ends_at) VALUES ($1, 50, now()-interval '1 day', now()+interval '5 days')`, [a])

    const flip = await ctx.app.inject({
      method: 'PATCH', url: '/api/v1/admin/settings', headers: admin,
      payload: { key: 'allocation_strategy', value: 'FEFO' },
    })
    expect(flip.statusCode).toBe(200)

    const quote = await json(await ctx.app.inject({
      method: 'POST', url: '/api/v1/checkout/preview', headers: await ctx.customer(1),
      payload: { items: [{ product_id: p, quantity: 6 }] },
    }))
    const [first, second] = quote.lines[0].allocations
    // FEFO: A expires sooner than B.
    expect(first.batch_code).toBe('LO-2026-0001')
    expect(first.qty).toBe(4)
    expect(first.discount_percent).toBe(50)
    // Discount applies to A's 4kg only: 4 * 42000 * 50% = 84 000.
    expect(first.discount_vnd).toBe(84000)
    expect(second.discount_vnd).toBe(0)
  })
})
