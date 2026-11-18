import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, json, type Ctx } from './helpers.js'
import { q } from '../src/db.js'

/**
 * Demo data must be labelled, never counted as business. The dashboard and the revenue report
 * aggregate `payments`; a demo payment that lands there inflates a number an operator will quote.
 */
let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

async function seedPaidOrder(isDemo: boolean, amount: number) {
  const customer = await q<{ id: string }>(`SELECT id FROM users WHERE role='CUSTOMER' ORDER BY created_at LIMIT 1`)
  const order = await q<{ id: string }>(
    `INSERT INTO orders (code, customer_id, status, payment_method, payment_status, address_snapshot,
                         subtotal_vnd, discount_vnd, ship_fee_vnd, total_vnd, placed_at, is_demo)
     VALUES ($1,$2,'COMPLETED','COD','PAID','{}'::jsonb,$3,0,0,$3,now(),$4) RETURNING id`,
    [`AGM-ISO-${isDemo ? 'DEMO' : 'REAL'}`, customer[0]!.id, amount, isDemo],
  )
  await q(
    `INSERT INTO payments (order_id, method, amount_vnd, status, paid_at) VALUES ($1,'COD',$2,'PAID',now())`,
    [order[0]!.id, amount],
  )
  return order[0]!.id
}

describe('DEMO data is excluded from business figures', () => {
  it('dashboard and revenue report ignore payments belonging to demo orders', async () => {
    const h = await ctx.admin()
    const before = await json(await ctx.app.inject({ url: '/api/v1/admin/reports/revenue', headers: h }))

    await seedPaidOrder(false, 500_000)
    await seedPaidOrder(true, 900_000)

    const after = await json(await ctx.app.inject({ url: '/api/v1/admin/reports/revenue', headers: h }))
    expect(after.summary.gross - before.summary.gross).toBe(500_000)

    const dash = await json(await ctx.app.inject({ url: '/api/v1/admin/dashboard', headers: h }))
    const demoPayments = await q<{ total: number }>(
      `SELECT COALESCE(SUM(p.amount_vnd),0)::int AS total FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.is_demo`,
    )
    expect(demoPayments[0]!.total).toBeGreaterThan(0)
    // Gross must equal real paid money, not real + demo.
    const realGross = await q<{ total: number }>(
      `SELECT COALESCE(SUM(p.amount_vnd),0)::int AS total FROM payments p JOIN orders o ON o.id=p.order_id
        WHERE p.status='PAID' AND NOT o.is_demo`,
    )
    expect(dash.revenue.gross).toBe(realGross[0]!.total)
  })
})
