import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, type Ctx } from './helpers.js'
import { q } from '../src/db.js'

/**
 * Money and stock must reconcile row by row, not just look plausible on one screen:
 * an order total is the sum of its parts, every PAID order has the receipt that proves it,
 * no refund exceeds what was actually collected, no batch is reserved for units already shipped,
 * and the delivery fee follows the frozen Hưng Yên policy on the subtotal before the voucher.
 */
let ctx: Ctx

beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

describe('order money reconciliation', () => {
  it('every order total equals subtotal − discount + ship fee', async () => {
    const bad = await q<{ code: string }>(
      `SELECT code FROM orders WHERE total_vnd <> subtotal_vnd - discount_vnd + ship_fee_vnd`,
    )
    expect(bad).toEqual([])
  })

  it('every PAID order has exactly the receipt it claims', async () => {
    const bad = await q<{ code: string; paid: string }>(
      `SELECT o.code, COALESCE(SUM(p.amount_vnd),0)::text AS paid
         FROM orders o LEFT JOIN payments p ON p.order_id=o.id
        WHERE o.payment_status='PAID'
        GROUP BY o.code, o.total_vnd
       HAVING COALESCE(SUM(p.amount_vnd),0) <> o.total_vnd`,
    )
    expect(bad).toEqual([])
  })

  it('no refund exceeds the amount actually collected', async () => {
    const bad = await q<{ code: string }>(
      `SELECT o.code
         FROM orders o
         JOIN LATERAL (SELECT COALESCE(SUM(p.amount_vnd),0) AS paid FROM payments p WHERE p.order_id=o.id) pay ON true
         JOIN LATERAL (SELECT COALESCE(SUM(r.amount_vnd),0) AS refunded FROM refund_requests r
                        WHERE r.order_id=o.id AND r.status IN ('PENDING','APPROVED','COMPLETED')) rf ON true
        WHERE rf.refunded > pay.paid`,
    )
    expect(bad).toEqual([])
  })

  it('delivery fee follows the Hưng Yên policy on subtotal after batches, before the voucher', async () => {
    const rows = await q<{ code: string; subtotal_vnd: number; discount_vnd: number; ship_fee_vnd: number; lot_vnd: string | null }>(
      `SELECT code, subtotal_vnd, discount_vnd, ship_fee_vnd,
              COALESCE(promotion_snapshot->>'discount_vnd','0') AS lot_vnd
         FROM orders`,
    )
    for (const r of rows) {
      const taxable = r.subtotal_vnd - Number(r.lot_vnd ?? 0)
      const expected = taxable >= 500_000 ? 0 : 20_000
      expect({ code: r.code, ship_fee_vnd: r.ship_fee_vnd }).toEqual({ code: r.code, ship_fee_vnd: expected })
    }
  })
})

describe('stock reconciliation', () => {
  it('reserved quantity per batch equals its open allocations', async () => {
    const bad = await q<{ code: string; reserved: string; open: string }>(
      `SELECT b.code,
              SUM(i.reserved_qty)::text AS reserved,
              COALESCE((SELECT SUM(a.reserved_qty) FROM order_line_allocations a
                         WHERE a.batch_id=b.id AND a.status='ACTIVE' AND a.shipped_qty=0),0)::text AS open
         FROM batches b JOIN inventory i ON i.batch_id=b.id
        GROUP BY b.id, b.code
       HAVING SUM(i.reserved_qty) <> COALESCE((SELECT SUM(a.reserved_qty) FROM order_line_allocations a
                                                WHERE a.batch_id=b.id AND a.status='ACTIVE' AND a.shipped_qty=0),0)`,
    )
    expect(bad).toEqual([])
  })
})
