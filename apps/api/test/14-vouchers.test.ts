import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, json, productIdBySlug, type Ctx } from './helpers.js'
import { q } from '../src/db.js'

/**
 * Voucher system: the offer list, the saved-voucher wallet and checkout all read the same
 * program rows, so these guard the three ways they could drift —
 * 1. a saved voucher looking usable after it expired / ran out,
 * 2. an unusable code silently pricing the order without a discount,
 * 3. two orders taking the last use of a program at once.
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

/** Puts one cheap, sellable lot on a canned price so subtotal maths is exact. */
async function cheapCart(unitPrice: number, qty: number) {
  const product = await productIdBySlug('ca-chua-bien')
  await q(`UPDATE products SET base_price_vnd=$1 WHERE id=$2`, [unitPrice, product])
  await q(`UPDATE batch_promotions SET status='INACTIVE'`)
  return { product, qty }
}

async function preview(h: Record<string, string>, product: string, qty: number, promotion_code?: string) {
  return json<{
    subtotal_vnd: number
    promotion_discount_vnd: number
    ship_fee_vnd: number
    total_vnd: number
    promotion: { code: string } | null
    promotion_error: { state: string; reason: string } | null
    version: string
    available_promotions: Array<{ code: string; state: string; discount_vnd: number; saved: boolean }>
  }>(
    await ctx.app.inject({
      method: 'POST', url: '/api/v1/checkout/preview', headers: h,
      payload: { items: [{ product_id: product, quantity: qty }], promotion_code: promotion_code ?? null },
    }),
  )
}

async function place(n: number, h: Record<string, string>, product: string, qty: number, version: string, promotion_code?: string) {
  return ctx.app.inject({
    method: 'POST', url: '/api/v1/orders',
    headers: { ...h, 'idempotency-key': `vouch-${Math.random().toString(36).slice(2)}` },
    payload: {
      address_id: await addressId(n), payment_method: 'COD', quote_version: version,
      promotion_code, items: [{ product_id: product, quantity: qty }],
    },
  })
}

async function promotionId(code: string): Promise<string> {
  const rows = await q<{ id: string }>(`SELECT id FROM promotions WHERE code=$1`, [code])
  return rows[0]!.id
}

/** The logged-in shopper's cart is what checkout prices when no items are posted. */
async function fillCart(h: Record<string, string>, product: string, qty: number) {
  await ctx.app.inject({
    method: 'PUT', url: `/api/v1/me/cart/items/${product}`, headers: h, payload: { quantity: qty },
  })
}

