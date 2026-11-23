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

async function board() {
  return json<Array<{ code: string; state: string; reason: string; discount_vnd: number }>>(
    await ctx.app.inject({ url: '/api/v1/promotions' }),
  )
}

async function wallet(h: Record<string, string>) {
  return json<{ subtotal_vnd: number; items: Array<{ code: string; state: string; discount_vnd: number }> }>(
    await ctx.app.inject({ url: '/api/v1/me/promotions', headers: h }),
  )
}

/**
 * `usage_limit` caps the whole program, not a calendar month: `used_count` is the only
 * counter, so a program at its cap stays used up however the month rolls over.
 */
describe('voucher usage cap is lifetime', () => {
  it('stays usable at 99/100 and sells out at 100/100', async () => {
    const h1 = await ctx.customer(1)
    const { product, qty } = await cheapCart(100_000, 3)
    for (const [used, expected] of [[99, 'AVAILABLE'], [100, 'USED_UP']] as const) {
      await q(`UPDATE promotions SET usage_limit=100, used_count=$1, min_subtotal_vnd=0,
                 start_at=now()-interval '5 days', end_at=now()+interval '20 days'
               WHERE code='RAUMAU2026'`, [used])
      expect((await board()).find((p) => p.code === 'RAUMAU2026')?.state).toBe(expected)
      const p = await preview(h1, product, qty, 'RAUMAU2026')
      if (expected === 'AVAILABLE') expect(p.promotion?.code).toBe('RAUMAU2026')
      else expect(p.promotion_error?.state).toBe('USED_UP')
    }
    const soldOut = await preview(h1, product, qty, 'RAUMAU2026')
    expect(soldOut.promotion_discount_vnd).toBe(0)
    expect(soldOut.total_vnd).toBe(300_000 + 20_000)
    const res = await place(1, h1, product, qty, soldOut.version, 'RAUMAU2026')
    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('PROMOTION_EXPIRED')
    expect((await q<{ used_count: number }>(
      `SELECT used_count FROM promotions WHERE code='RAUMAU2026'`,
    ))[0]!.used_count).toBe(100)
  })

  it('does not refill when a new month starts', async () => {
    const h1 = await ctx.customer(1)
    // Every use landed in a previous month: a per-month window would read 0 and offer the
    // code again. The lifetime counter keeps it used up.
    await q(`UPDATE promotions SET usage_limit=100, used_count=100,
               start_at=now()-interval '70 days', end_at=now()+interval '20 days'
             WHERE code='RAUMAU2026'`)
    await q(`UPDATE orders SET placed_at = date_trunc('month', now()) - interval '1 month'
              WHERE promotion_id = (SELECT id FROM promotions WHERE code='RAUMAU2026')`)
    expect((await board()).find((p) => p.code === 'RAUMAU2026')?.state).toBe('USED_UP')
    const w = await wallet(h1)
    expect(w.items.find((p) => p.code === 'RAUMAU2026')?.state).not.toBe('AVAILABLE')
    await q(`UPDATE promotions SET usage_limit=100, used_count=0 WHERE code='RAUMAU2026'`)
  })
})

