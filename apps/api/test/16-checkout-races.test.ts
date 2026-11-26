import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, json, productIdBySlug, type Ctx } from './helpers.js'
import { q } from '../src/db.js'

/**
 * The checkout screen is a form the shopper keeps editing while the server answers: choose
 * voucher A then B, switch address mid-quote, apply/unapply repeatedly, lose the response of a
 * create, keep two tabs on the same idempotency key. Every case here is deterministic because
 * the delay is injected between the two requests, not raced — a flaky test would prove nothing.
 */
let ctx: Ctx

beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

async function addressId(n = 1): Promise<string> {
  const rows = await q<{ id: string }>(
    `SELECT a.id FROM addresses a JOIN users u ON u.id=a.user_id
      WHERE u.email=$1 ORDER BY a.is_default DESC LIMIT 1`,
    [`khach${n}@example.com`],
  )
  return rows[0]!.id
}

const key = (tag: string) => `race-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

interface Quote {
  version: string
  subtotal_vnd: number
  promotion_discount_vnd: number
  ship_fee_vnd: number
  total_vnd: number
  promotion: { code: string } | null
  promotion_error: { code: string; reason: string } | null
}

function preview(h: Record<string, string>, items: Array<{ product_id: string; quantity: number }>, code?: string | null) {
  return ctx.app.inject({
    method: 'POST', url: '/api/v1/checkout/preview', headers: h,
    payload: { items, promotion_code: code ?? null },
  })
}

const create = (h: Record<string, string>, idem: string, payload: Record<string, unknown>) =>
  ctx.app.inject({ method: 'POST', url: '/api/v1/orders', headers: { ...h, 'idempotency-key': idem }, payload })

describe('checkout under shifting shopper input', () => {
  it('keeps the quote of the voucher the shopper actually chose, when A answers after B', async () => {
    const h = await ctx.customer(1)
    const product = await productIdBySlug('gao-st25')
    const items = [{ product_id: product, quantity: 9 }]
    // A is fired first and answered second — the order the UI cannot control.
    const slowA = preview(h, items, 'RAUMAU2026').then((r) => json<Quote>(r))
    const fastB = await preview(h, items, 'FREESHIP50').then((r) => json<Quote>(r))
    const lateA = await slowA

    expect(lateA.version).not.toBe(fastB.version)
    // Submitting with B's version must succeed; A arriving later must not retro-apply A.
    const res = await create(h, key('voucher-b'), {
      address_id: await addressId(1), payment_method: 'COD', quote_version: fastB.version,
      promotion_code: 'FREESHIP50', items,
    })
    expect(res.statusCode).toBe(201)
    const order = await q<{ promotion_snapshot: { code: string } | null; total_vnd: number }>(
      `SELECT promotion_snapshot, total_vnd FROM orders WHERE id=$1`, [res.json().order_id],
    )
    expect(order[0]!.promotion_snapshot?.code).toBe('FREESHIP50')
    expect(order[0]!.total_vnd).toBe(fastB.total_vnd)
  })

  it('rejects a price confirmed against an address change mid-quote, then accepts the fresh one', async () => {
    const h = await ctx.customer(1)
    const product = await productIdBySlug('gao-st25')
    const items = [{ product_id: product, quantity: 2 }]
    const a1 = await addressId(1)
    const added = await ctx.app.inject({
      method: 'POST', url: '/api/v1/me/addresses', headers: h,
      payload: { recipient_name: 'Người nhận hai', phone: '0912345678', ward_code: '11980', street_detail: 'Số 2, đường thử' },
    })
    expect(added.statusCode).toBe(201)
    const a2 = added.json().id as string
    expect(a2).not.toBe(a1)

    const quoted = await preview(h, items).then((r) => json<Quote>(r))
    await q(`UPDATE products SET base_price_vnd = base_price_vnd + 5000 WHERE id=$1`, [product])
    try {
      const stale = await create(h, key('addr'), {
        address_id: a2, payment_method: 'COD', quote_version: quoted.version, items,
      })
      expect(stale.statusCode).toBe(409)
      expect(stale.json().error.code).toBe('PRICE_CHANGED')

      const fresh = await preview(h, items).then((r) => json<Quote>(r))
      const ok = await create(h, key('addr'), {
        address_id: a2, payment_method: 'COD', quote_version: fresh.version, items,
      })
      expect(ok.statusCode).toBe(201)
      const saved = await q<{ address_snapshot: { ward_code: string }; total_vnd: number }>(
        `SELECT address_snapshot, total_vnd FROM orders WHERE id=$1`, [ok.json().order_id],
      )
      expect(saved[0]!.address_snapshot.ward_code).toBe('11980')
      expect(saved[0]!.total_vnd).toBe(fresh.total_vnd)
    } finally {
      await q(`UPDATE products SET base_price_vnd = base_price_vnd - 5000 WHERE id=$1`, [product])
    }
  })

  it('tracks the last state of a rapid apply/unapply, and never prices a removed voucher', async () => {
    const h = await ctx.customer(1)
    const product = await productIdBySlug('gao-st25')
    const items = [{ product_id: product, quantity: 3 }]

    const states: Quote[] = []
    for (const code of ['RAUMAU2026', null, 'RAUMAU2026', null, 'RAUMAU2026']) {
      states.push(await preview(h, items, code).then((r) => json<Quote>(r)))
    }
    const applied = states.filter((s) => s.promotion !== null)
    const removed = states.filter((s) => s.promotion === null)
    expect(applied).toHaveLength(3)
    expect(removed).toHaveLength(2)
    for (const s of removed) expect(s.promotion_discount_vnd).toBe(0)
    // The two "applied" quotes are identical money, so the same version each time.
    expect(new Set(applied.map((s) => s.version)).size).toBe(1)
    expect(new Set(removed.map((s) => s.version)).size).toBe(1)
  })

  it('recovers the created order when the response to create was lost', async () => {
    const h = await ctx.customer(1)
    const product = await productIdBySlug('gao-st25')
    const items = [{ product_id: product, quantity: 1 }]
    const quote = await preview(h, items).then((r) => json<Quote>(r))
    const k = key('lost-response')
    const payload = { address_id: await addressId(1), payment_method: 'COD', quote_version: quote.version, items }

    const first = await create(h, k, payload)
    expect(first.statusCode).toBe(201)

    // Client never saw `first`; it asks by key, which is what both UIs do after a network drop.
    const lookup = await ctx.app.inject({ url: `/api/v1/orders/by-request/${k}`, headers: h }).then((r) => r.json())
    expect(lookup).toMatchObject({ order_id: first.json().order_id, code: first.json().code, status: 'PENDING' })

    // A blind retry still lands on the same single order.
    const retry = await create(h, k, payload)
    expect(retry.statusCode).toBe(200)
    expect(retry.json().order_id).toBe(first.json().order_id)
    const count = await q<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM orders WHERE customer_id=(SELECT id FROM users WHERE email='khach1@example.com')
        AND code=$1`, [first.json().code],
    )
    expect(count[0]!.n).toBe(1)
  })

  it('loses the network mid-reprice: the stale quote is refused, not silently used', async () => {
    const h = await ctx.customer(1)
    const product = await productIdBySlug('gao-st25')
    const items = [{ product_id: product, quantity: 2 }]
    const before = await preview(h, items).then((r) => json<Quote>(r))

    await q(`UPDATE products SET base_price_vnd = base_price_vnd + 7000 WHERE id=$1`, [product])
    try {
      // The reprice request died in flight; the shopper re-submits the older confirmation.
      const res = await create(h, key('offline'), {
        address_id: await addressId(1), payment_method: 'COD', quote_version: before.version, items,
      })
      expect(res.statusCode).toBe(409)
      expect(res.json().error.code).toBe('PRICE_CHANGED')
      expect(res.json().error.quote?.version).toBeTruthy()
    } finally {
      await q(`UPDATE products SET base_price_vnd = base_price_vnd - 7000 WHERE id=$1`, [product])
    }
  })

  it('walks both tabs of a same-key double submit: one order, same code, and a mismatch is refused', async () => {
    const h = await ctx.customer(1)
    const product = await productIdBySlug('gao-st25')
    const items = [{ product_id: product, quantity: 1 }]
    const quote = await preview(h, items).then((r) => json<Quote>(r))
    const k = key('tabs')
    const payload = { address_id: await addressId(1), payment_method: 'COD', quote_version: quote.version, items }

    const [a, b] = await Promise.all([create(h, k, payload), create(h, k, payload)])
    expect([a.statusCode, b.statusCode].sort()).toEqual([200, 201])
    expect(a.json().code).toBe(b.json().code)

    // Same key, other quantity → refused as a mismatch, and the first order still stands alone.
    const other = await create(h, k, { ...payload, items: [{ product_id: product, quantity: 4 }] })
    expect(other.statusCode).toBe(409)
    expect(other.json().error.code).toBe('IDEMPOTENCY_MISMATCH')
    // Exactly one order row references this key, carrying the one ordered line.
    const n = await q<{ orders: number; lines: number }>(
      `SELECT COUNT(DISTINCT o.id)::int AS orders, COUNT(l.id)::int AS lines
         FROM idempotency_records r JOIN orders o ON o.id=r.order_id
         LEFT JOIN order_lines l ON l.order_id=o.id
        WHERE r.key=$1`,
      [k],
    )
    expect(n[0]).toEqual({ orders: 1, lines: 1 })
  })
})