describe('voucher wallet', () => {
  it('saves idempotently, survives a second save, and lists from the live program', async () => {
    const h1 = await ctx.customer(1)
    const id = await promotionId('RAUMAU2026')
    for (let i = 0; i < 2; i++) {
      const res = await ctx.app.inject({ method: 'POST', url: `/api/v1/me/promotions/${id}`, headers: h1, payload: {} })
      expect(res.statusCode).toBe(200)
    }
    const rows = await q<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM customer_saved_promotions WHERE promotion_id=$1`, [id],
    )
    expect(rows[0]!.n).toBe(1)

    const wallet = await json<{ items: Array<{ code: string; saved: boolean }> }>(
      await ctx.app.inject({ url: '/api/v1/me/promotions', headers: h1 }),
    )
    expect(wallet.items.find((p) => p.code === 'RAUMAU2026')?.saved).toBe(true)
  })

  it('never consumes a program use, and never shows another customer’s wallet', async () => {
    const h1 = await ctx.customer(1)
    const before = await q<{ used_count: number }>(`SELECT used_count FROM promotions WHERE code='RAUMAU2026'`)
    await ctx.app.inject({ method: 'POST', url: `/api/v1/me/promotions/${await promotionId('RAUMAU2026')}`, headers: h1, payload: {} })
    const after = await q<{ used_count: number }>(`SELECT used_count FROM promotions WHERE code='RAUMAU2026'`)
    expect(after[0]!.used_count).toBe(before[0]!.used_count)

    const wallet2 = await json<{ items: Array<{ code: string }> }>(
      await ctx.app.inject({ url: '/api/v1/me/promotions', headers: await ctx.customer(2) }),
    )
    expect(wallet2.items.find((p) => p.code === 'RAUMAU2026')).toBeUndefined()
  })

  it('unsaves without touching the program and rejects a customer editing promotions', async () => {
    const h1 = await ctx.customer(1)
    const id = await promotionId('RAUMAU2026')
    const del = await ctx.app.inject({ method: 'DELETE', url: `/api/v1/me/promotions/${id}`, headers: h1 })
    expect(del.statusCode).toBe(200)
    const still = await q<{ n: number }>(`SELECT COUNT(*)::int AS n FROM promotions WHERE id=$1`, [id])
    expect(still[0]!.n).toBe(1)
    const tamper = await ctx.app.inject({
      method: 'PATCH', url: `/api/v1/admin/promotions/${id}`, headers: h1, payload: { value: 90 },
    })
    expect(tamper.statusCode).toBe(403)
  })
})

describe('voucher money', () => {
  it('charges ship on the goods total before the voucher and never double-deducts', async () => {
    const h1 = await ctx.customer(1)
    const { product, qty } = await cheapCart(100_000, 3) // 300.000₫
    const q1 = await preview(h1, product, qty, 'RAUMAU2026')
    expect(q1.subtotal_vnd).toBe(300_000)
    expect(q1.promotion_discount_vnd).toBe(30_000)
    expect(q1.ship_fee_vnd).toBe(20_000) // 300.000 < 500.000 even after the voucher
    expect(q1.total_vnd).toBe(300_000 - 30_000 + 20_000)
  })

  it('keeps free shipping when the goods total (not the discounted total) reaches 500.000₫', async () => {
    const h1 = await ctx.customer(1)
    const { product, qty } = await cheapCart(100_000, 5) // exactly 500.000₫
    const q1 = await preview(h1, product, qty, 'FREESHIP50')
    expect(q1.ship_fee_vnd).toBe(0)
    expect(q1.promotion_discount_vnd).toBe(50_000)
    expect(q1.total_vnd).toBe(450_000)
  })

  it('caps an AMOUNT voucher at the goods total and floors the total at ship fee', async () => {
    const h1 = await ctx.customer(1)
    const { product, qty } = await cheapCart(100_000, 3)
    await q(`UPDATE promotions SET min_subtotal_vnd=0, value=900000 WHERE code='FREESHIP50'`)
    const q1 = await preview(h1, product, qty, 'FREESHIP50')
    expect(q1.promotion_discount_vnd).toBe(300_000)
    expect(q1.total_vnd).toBe(20_000)
    await q(`UPDATE promotions SET value=50000, min_subtotal_vnd=300000 WHERE code='FREESHIP50'`)
  })

  it('reports why a code is unusable without pricing it', async () => {
    const h1 = await ctx.customer(1)
    const { product, qty } = await cheapCart(50_000, 1) // 50.000₫, below every minimum
    const q1 = await preview(h1, product, qty, 'RAUMAU2026')
    expect(q1.promotion).toBeNull()
    expect(q1.promotion_discount_vnd).toBe(0)
    expect(q1.promotion_error?.state).toBe('MIN_SUBTOTAL')
    expect(q1.promotion_error?.reason).toContain('100.000')
    expect(q1.available_promotions.find((p) => p.code === 'RAUMAU2026')?.state).toBe('MIN_SUBTOTAL')
  })

  it('refuses to submit when the voucher stopped being usable after the preview', async () => {
    const h1 = await ctx.customer(1)
    const { product, qty } = await cheapCart(100_000, 3)
    const q1 = await preview(h1, product, qty, 'RAUMAU2026')
    await q(`UPDATE promotions SET end_at=now()-interval '1 hour' WHERE code='RAUMAU2026'`)
    const res = await place(1, h1, product, qty, q1.version, 'RAUMAU2026')
    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('PROMOTION_EXPIRED')
    await q(`UPDATE promotions SET end_at=now()+interval '20 days' WHERE code='RAUMAU2026'`)
  })

  it('swapping vouchers with the same discount still changes the confirmed quote version', async () => {
    const h1 = await ctx.customer(1)
    const { product, qty } = await cheapCart(100_000, 5) // 500.000₫ → both give 50.000₫
    const a = await preview(h1, product, qty, 'RAUMAU2026') // 10% = 50.000
    const b = await preview(h1, product, qty, 'FREESHIP50') // 50.000 fixed
    expect(a.promotion_discount_vnd).toBe(b.promotion_discount_vnd)
    expect(a.version).not.toBe(b.version)
  })

  it('swapping through the wallet keeps the address and re-prices against the live cart', async () => {
    const h1 = await ctx.customer(1)
    const { product, qty } = await cheapCart(100_000, 5)
    await fillCart(h1, product, qty)
    const fsId = await promotionId('FREESHIP50')
    await ctx.app.inject({ method: 'POST', url: `/api/v1/me/promotions/${fsId}`, headers: h1, payload: {} })
    const cartLook = await json<{ subtotal_vnd: number; items: Array<{ code: string; discount_vnd: number }> }>(
      await ctx.app.inject({ url: '/api/v1/me/promotions', headers: h1 }),
    )
    expect(cartLook.subtotal_vnd).toBe(500_000)
    // A voucher whose window has closed flips to EXPIRED in the wallet, not "still usable".
    await q(`UPDATE promotions SET end_at=now()-interval '1 hour' WHERE code='FREESHIP50'`)
    const after = await json<{ items: Array<{ code: string; state: string }> }>(
      await ctx.app.inject({ url: '/api/v1/me/promotions', headers: h1 }),
    )
    expect(after.items.find((p) => p.code === 'FREESHIP50')?.state).toBe('EXPIRED')
    await q(`UPDATE promotions SET end_at=now()+interval '30 days' WHERE code='FREESHIP50'`)
  })
})

describe('voucher concurrency', () => {
  it('lets only one of two simultaneous orders take the last use', async () => {
    const { product, qty } = await cheapCart(100_000, 3)
    await q(`UPDATE promotions SET usage_limit=1, used_count=0, min_subtotal_vnd=0, end_at=now()+interval '20 days'
              WHERE code='RAUMAU2026'`)
    const [h1, h2] = [await ctx.customer(1), await ctx.customer(2)]
    const [q1, q2] = await Promise.all([preview(h1, product, qty, 'RAUMAU2026'), preview(h2, product, qty, 'RAUMAU2026')])
    const results = await Promise.all([
      place(1, h1, product, qty, q1.version, 'RAUMAU2026'),
      place(2, h2, product, qty, q2.version, 'RAUMAU2026'),
    ])
    const ok = results.filter((r) => r.statusCode === 201)
    expect(ok).toHaveLength(1)
    const used = await q<{ used_count: number }>(`SELECT used_count FROM promotions WHERE code='RAUMAU2026'`)
    expect(used[0]!.used_count).toBe(1)
    // The losing order left nothing behind.
    const loser = results.find((r) => r.statusCode !== 201)!
    expect(['PROMOTION_EXPIRED', 'PRICE_CHANGED']).toContain(loser.json().error.code)
    await q(`UPDATE promotions SET usage_limit=200, used_count=0 WHERE code='RAUMAU2026'`)
  })

  it('replays one idempotency key into one order and one consumed use', async () => {
    const h1 = await ctx.customer(1)
    const { product, qty } = await cheapCart(100_000, 3)
    await q(`UPDATE promotions SET usage_limit=200, used_count=0, min_subtotal_vnd=200000 WHERE code='RAUMAU2026'`)
    const q1 = await preview(h1, product, qty, 'RAUMAU2026')
    const key = `vouch-replay-${Date.now()}`
    const payload = {
      address_id: await addressId(1), payment_method: 'COD', quote_version: q1.version,
      promotion_code: 'RAUMAU2026', items: [{ product_id: product, quantity: qty }],
    }
    const first = await ctx.app.inject({ method: 'POST', url: '/api/v1/orders', headers: { ...h1, 'idempotency-key': key }, payload })
    expect(first.statusCode).toBe(201)
    const again = await ctx.app.inject({ method: 'POST', url: '/api/v1/orders', headers: { ...h1, 'idempotency-key': key }, payload })
    expect(again.statusCode).toBe(200)
    expect(again.json().idempotent).toBe(true)
    const used = await q<{ used_count: number }>(`SELECT used_count FROM promotions WHERE code='RAUMAU2026'`)
    expect(used[0]!.used_count).toBe(1)
  })
})
