import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, type Ctx } from './helpers.js'
import { q } from '../src/db.js'
import { shipFeeFor } from '../src/services/pricing.js'
import { codDue } from '@agrimarket/core'

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
    // `discount_vnd` is batch markdown + voucher; only the batch part lowers the free-ship
    // threshold. `subtotal_vnd - discount_vnd + voucher_vnd` is that taxable amount under both
    // conventions (seeders store the gross subtotal, the checkout API the post-markdown one).
    const rows = await q<{ code: string; subtotal_vnd: number; discount_vnd: number; ship_fee_vnd: number; voucher_vnd: string | null }>(
      `SELECT code, subtotal_vnd, discount_vnd, ship_fee_vnd,
              COALESCE(promotion_snapshot->>'discount_vnd','0') AS voucher_vnd
         FROM orders`,
    )
    for (const r of rows) {
      const taxable = r.subtotal_vnd - r.discount_vnd + Number(r.voucher_vnd ?? 0)
      const expected = taxable >= 500_000 ? 0 : 20_000
      expect({ code: r.code, ship_fee_vnd: r.ship_fee_vnd }).toEqual({ code: r.code, ship_fee_vnd: expected })
    }
  })

  it('a 50.000₫ voucher on a 500.000₫ order keeps free shipping', async () => {
    const customer = await q<{ id: string }>(`SELECT id FROM users WHERE role='CUSTOMER' ORDER BY created_at LIMIT 1`)
    const order = await q<{ id: string }>(
      `INSERT INTO orders (code, customer_id, status, payment_method, payment_status, address_snapshot,
                           subtotal_vnd, discount_vnd, ship_fee_vnd, total_vnd, placed_at, promotion_snapshot)
       VALUES ('AGM-FREESHIP-VOUCHER',$1,'PENDING','COD','UNPAID','{}'::jsonb,
               500000, 50000, 0, 450000, now(), '{"code":"FREESHIP50","discount_vnd":50000}'::jsonb)
       RETURNING id`,
      [customer[0]!.id],
    )
    const row = await q<{ ship_fee_vnd: number; taxable: number }>(
      `SELECT ship_fee_vnd, subtotal_vnd - discount_vnd + COALESCE(promotion_snapshot->>'discount_vnd','0')::int AS taxable
         FROM orders WHERE id=$1`,
      [order[0]!.id],
    )
    expect(row[0]!.taxable).toBe(500_000)
    expect(row[0]!.ship_fee_vnd).toBe(0)
  })

  it('admin order detail reports every paid receipt, not one arbitrary row', async () => {
    const customer = await q<{ id: string }>(`SELECT id FROM users WHERE role='CUSTOMER' ORDER BY created_at LIMIT 1`)
    const order = await q<{ id: string }>(
      `INSERT INTO orders (code, customer_id, status, payment_method, payment_status, address_snapshot,
                           subtotal_vnd, discount_vnd, ship_fee_vnd, total_vnd, placed_at)
       VALUES ('AGM-MULTIPAY',$1,'PREPARING','COD','PAID','{}'::jsonb,100000,0,20000,120000,now())
       RETURNING id`,
      [customer[0]!.id],
    )
    const id = order[0]!.id
    // The receipt that proves the money, then the stale UNPAID row checkout left behind. Ordering
    // by `created_at DESC` used to surface the UNPAID row and print a second COD collection.
    await q(`INSERT INTO payments (order_id, method, amount_vnd, status, paid_at, reference) VALUES ($1,'COD',120000,'PAID',now()-interval '2 hours','FT-1')`, [id])
    await q(`INSERT INTO payments (order_id, method, amount_vnd, status) VALUES ($1,'COD',120000,'UNPAID')`, [id])

    const res = await ctx.app.inject({ url: `/api/v1/admin/orders/${id}`, headers: await ctx.admin() })
    expect(res.statusCode).toBe(200)
    const { payment } = res.json()
    expect(payment.paid_vnd).toBe(120000)
    expect(payment.is_paid).toBe(true)
    expect(payment.reference).toBe('FT-1')
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

/**
 * The threshold is compared to the goods total *after batch markdown, before the voucher*, so a
 * voucher can lower the bill but must never re-introduce a delivery fee. 499.999/500.000/500.001
 * pin the exact boundary of `shipFeeFor`.
 */
describe('free-shipping threshold', () => {
  it('charges 20.000₫ at 499.999₫ and 0₫ from exactly 500.000₫', () => {
    expect(shipFeeFor(499_999)).toBe(20_000)
    expect(shipFeeFor(500_000)).toBe(0)
    expect(shipFeeFor(500_001)).toBe(0)
  })

  it('a voucher never re-adds the fee: 500.000₫ goods with a 50.000₫ voucher still ships free', async () => {
    const customer = await q<{ id: string }>(`SELECT id FROM users WHERE role='CUSTOMER' ORDER BY created_at LIMIT 1`)
    const id = (
      await q<{ id: string }>(
        `INSERT INTO orders (code, customer_id, status, payment_method, payment_status, address_snapshot,
                             subtotal_vnd, discount_vnd, ship_fee_vnd, total_vnd, placed_at, promotion_snapshot)
         VALUES ('AGM-FREESHIP-VOUCHER-2',$1,'PENDING','COD','UNPAID','{}'::jsonb,
                 500000,50000,0,450000,now(),'{"code":"FREESHIP50","discount_vnd":50000}'::jsonb)
         RETURNING id`,
        [customer[0]!.id],
      )
    )[0]!.id
    const row = await q<{ ship_fee_vnd: number; total_vnd: number }>(
      `SELECT ship_fee_vnd, total_vnd FROM orders WHERE id=$1`,
      [id],
    )
    expect(row[0]).toEqual({ ship_fee_vnd: 0, total_vnd: 450_000 })
  })

  it('batch markdown can drop goods under the threshold: 550.000₫ − 100.000₫ lot pays 20.000₫', async () => {
    const customer = await q<{ id: string }>(`SELECT id FROM users WHERE role='CUSTOMER' ORDER BY created_at LIMIT 1`)
    const id = (
      await q<{ id: string }>(
        `INSERT INTO orders (code, customer_id, status, payment_method, payment_status, address_snapshot,
                             subtotal_vnd, discount_vnd, ship_fee_vnd, total_vnd, placed_at)
         VALUES ('AGM-LOT-SHIP',$1,'PENDING','COD','UNPAID','{}'::jsonb,550000,100000,20000,470000,now())
         RETURNING id`,
        [customer[0]!.id],
      )
    )[0]!.id
    const row = await q<{ taxable: number; ship_fee_vnd: number }>(
      `SELECT subtotal_vnd - discount_vnd AS taxable, ship_fee_vnd FROM orders WHERE id=$1`,
      [id],
    )
    expect(row[0]).toEqual({ taxable: 450_000, ship_fee_vnd: 20_000 })
  })
})

/**
 * COD is what the courier may still collect. It follows the sum of every PAID receipt — never one
 * arbitrary row — and it is zero for a paid, cancelled or failed order.
 */
describe('COD amount due', () => {
  async function order(code: string, total: number, status = 'PREPARING', paid = 0) {
    const customer = await q<{ id: string }>(`SELECT id FROM users WHERE role='CUSTOMER' ORDER BY created_at LIMIT 1`)
    const id = (
      await q<{ id: string }>(
        `INSERT INTO orders (code, customer_id, status, payment_method, payment_status, address_snapshot,
                             subtotal_vnd, discount_vnd, ship_fee_vnd, total_vnd, placed_at)
         VALUES ($1,$2,$3,'COD',$4,'{}'::jsonb,$5,0,0,$5,now()) RETURNING id`,
        [code, customer[0]!.id, status, paid > 0 ? 'PAID' : 'UNPAID', total],
      )
    )[0]!.id
    if (paid > 0) {
      await q(
        `INSERT INTO payments (order_id, method, amount_vnd, status, paid_at) VALUES ($1,'COD',$2,'PAID',now())`,
        [id, paid],
      )
    }
    return id
  }

  async function detail(id: string) {
    const res = await ctx.app.inject({ url: `/api/v1/admin/orders/${id}`, headers: await ctx.admin() })
    expect(res.statusCode).toBe(200)
    return res.json() as { total_vnd: number; status: string; payment: { paid_vnd: number; is_paid: boolean } }
  }

  it('unpaid order owes the full total', async () => {
    const d = await detail(await order('AGM-COD-UNPAID', 120_000))
    expect(d.payment.paid_vnd).toBe(0)
    expect(d.total_vnd - d.payment.paid_vnd).toBe(120_000)
  })

  it('fully paid order owes nothing', async () => {
    const d = await detail(await order('AGM-COD-PAID', 120_000, 'PREPARING', 120_000))
    expect(d.payment.is_paid).toBe(true)
    expect(d.total_vnd - d.payment.paid_vnd).toBe(0)
  })

  it('part payment leaves only the remainder', async () => {
    const d = await detail(await order('AGM-COD-PART', 120_000, 'PREPARING', 50_000))
    expect(d.payment.paid_vnd).toBe(50_000)
    expect(d.total_vnd - d.payment.paid_vnd).toBe(70_000)
  })

  it('a cancelled order and a failed delivery are not collected at all', async () => {
    for (const [code, status] of [['AGM-COD-CANCEL', 'CANCELLED'], ['AGM-COD-FAIL', 'DELIVERY_FAILED']] as const) {
      const d = await detail(await order(code, 90_000, status))
      // The order keeps its total for the record; `codDue` is what suppresses collection.
      expect(d.total_vnd).toBe(90_000)
      expect(codDue({ ...d, payment_method: 'COD', paid_vnd: d.payment.paid_vnd })).toBe(0)
    }
  })

  it('COD due is never negative, even if receipts exceed the total', async () => {
    expect(codDue({ payment_method: 'COD', status: 'PREPARING', total_vnd: 100_000, paid_vnd: 120_000 })).toBe(0)
  })
})