describe('public offer board state', () => {
  it('publishes the program’s real state instead of forcing AVAILABLE', async () => {
    const set = (sql: string) => q(`UPDATE promotions SET ${sql} WHERE code='FREESHIP50'`)
    const find = async () => (await board()).find((p) => p.code === 'FREESHIP50')

    await set(`status='ACTIVE', usage_limit=100, used_count=0,
                start_at=now()-interval '2 days', end_at=now()+interval '30 days'`)
    expect((await find())?.state).toBe('AVAILABLE')

    await set(`used_count=100`)
    const soldOut = await find()
    expect(soldOut?.state).toBe('USED_UP')
    expect(soldOut?.discount_vnd).toBe(0)

    await set(`used_count=0, end_at=now()-interval '1 hour'`)
    expect(await find()).toBeUndefined() // expired is not advertised

    await set(`end_at=now()+interval '30 days', start_at=now()+interval '2 days'`)
    expect(await find()).toBeUndefined() // not started yet

    await set(`start_at=now()-interval '2 days', status='INACTIVE'`)
    expect(await find()).toBeUndefined() // paused

    await set(`status='ACTIVE', min_subtotal_vnd=300000`)
  })

  it('prints the minimum as a condition and never invents a cart for a guest', async () => {
    const rows = await board()
    const v = rows.find((p) => p.code === 'RAUMAU2026')!
    expect(v.state).toBe('AVAILABLE') // no cart: the minimum is a condition, not a verdict
    expect(v.discount_vnd).toBe(0) // nothing to discount without a basket
    // The same rows are what a signed-in shopper's checkout sees; no per-user divergence.
    const h1 = await ctx.customer(1)
    const { product, qty } = await cheapCart(50_000, 1)
    await q(`UPDATE promotions SET min_subtotal_vnd=100000 WHERE code='RAUMAU2026'`)
    const small = await preview(h1, product, qty)
    expect(small.available_promotions.find((p) => p.code === 'RAUMAU2026')?.state).toBe('MIN_SUBTOTAL')
    await q(`UPDATE promotions SET min_subtotal_vnd=100000 WHERE code='RAUMAU2026'`)
  })
})

describe('wallet prices the cart like checkout', () => {
  it('judges the minimum on the batch-discounted total, not the base price', async () => {
    const h1 = await ctx.customer(1)
    await ctx.app.inject({
      method: 'POST', url: `/api/v1/me/promotions/${await promotionId('RAUMAU2026')}`, headers: h1, payload: {},
    })
    const product = await productIdBySlug('ca-chua-bien')
    await q(`UPDATE products SET base_price_vnd=42000, status='ACTIVE' WHERE id=$1`, [product])
    const batchA = await q<{ id: string }>(`SELECT id FROM batches WHERE code='LO-2026-0001'`)
    await q(`UPDATE batch_promotions SET status='INACTIVE'`)
    await q(`INSERT INTO batch_promotions (batch_id, discount_percent, starts_at, ends_at)
             VALUES ($1, 20, now()-interval '1 day', now()+interval '9 days')`, [batchA[0]!.id])
    const stockBefore = await q<{ n: number }>(
      `SELECT (COALESCE(SUM(on_hand_qty),0) - COALESCE(SUM(reserved_qty),0))::int AS n FROM inventory
        WHERE batch_id=$1`, [batchA[0]!.id],
    )
    await fillCart(h1, product, 2) // 84.000₫ gross, 67.200₫ after the 20% batch discount
    await q(`UPDATE promotions SET min_subtotal_vnd=75000, used_count=0, usage_limit=100 WHERE code='RAUMAU2026'`)

    const w = await wallet(h1)
    expect(w.subtotal_vnd).toBe(67_200)
    expect(w.items.find((p) => p.code === 'RAUMAU2026')?.state).toBe('MIN_SUBTOTAL')
    const p = await preview(h1, product, 2, 'RAUMAU2026')
    expect(p.subtotal_vnd).toBe(67_200)
    expect(p.promotion_error?.state).toBe('MIN_SUBTOTAL')

    await q(`UPDATE promotions SET min_subtotal_vnd=60000 WHERE code='RAUMAU2026'`)
    const ok = await wallet(h1)
    expect(ok.items.find((p) => p.code === 'RAUMAU2026')?.state).toBe('AVAILABLE')
    expect(ok.items.find((p) => p.code === 'RAUMAU2026')?.discount_vnd).toBe(6_720) // 10% of 67.200
    expect((await preview(h1, product, 2, 'RAUMAU2026')).promotion_discount_vnd).toBe(6_720)

    // Opening the wallet reserves nothing: stock and holds are untouched.
    const stockAfter = await q<{ n: number }>(
      `SELECT (COALESCE(SUM(on_hand_qty),0) - COALESCE(SUM(reserved_qty),0))::int AS n FROM inventory
        WHERE batch_id=$1`, [batchA[0]!.id],
    )
    expect(stockAfter[0]!.n).toBe(stockBefore[0]!.n)

    await q(`UPDATE batch_promotions SET status='INACTIVE'`)
    await q(`UPDATE promotions SET min_subtotal_vnd=100000 WHERE code='RAUMAU2026'`)
    await fillCart(h1, product, 0)
  })
})
