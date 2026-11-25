import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, json, productIdBySlug, type Ctx } from './helpers.js'
import { q } from '../src/db.js'

/**
 * Checkout idempotency contract. The app navigates on `code`, so a replay that returns only
 * `order_id` used to strand a shopper who had in fact placed the order — these guard that a
 * replay and a fresh create return the same shape, and that a reuse of the key with a different
 * body is refused instead of silently ordering something else.
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

const key = (tag: string) => `idem-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

async function preview(h: Record<string, string>, items: Array<{ product_id: string; quantity: number }>, code?: string) {
  return json<{ version: string; promotion: { code: string } | null }>(
    await ctx.app.inject({
      method: 'POST', url: '/api/v1/checkout/preview', headers: h,
      payload: { items, promotion_code: code ?? null },
    }),
  )
}

function order(h: Record<string, string>, idem: string, payload: Record<string, unknown>) {
  return ctx.app.inject({ method: 'POST', url: '/api/v1/orders', headers: { ...h, 'idempotency-key': idem }, payload })
}

describe('checkout idempotency contract', () => {
  it('returns the same order_id and code on a replay, and flags the replay', async () => {
    const h = await ctx.customer(1)
    const product = await productIdBySlug('gao-st25')
    const items = [{ product_id: product, quantity: 1 }]
    const quote = await preview(h, items)
    const payload = {
      address_id: await addressId(1), payment_method: 'COD', quote_version: quote.version, items,
    }
    const k = key('shape')
    const first = await order(h, k, payload)
    expect(first.statusCode).toBe(201)
    const created = first.json()
    expect(created.idempotent).toBe(false)
    expect(created.code).toMatch(/^AGM-/)
    expect(created.order_id).toBeTruthy()
    expect(created.status).toBe('PENDING')
    expect(created.payment_status).toBe('UNPAID')

    const again = await order(h, k, payload)
    expect(again.statusCode).toBe(200)
    const replay = again.json()
    expect(replay.idempotent).toBe(true)
    expect(replay.order_id).toBe(created.order_id)
    expect(replay.code).toBe(created.code)
    expect(replay.status).toBe('PENDING')
  })

  it('refuses the same key with a different body instead of ordering the new body', async () => {
    const h = await ctx.customer(1)
    const product = await productIdBySlug('gao-st25')
    const items = [{ product_id: product, quantity: 1 }]
    const quote = await preview(h, items)
    const k = key('mismatch')
    const first = await order(h, k, {
      address_id: await addressId(1), payment_method: 'COD', quote_version: quote.version, items,
    })
    expect(first.statusCode).toBe(201)

    const changed = await order(h, k, {
      address_id: await addressId(1), payment_method: 'BANK_TRANSFER', quote_version: quote.version,
      items: [{ product_id: product, quantity: 2 }],
    })
    expect(changed.statusCode).toBe(409)
    expect(changed.json().error.code).toBe('IDEMPOTENCY_MISMATCH')

    // Nothing new was ordered, and the cart was not consumed twice.
    const rows = await q<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM orders o JOIN idempotency_records i ON i.order_id = o.id WHERE i.key = $1`,
      [k],
    )
    expect(rows[0]!.n).toBe(1)
  })

  it('replays without pricing again after the cart is emptied by the first order', async () => {
    const h = await ctx.customer(2)
    const product = await productIdBySlug('gao-st25')
    // Cart-driven checkout: the first order clears it, so a replay has no items to price.
    await ctx.app.inject({ method: 'PUT', url: `/api/v1/me/cart/items/${product}`, headers: h, payload: { quantity: 2 } })
    const cart = (await ctx.app.inject({ method: 'POST', url: '/api/v1/checkout/preview', headers: h, payload: {} })).json()
    const payload = { address_id: await addressId(2), payment_method: 'COD', quote_version: cart.version }
    const k = key('cart-gone')

    const first = await order(h, k, payload)
    expect(first.statusCode).toBe(201)
    const emptyCart = await ctx.app.inject({ method: 'GET', url: '/api/v1/me/cart', headers: h })
    expect(emptyCart.json().items).toHaveLength(0)

    const again = await order(h, k, payload)
    expect(again.statusCode).toBe(200)
    expect(again.json().code).toBe(first.json().code)
  })

  it('replays past a voucher whose last use the first order consumed', async () => {
    const h = await ctx.customer(1)
    const product = await productIdBySlug('ca-chua-bien')
    await q(`UPDATE products SET base_price_vnd=100000 WHERE id=$1`, [product])
    await q(`UPDATE batch_promotions SET status='INACTIVE'`)
    await q(`UPDATE promotions SET usage_limit=1, used_count=0, min_subtotal_vnd=0,
               start_at=now()-interval '5 days', end_at=now()+interval '20 days' WHERE code='RAUMAU2026'`)
    try {
      const items = [{ product_id: product, quantity: 3 }]
      const quote = await preview(h, items, 'RAUMAU2026')
      expect(quote.promotion?.code).toBe('RAUMAU2026')
      const payload = {
        address_id: await addressId(1), payment_method: 'COD', quote_version: quote.version,
        promotion_code: 'RAUMAU2026', items,
      }
      const k = key('voucher-gone')
      const first = await order(h, k, payload)
      expect(first.statusCode).toBe(201)
      const used = await q<{ used_count: number }>(`SELECT used_count FROM promotions WHERE code='RAUMAU2026'`)
      expect(used[0]!.used_count).toBe(1)

      const again = await order(h, k, payload)
      expect(again.statusCode).toBe(200)
      expect(again.json().code).toBe(first.json().code)
      expect((await q<{ used_count: number }>(`SELECT used_count FROM promotions WHERE code='RAUMAU2026'`))[0]!.used_count).toBe(1)
    } finally {
      await q(`UPDATE promotions SET usage_limit=200, used_count=0, min_subtotal_vnd=100000 WHERE code='RAUMAU2026'`)
    }
  })

  it('gives both concurrent requests the same code, never a second order', async () => {
    const h = await ctx.customer(1)
    const product = await productIdBySlug('gao-st25')
    const items = [{ product_id: product, quantity: 1 }]
    const quote = await preview(h, items)
    const payload = {
      address_id: await addressId(1), payment_method: 'COD', quote_version: quote.version, items,
    }
    const k = key('concurrent')
    const [a, b] = await Promise.all([order(h, k, payload), order(h, k, payload)])
    expect([a.statusCode, b.statusCode].sort()).toEqual([200, 201])
    expect(a.json().order_id).toBe(b.json().order_id)
    expect(a.json().code).toBe(b.json().code)
    expect(a.json().code).toMatch(/^AGM-/)
  })

  it('leaves no record behind for a rejected request, so a fixed retry succeeds', async () => {
    const h = await ctx.customer(1)
    const product = await productIdBySlug('gao-st25')
    const items = [{ product_id: product, quantity: 1 }]
    const quote = await preview(h, items)
    const k = key('rejected')

    const stale = await order(h, k, {
      address_id: await addressId(1), payment_method: 'COD', quote_version: 'stale', items,
    })
    expect(stale.statusCode).toBe(409)
    expect(stale.json().error.code).toBe('PRICE_CHANGED')
    expect(await q(`SELECT 1 FROM idempotency_records WHERE key=$1`, [k])).toHaveLength(0)

    const retry = await order(h, k, {
      address_id: await addressId(1), payment_method: 'COD', quote_version: quote.version, items,
    })
    expect(retry.statusCode).toBe(201)
  })

  it('looks an order up by request key for a client that lost the response', async () => {
    const h = await ctx.customer(1)
    const product = await productIdBySlug('gao-st25')
    const items = [{ product_id: product, quantity: 1 }]
    const quote = await preview(h, items)
    const k = key('lookup')
    const created = (await order(h, k, {
      address_id: await addressId(1), payment_method: 'COD', quote_version: quote.version, items,
    })).json()

    const found = await ctx.app.inject({ url: `/api/v1/orders/by-request/${k}`, headers: h })
    expect(found.json()).toMatchObject({ order_id: created.order_id, code: created.code, status: 'PENDING' })

    // Another customer's key is invisible, and an unknown key is simply null.
    const other = await ctx.app.inject({ url: `/api/v1/orders/by-request/${k}`, headers: await ctx.customer(2) })
    expect(other.json().order_id).toBeNull()
  })
})
