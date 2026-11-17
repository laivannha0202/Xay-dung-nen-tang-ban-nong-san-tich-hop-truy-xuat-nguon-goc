/**
 * Extra demo business data on top of `seed-demo-catalog.ts`, for a database that must not be
 * wiped. Idempotent: every row is keyed by its natural code (order / complaint / promotion), so a
 * second run changes nothing. Everything it writes is flagged `is_demo = true`; real rows keep the
 * default false so the admin lists can label mock records.
 *
 * Chain: address → order → order_line → order_line_allocations (real batch) → inventory movement
 *        → optional review (needs DELIVERED) / complaint (needs a line + batch) → message thread.
 *
 *   pnpm --filter @agrimarket/api exec tsx src/scripts/seed-demo-orders.ts
 */
import { one, pool, q, tx, txq } from '../db.js'

const day = 86_400_000
const ago = (d: number) => new Date(Date.now() - d * day)

interface Spec {
  code: string
  customer: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
  paid: boolean
  shippedDays?: number
  deliveredDays?: number
  placedDays: number
  lines: Array<{ slug: string; qty: number }>
  review?: { line: number; rating: number; comment: string }
  complaint?: { line: number; type: string; description: string; status: string; adminReply: string }
}

const SPECS: Spec[] = [
  {
    code: 'AGM-2026-0101', customer: 'khach1@example.com', status: 'DELIVERED', paid: true,
    shippedDays: 6, deliveredDays: 5, placedDays: 7, lines: [{ slug: 'cam-sanh', qty: 2 }],
    review: { line: 0, rating: 5, comment: 'Cam mọng nước, vỏ mỏng đúng như mô tả. Tem QR quét ra đúng vườn ở Khoái Châu.' },
  },
  {
    code: 'AGM-2026-0102', customer: 'khach2@example.com', status: 'COMPLETED', paid: true,
    shippedDays: 12, deliveredDays: 9, placedDays: 14, lines: [{ slug: 'nhan-long-hung-yen', qty: 1 }],
    complaint: {
      line: 0, type: 'DAMAGED', status: 'RESOLVED',
      description: 'Một số quả nhãn bị dập ở đáy hộp do xếp chồng khi vận chuyển.',
      adminReply: 'Đã ghi nhận ảnh hộp bị dập. Đã hoàn 30.000₫ vào đơn kế tiếp và nhắc kho dùng vỉ chia tầng.',
    },
  },
  {
    code: 'AGM-2026-0103', customer: 'khach1@example.com', status: 'PREPARING', paid: false,
    placedDays: 1, lines: [{ slug: 'rau-muong', qty: 1 }, { slug: 'bi-do-hokkai', qty: 1 }],
  },
  {
    code: 'AGM-2026-0104', customer: 'khach2@example.com', status: 'CONFIRMED', paid: false,
    placedDays: 2, lines: [{ slug: 'buoi-da-xanh', qty: 1 }],
  },
  {
    code: 'AGM-2026-0105', customer: 'khach1@example.com', status: 'CANCELLED', paid: false,
    placedDays: 4, lines: [{ slug: 'gao-st25', qty: 1 }],
  },
]

