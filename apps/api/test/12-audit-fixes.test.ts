import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, type Ctx } from './helpers.js'
import { q } from '../src/db.js'

/**
 * Regression guards for defects found in the 2026-11-18 final audit:
 * 1. the seed reserved fixed document codes that `code_sequences` never knew about, so the first
 *    Admin-created season/batch died with a 500 UNIQUE violation;
 * 2. the seed left `ACTIVE` reservations on cancelled orders and PAID orders without a payment row,
 *    so reserved stock and net revenue disagreed with the orders they came from.
 */
let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

describe('document code sequences (§15 audit S-01)', () => {
  it('lets the first Admin-created season and batch take a code above the seeded ones', async () => {
    const admin = await ctx.admin()
    const seeded = await q<{ code: string }>(`SELECT code FROM crop_seasons WHERE code ~ '^SS-[0-9]{4}-[0-9]+$' ORDER BY code DESC LIMIT 1`)
    const farm = await q<{ id: string; product_id: string }>(
      `SELECT f.id, b.product_id FROM farms f JOIN batches b ON b.season_id IN (SELECT id FROM crop_seasons WHERE farm_id=f.id) LIMIT 1`,
    )

    const season = await ctx.app.inject({
      method: 'POST', url: '/api/v1/admin/seasons', headers: admin,
      payload: { farm_id: farm[0]!.id, product_id: farm[0]!.product_id, variety: 'Giống kiểm thử', area_ha: 1, sown_at: '2026-10-01', expected_harvest_at: '2026-11-01' },
    })
    expect(season.statusCode).toBe(201)
    expect(season.json().code > (seeded[0]?.code ?? '')).toBe(true)

    const batch = await ctx.app.inject({
      method: 'POST', url: '/api/v1/admin/batches', headers: admin,
      payload: { season_id: season.json().id, harvest_date: '2026-11-10', pack_date: '2026-11-10', expiry_date: '2026-12-10', harvested_qty: 5 },
    })
    expect(batch.statusCode).toBe(201)
    expect(batch.json().id).toBeTruthy()
  })
})

describe('demo seed stock & money integrity (§15 audit S-02)', () => {
  it('keeps no reservation on a cancelled order and pays every paid demo order', async () => {
    const orphans = await q<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM order_line_allocations a
         JOIN order_lines l ON l.id=a.order_line_id JOIN orders o ON o.id=l.order_id
        WHERE o.status='CANCELLED' AND a.status='ACTIVE'`,
    )
    expect(orphans[0]!.n).toBe(0)

    const unpaid = await q<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM orders o
        WHERE o.payment_status='PAID' AND o.is_demo
          AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id=o.id)`,
    )
    expect(unpaid[0]!.n).toBe(0)
  })
})

describe('customer order exposes the lot it shipped (§15 audit S-03)', () => {
  it('returns a QR token for each allocation so the shopper can open the trace of that lot', async () => {
    const h = await ctx.customer(1)
    const list = await ctx.app.inject({ method: 'GET', url: '/api/v1/me/orders?pageSize=50', headers: h })
    const delivered = list.json().data.find((o: { status: string }) => o.status === 'DELIVERED')
    expect(delivered).toBeTruthy()

    const detail = await ctx.app.inject({ method: 'GET', url: `/api/v1/me/orders/${delivered.id}`, headers: h })
    const allocations = detail.json().lines.flatMap((l: { allocations: unknown[] }) => l.allocations)
    expect(allocations.length).toBeGreaterThan(0)
    expect(typeof allocations[0].qr_token).toBe('string')
  })
})