async function main() {
  const admin = await one<{ id: string }>(`SELECT id FROM users WHERE role='ADMIN' ORDER BY created_at LIMIT 1`)
  if (!admin) throw new Error('No ADMIN user: run the normal seed first.')
  const warehouse = await one<{ id: string }>(`SELECT id FROM warehouses ORDER BY code LIMIT 1`)
  if (!warehouse) throw new Error('No warehouse: run the normal seed first.')

  // Voucher customers can actually type at checkout (PERCENT, 10%, from 200.000₫).
  await q(
    `INSERT INTO promotions (code, name, type, value, start_at, end_at, usage_limit, min_subtotal_vnd)
     VALUES ('HUNGYEN10','Giảm 10% đơn từ 200.000₫',  'PERCENT', 10, now() - interval '5 days', now() + interval '25 days', 200, 200000)
     ON CONFLICT (code) DO NOTHING`,
  )

  let created = 0
  for (const spec of SPECS) {
    const exists = await one<{ id: string }>(`SELECT id FROM orders WHERE code=$1`, [spec.code])
    if (exists) continue

    const customer = await one<{ id: string; recipient_name: string; phone: string; province: string;
      district: string; ward: string; street_detail: string; address_id: string }>(
      `SELECT u.id, a.id AS address_id, a.recipient_name, a.phone, a.province, a.district, a.ward, a.street_detail
         FROM users u JOIN addresses a ON a.user_id = u.id
        WHERE u.email = $1 ORDER BY a.is_default DESC, a.created_at LIMIT 1`,
      [spec.customer],
    )
    if (!customer) throw new Error(`No address for ${spec.customer}`)

    const picked: Array<{ slug: string; qty: number; productId: string; name: string; sku: string; unit: string;
      price: number; batchId: string; discount: number }> = []
    for (const line of spec.lines) {
      const row = await one<{ product_id: string; name: string; sku: string; unit: string; base_price_vnd: number;
        batch_id: string; discount_percent: number | null }>(
        `SELECT p.id AS product_id, p.name, p.sku, p.unit, p.base_price_vnd, b.id AS batch_id, bp.discount_percent
           FROM products p
           JOIN batches b ON b.product_id = p.id AND b.quality_status='PASS' AND b.publication_status='PUBLISHED'
                AND b.safety_status='NORMAL' AND b.expiry_date >= CURRENT_DATE
           JOIN inventory i ON i.batch_id=b.id AND (i.on_hand_qty - i.reserved_qty) > 0
           LEFT JOIN batch_promotions bp ON bp.batch_id=b.id AND bp.status='ACTIVE'
        WHERE p.slug=$1 ORDER BY b.harvest_date LIMIT 1`,
        [line.slug],
      )
      if (!row) throw new Error(`No sellable batch for ${line.slug}`)
      picked.push({
        slug: line.slug, qty: line.qty, productId: row.product_id, name: row.name, sku: row.sku,
        unit: row.unit, price: row.base_price_vnd, batchId: row.batch_id,
        discount: row.discount_percent ? Math.round(row.base_price_vnd * line.qty * row.discount_percent / 100) : 0,
      })
    }

    const subtotal = picked.reduce((s, l) => s + l.price * l.qty, 0)
    const discount = picked.reduce((s, l) => s + l.discount, 0)
    const ship = subtotal - discount >= 500_000 ? 0 : 20_000
    const total = subtotal - discount + ship
    const snapshot = JSON.stringify({
      id: customer.address_id, recipient_name: customer.recipient_name, phone: customer.phone,
      province: customer.province, district: customer.district, ward: customer.ward, street_detail: customer.street_detail,
    })

    await tx(async (c) => {
      const [order] = await txq<{ id: string }>(
        c,
        `INSERT INTO orders (code, customer_id, status, payment_method, payment_status, address_snapshot,
                             subtotal_vnd, discount_vnd, ship_fee_vnd, total_vnd, placed_at, is_demo)
         VALUES ($1,$2,$3,'COD',$4,$5,$6,$7,$8,$9,$10,true) RETURNING id`,
        [spec.code, customer.id, spec.status, spec.paid ? 'PAID' : 'UNPAID', snapshot,
         subtotal, discount, ship, total, ago(spec.placedDays)],
      )
      const orderId = order!.id

      for (const [i, l] of picked.entries()) {
        const [line] = await txq<{ id: string }>(
          c,
          `INSERT INTO order_lines (order_id, product_id, product_name, sku, unit, unit_price_vnd, quantity, total_vnd)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [orderId, l.productId, l.name, l.sku, l.unit, l.price, l.qty, l.price * l.qty],
        )
        const shipped = spec.deliveredDays !== undefined
        await txq(
          c,
          `INSERT INTO order_line_allocations (order_line_id, warehouse_id, batch_id, reserved_qty, shipped_qty, unit_price_vnd, discount_vnd, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE')`,
          [line!.id, warehouse!.id, l.batchId, l.qty, shipped ? l.qty : 0, l.price, l.discount],
        )
        if (shipped) {
          await txq(c, `UPDATE inventory SET on_hand_qty = on_hand_qty - $3 WHERE warehouse_id=$1 AND batch_id=$2`,
            [warehouse!.id, l.batchId, l.qty])
          await txq(
            c,
            `INSERT INTO stock_movements (warehouse_id, batch_id, type, quantity, on_hand_after, reason, source_type, source_id, actor_id)
             SELECT $1,$2,'OUT',$3,on_hand_qty,$4,'ORDER',$5,$6 FROM inventory WHERE warehouse_id=$1 AND batch_id=$2`,
            [warehouse!.id, l.batchId, l.qty, `Xuất cho đơn ${spec.code}`, orderId, admin!.id],
          )
        } else if (spec.status !== 'CANCELLED') {
          await txq(c, `UPDATE inventory SET reserved_qty = reserved_qty + $3 WHERE warehouse_id=$1 AND batch_id=$2`,
            [warehouse!.id, l.batchId, l.qty])
        }

        if (spec.review && spec.review.line === i) {
          await txq(
            c,
            `INSERT INTO reviews (customer_id, order_line_id, product_id, rating, comment, is_demo)
             VALUES ($1,$2,$3,$4,$5,true) ON CONFLICT (customer_id, order_line_id) DO NOTHING`,
            [customer.id, line!.id, l.productId, spec.review.rating, spec.review.comment],
          )
        }

        if (spec.complaint && spec.complaint.line === i) {
          const [complaint] = await txq<{ id: string }>(
            c,
            `INSERT INTO complaints (code, customer_id, order_id, order_line_id, batch_id, type, description, status, is_demo)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING id`,
            [`KN-${spec.code.split('-').at(-1)}`, customer.id, orderId, line!.id, l.batchId,
             spec.complaint.type, spec.complaint.description, spec.complaint.status],
          )
          const cid = complaint!.id
          await txq(c, `INSERT INTO complaint_messages (complaint_id, actor_id, actor_role, content) VALUES ($1,$2,'CUSTOMER',$3)`,
            [cid, customer.id, spec.complaint.description])
          await txq(c, `INSERT INTO complaint_messages (complaint_id, actor_id, actor_role, content) VALUES ($1,$2,'ADMIN',$3)`,
            [cid, admin!.id, spec.complaint.adminReply])
          if (spec.complaint.status === 'RESOLVED') {
            await txq(c, `UPDATE complaints SET resolution=$2, updated_at=now() WHERE id=$1`,
              [cid, spec.complaint.adminReply])
          }
        }
      }

      if (spec.shippedDays !== undefined) {
        await txq(
          c,
          `INSERT INTO shipments (order_id, carrier, tracking_code, status, shipped_at, delivered_at)
           VALUES ($1,'GHN',$2,$3,$4,$5) ON CONFLICT (order_id) DO NOTHING`,
          [orderId, `GHN-${spec.code.split('-').at(-1)}${Math.floor(Math.random() * 90 + 10)}`,
           spec.deliveredDays !== undefined ? 'DELIVERED' : 'SHIPPING',
           ago(spec.shippedDays), spec.deliveredDays !== undefined ? ago(spec.deliveredDays) : null],
        )
      }
      if (spec.paid) {
        await txq(
          c,
          `INSERT INTO payments (order_id, method, amount_vnd, status, paid_at, reference, recorded_by)
           VALUES ($1,'COD',$2,'PAID',$3,$4,$5)`,
          [orderId, total, ago((spec.deliveredDays ?? spec.placedDays) - 1), `PT-${spec.code.split('-').at(-1)}`, admin!.id],
        )
      }
    })
    created++
  }

  // Codes are `AGM-YYYY-NNNN`; keep the shared sequence ahead of what the demo wrote.
  await q(
    `INSERT INTO code_sequences (kind, year, last_value)
     SELECT 'order', EXTRACT(year FROM placed_at)::int, MAX(substring(code FROM '[0-9]+$')::int)
       FROM orders GROUP BY 1,2
     ON CONFLICT (kind, year) DO UPDATE SET last_value = GREATEST(code_sequences.last_value, EXCLUDED.last_value)`,
  )
  await q(
    `INSERT INTO code_sequences (kind, year, last_value)
     SELECT 'complaint', EXTRACT(year FROM created_at)::int, MAX(substring(code FROM '[0-9]+$')::int)
       FROM complaints WHERE code ~ '^KN-[0-9]{4}-[0-9]+$' GROUP BY 1,2
     ON CONFLICT (kind, year) DO UPDATE SET last_value = GREATEST(code_sequences.last_value, EXCLUDED.last_value)`,
  )

  console.log(`demo orders: +${created} (tổng ${SPECS.length} kịch bản), voucher HUNGYEN10`)
}

if (process.argv[1]?.endsWith('seed-demo-orders.ts')) {
  await main()
  await pool.end()
}
