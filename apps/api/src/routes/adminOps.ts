import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { one, q, tx, txq } from '../db.js'
import { parse, pagination } from '../lib/validate.js'
import { requireAdmin } from '../lib/auth.js'
import { AppError, errors } from '../lib/errors.js'
import { SHIPPABLE_SQL, TODAY, roundQty, todayVN } from '../services/invariants.js'
import { audit, batchEvent, releaseAllocations } from '../services/pricing.js'
import { normalizeVi } from '../services/serviceArea.js'
import { csv, sendCsv } from '../lib/csv.js'

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có dạng YYYY-MM-DD')

export async function adminOpsRoutes(app: FastifyInstance) {
  // ================= ADM-07 Warehouse & inventory =================
  app.get('/admin/warehouses', async (req) => {
    await requireAdmin(req)
    return q(
      `SELECT w.*, (SELECT COUNT(*)::int FROM inventory i WHERE i.warehouse_id=w.id AND i.on_hand_qty>0) AS batch_count
         FROM warehouses w ORDER BY w.name`,
    )
  })

  app.post('/admin/warehouses', async (req, reply) => {
    await requireAdmin(req)
    const body = parse(
      z.object({ code: z.string().trim().min(2).max(20), name: z.string().trim().min(2).max(80), address: z.string().trim().max(200).default('') }),
      req.body,
    )
    const r = await one<{ id: string }>(
      `INSERT INTO warehouses (code, name, address) VALUES ($1,$2,$3) RETURNING id`,
      [body.code, body.name, body.address],
    )
    return reply.code(201).send({ id: r?.id })
  })

  app.get('/admin/inventory', async (req, reply) => {
    await requireAdmin(req)
    const f = parse(
      z.object({
        search: z.string().trim().max(100).optional(),
        batch_id: z.string().uuid().optional(),
        product_id: z.string().uuid().optional(),
        low_only: z.enum(['true', 'false']).default('false'),
        format: z.enum(['json', 'csv']).default('json'),
        expiring_within_days: z.coerce.number().int().min(0).max(365).optional(),
        include_zero: z.enum(['true', 'false']).default('false'),
      }),
      req.query ?? {},
    )
    const params: unknown[] = []
    const where: string[] = []
    if (f.search) {
      params.push(`%${normalizeVi(f.search)}%`)
      where.push(`(vi_norm(b.code) LIKE $${params.length} OR vi_norm(p.name) LIKE $${params.length})`)
    }
    if (f.batch_id) {
      params.push(f.batch_id)
      where.push(`i.batch_id = $${params.length}`)
    }
    if (f.expiring_within_days !== undefined) {
      params.push(f.expiring_within_days)
      where.push(`b.expiry_date <= ${TODAY} + $${params.length}::int`)
    }
    if (f.product_id) {
      params.push(f.product_id)
      where.push(`b.product_id = $${params.length}`)
    }
    if (f.low_only === 'true') {
      where.push(
        `(i.on_hand_qty - i.reserved_qty) <= COALESCE((SELECT value::int FROM settings WHERE key='low_stock_threshold'), 10)`,
      )
    }
    if (f.include_zero === 'false') where.push('i.on_hand_qty > 0')
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const rows = await q<Record<string, unknown>>(
      `SELECT i.warehouse_id, w.name AS warehouse_name, i.batch_id, b.code AS batch_code,
              b.product_id, to_char(b.expiry_date,'YYYY-MM-DD') AS expiry_date, b.quality_status,
              b.publication_status, b.safety_status,
              p.name AS product_name, p.unit, i.on_hand_qty, i.reserved_qty,
              (i.on_hand_qty - i.reserved_qty) AS available_qty,
              i.received_at, (b.expiry_date < ${TODAY}) AS is_expired,
              (b.expiry_date >= ${TODAY} AND b.expiry_date <= ${TODAY} + 7) AS near_expiry,
              (i.on_hand_qty - i.reserved_qty) <= COALESCE((SELECT value::int FROM settings WHERE key='low_stock_threshold'), 10) AS is_low
         FROM inventory i JOIN batches b ON b.id=i.batch_id JOIN products p ON p.id=b.product_id
         JOIN warehouses w ON w.id=i.warehouse_id
         ${whereSql} ORDER BY b.expiry_date, b.code`,
      params,
    )
    if (f.format === 'csv') {
      return sendCsv(reply, `ton-kho-${todayVN()}.csv`, csv(rows, [
        ['batch_code', 'Mã lô'], ['product_name', 'Sản phẩm'], ['unit', 'Đơn vị'], ['warehouse_name', 'Kho'],
        ['on_hand_qty', 'Tồn thực tế'], ['reserved_qty', 'Giữ chỗ'], ['available_qty', 'Khả dụng'],
        ['expiry_date', 'Hạn dùng'], ['quality_status', 'Kiểm nghiệm'], ['safety_status', 'An toàn'],
      ]))
    }
    return rows
  })

  app.post('/admin/stock/receipts', async (req, reply) => {
    const s = await requireAdmin(req)
    const body = parse(
      z.object({
        warehouse_id: z.string().uuid(),
        batch_id: z.string().uuid(),
        quantity: z.number().positive('Số lượng nhập phải lớn hơn 0'),
        reason: z.string().trim().max(200).default('Nhập kho'),
      }),
      req.body,
    )
    const out = await tx(async (c) => {
      const b = await txq<{ code: string }>(c, `SELECT code FROM batches WHERE id=$1`, [body.batch_id])
      if (b.length === 0) throw errors.notFound('lô hàng')
      // Upsert then lock: quarantined batches may be received physically (ADM-07), just not sold.
      await txq(
        c,
        `INSERT INTO inventory (warehouse_id, batch_id, on_hand_qty, reserved_qty, received_at)
         VALUES ($1,$2,0,0,now()) ON CONFLICT (warehouse_id, batch_id) DO NOTHING`,
        [body.warehouse_id, body.batch_id],
      )
      const inv = await txq<{ on_hand_qty: number; reserved_qty: number }>(
        c,
        `SELECT on_hand_qty, reserved_qty FROM inventory WHERE warehouse_id=$1 AND batch_id=$2 FOR UPDATE`,
        [body.warehouse_id, body.batch_id],
      )
      const after = roundQty(inv[0]!.on_hand_qty + body.quantity)
      await txq(
        c,
        `UPDATE inventory SET on_hand_qty=$3, received_at=now(), updated_at=now()
          WHERE warehouse_id=$1 AND batch_id=$2`,
        [body.warehouse_id, body.batch_id, after],
      )
      await txq(
        c,
        `INSERT INTO stock_movements (warehouse_id, batch_id, type, quantity, on_hand_after, reason, source_type, actor_id)
         VALUES ($1,$2,'IN',$3,$4,$5,'RECEIPT',$6)`,
        [body.warehouse_id, body.batch_id, body.quantity, after, body.reason, s.sub],
      )
      await batchEvent(c, body.batch_id, 'STOCK_IN', 'Nhập kho', `${body.quantity} đơn vị`, s.sub)
      await audit(c, s.sub, 'stock.receipt', 'batch', body.batch_id, body.reason, null, { quantity: body.quantity })
      return { on_hand_qty: after }
    })
    return reply.code(201).send(out)
  })

  app.post('/admin/stock/adjustments', async (req, reply) => {
    const s = await requireAdmin(req)
    const body = parse(
      z.object({
        warehouse_id: z.string().uuid(),
        batch_id: z.string().uuid(),
        quantity_delta: z.number().refine((n) => n !== 0, 'Số lượng điều chỉnh phải khác 0'),
        reason: z.string().trim().min(5, 'Điều chỉnh tồn phải ghi lý do').max(200),
      }),
      req.body,
    )
    const out = await tx(async (c) => {
      const inv = await txq<{ on_hand_qty: number; reserved_qty: number }>(
        c,
        `SELECT on_hand_qty, reserved_qty FROM inventory WHERE warehouse_id=$1 AND batch_id=$2 FOR UPDATE`,
        [body.warehouse_id, body.batch_id],
      )
      if (inv.length === 0) throw errors.notFound('bản ghi tồn kho')
      const after = roundQty(inv[0]!.on_hand_qty + body.quantity_delta)
      if (after < 0) throw new AppError(422, 'INVALID_DATA', 'Tồn kho không được âm.')
      if (after < inv[0]!.reserved_qty) {
        throw new AppError(422, 'INVALID_DATA', 'Không thể điều chỉnh: tồn thực tế sau điều chỉnh nhỏ hơn lượng đang giữ chỗ.')
      }
      await txq(
        c,
        `UPDATE inventory SET on_hand_qty=$3, updated_at=now() WHERE warehouse_id=$1 AND batch_id=$2`,
        [body.warehouse_id, body.batch_id, after],
      )
      await txq(
        c,
        `INSERT INTO stock_movements (warehouse_id, batch_id, type, quantity, on_hand_after, reason, source_type, actor_id)
         VALUES ($1,$2,'ADJUST',$3,$4,$5,'MANUAL',$6)`,
        [body.warehouse_id, body.batch_id, body.quantity_delta, after, body.reason, s.sub],
      )
      await audit(c, s.sub, 'stock.adjust', 'batch', body.batch_id, body.reason, { on_hand: inv[0]!.on_hand_qty }, { on_hand: after })
      return { on_hand_qty: after }
    })
    return reply.code(201).send(out)
  })

  app.get('/admin/stock/movements', async (req) => {
    await requireAdmin(req)
    const { page, pageSize } = parse(pagination, req.query ?? {})
    const batchId = (req.query as { batch_id?: string } | undefined)?.batch_id
    const rows = await q(
      `SELECT m.*, b.code AS batch_code, w.name AS warehouse_name, u.email AS actor_email,
              o.code AS order_code
         FROM stock_movements m JOIN batches b ON b.id=m.batch_id JOIN warehouses w ON w.id=m.warehouse_id
         LEFT JOIN users u ON u.id=m.actor_id
         LEFT JOIN orders o ON m.source_type='ORDER' AND o.id=m.source_id
        ${batchId ? 'WHERE m.batch_id=$1' : ''}
        ORDER BY m.occurred_at DESC LIMIT $${batchId ? 2 : 1} OFFSET $${batchId ? 3 : 2}`,
      batchId ? [batchId, pageSize, (page - 1) * pageSize] : [pageSize, (page - 1) * pageSize],
    )
    return { data: rows, page, pageSize }
  })


  /** One movement, for its printed phiếu: the list endpoint has no product unit. */
  app.get('/admin/stock/movements/:id', async (req) => {
    await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const row = await one(
      `SELECT m.id, m.type, m.quantity, m.on_hand_after, m.reason, m.occurred_at,
              -- Deterministic document number: Nth phiếu of that type in its year, oldest first.
              -- Prefix follows the document, never the movement alone.
              CASE m.type WHEN 'IN' THEN 'PNK-' WHEN 'OUT' THEN 'PXK-' ELSE 'PDC-' END || to_char(m.occurred_at,'YYYY') || '-' || lpad((
                 SELECT COUNT(*) FROM stock_movements m2
                  WHERE m2.type=m.type AND date_trunc('year', m2.occurred_at)=date_trunc('year', m.occurred_at)
                    AND (m2.occurred_at, m2.id) <= (m.occurred_at, m.id))::text, 4, '0') AS doc_code,
              b.code AS batch_code, p.name AS product_name, p.unit,
              w.name AS warehouse_name, u.email AS actor_email, o.code AS order_code
         FROM stock_movements m
         JOIN batches b ON b.id=m.batch_id
         JOIN products p ON p.id=b.product_id
         JOIN warehouses w ON w.id=m.warehouse_id
         LEFT JOIN users u ON u.id=m.actor_id
         LEFT JOIN orders o ON m.source_type='ORDER' AND o.id=m.source_id
        WHERE m.id=$1`,
      [id],
    )
    if (!row) throw errors.notFound('phiếu kho')
    return row
  })

  // ================= ADM-08 Orders =================
  app.get('/admin/orders', async (req, reply) => {
    await requireAdmin(req)
    const { page, pageSize } = parse(pagination, req.query ?? {})
    const f = parse(
      z.object({
        search: z.string().trim().max(100).optional(),
        status: z.string().optional(),
        payment_status: z.string().optional(),
        from: dateOnly.optional(),
        to: dateOnly.optional(),
        format: z.enum(['json', 'csv']).default('json'),
      }),
      req.query ?? {},
    )
    const params: unknown[] = []
    const where: string[] = []
    if (f.search) {
      // One box, three ways an operator finds an order: code, email, or the phone the
      // customer gave at checkout (kept in the snapshot, so it survives profile edits).
      params.push(`%${normalizeVi(f.search)}%`)
      where.push(`(vi_norm(o.code) LIKE $${params.length} OR vi_norm(u.email) LIKE $${params.length} OR vi_norm(COALESCE(cp.name,'')) LIKE $${params.length} OR vi_norm(COALESCE(o.address_snapshot->>'phone','')) LIKE $${params.length})`)
    }
    if (f.status) {
      params.push(f.status)
      where.push(`o.status=$${params.length}`)
    }
    if (f.payment_status) {
      params.push(f.payment_status)
      where.push(`o.payment_status=$${params.length}`)
    }
    if (f.from) {
      params.push(f.from)
      where.push(`o.placed_at >= $${params.length}::date`)
    }
    if (f.to) {
      params.push(f.to)
      where.push(`o.placed_at < ($${params.length}::date + interval '1 day')`)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const select = `SELECT o.id, o.code, o.status, o.payment_status, o.payment_method, o.total_vnd, o.placed_at,
              u.email AS customer_email, cp.name AS customer_name,
              o.address_snapshot->>'phone' AS customer_phone, o.address_snapshot->>'ward' AS ward,
              o.address_snapshot->>'street_detail' AS street,
              (SELECT COUNT(*)::int FROM order_lines WHERE order_id=o.id) AS line_count,
              o.needs_reallocation, o.is_demo
         FROM orders o JOIN users u ON u.id=o.customer_id
         LEFT JOIN customer_profiles cp ON cp.user_id=u.id
         ${whereSql}`
    // `format=csv` reuses the very same filters: what you see is what you export.
    if (f.format === 'csv') {
      const all = await q(`${select} ORDER BY o.placed_at DESC`, params)
      return sendCsv(reply, `don-hang-${todayVN()}.csv`, csv(all, [
        ['code', 'Mã đơn'], ['status', 'Trạng thái'], ['payment_status', 'Thanh toán'],
        ['payment_method', 'Hình thức'], ['total_vnd', 'Tổng (₫)'], ['placed_at', 'Đặt lúc'],
        ['customer_name', 'Khách'], ['customer_phone', 'Điện thoại'], ['customer_email', 'Email'],
        ['street', 'Địa chỉ'], ['ward', 'Xã/phường'], ['line_count', 'Số dòng'],
      ]))
    }
    params.push(pageSize, (page - 1) * pageSize)
    const rows = await q(
      `SELECT o.id, o.code, o.status, o.payment_status, o.payment_method, o.total_vnd, o.placed_at,
              u.email AS customer_email, cp.name AS customer_name,
              (SELECT COUNT(*)::int FROM order_lines WHERE order_id=o.id) AS line_count,
              o.needs_reallocation, o.is_demo
         FROM orders o JOIN users u ON u.id=o.customer_id
         LEFT JOIN customer_profiles cp ON cp.user_id=u.id
         ${whereSql} ORDER BY o.placed_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    )
    const total = await one<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM orders o JOIN users u ON u.id=o.customer_id
         LEFT JOIN customer_profiles cp ON cp.user_id=u.id ${whereSql}`,
      params.slice(0, -2),
    )
    return { data: rows, page, pageSize, total: total?.n ?? 0 }
  })

  /** Counts per status for the order tabs, so "Chờ xác nhận (3)" needs no extra call per tab. */
  app.get('/admin/orders/counts', async (req) => {
    await requireAdmin(req)
    const rows = await q<{ status: string; n: number }>(`SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status`)
    const counts: Record<string, number> = { ALL: 0 }
    for (const r of rows) {
      counts[r.status] = r.n
      counts.ALL += r.n
    }
    return counts
  })

  /** Carrier names already used on real shipments — offered as a datalist, never invented. */
  app.get('/admin/orders/carriers', async (req) => {
    await requireAdmin(req)
    const rows = await q<{ carrier: string }>(
      `SELECT DISTINCT s.carrier FROM shipments s
        WHERE s.carrier <> '' ORDER BY s.carrier`,
    )
    return rows.map((r) => ({ carrier: r.carrier }))
  })

  app.get('/admin/orders/:id', async (req) => {
    await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const order = await one<Record<string, unknown>>(
      `SELECT o.*, u.email AS customer_email, cp.name AS customer_name, cp.phone AS customer_phone
         FROM orders o JOIN users u ON u.id=o.customer_id
         LEFT JOIN customer_profiles cp ON cp.user_id=u.id WHERE o.id=$1`,
      [id],
    )
    if (!order) throw errors.notFound('đơn hàng')
    const lines = await q(
      `SELECT l.*, (SELECT jsonb_agg(jsonb_build_object(
                'id', a.id, 'batch_id', a.batch_id, 'batch_code', b.code, 'expiry_date', b.expiry_date,
                'reserved_qty', a.reserved_qty, 'shipped_qty', a.shipped_qty, 'status', a.status,
                'safety_status', b.safety_status, 'quality_status', b.quality_status,
                'unit_price_vnd', a.unit_price_vnd, 'discount_vnd', a.discount_vnd,
                'warehouse_id', a.warehouse_id) ORDER BY b.code)
              FROM order_line_allocations a LEFT JOIN batches b ON b.id=a.batch_id
             WHERE a.order_line_id=l.id) AS allocations
         FROM order_lines l WHERE l.order_id=$1`,
      [id],
    )
    // COD must follow the money actually collected, not one arbitrary row: an order can hold a
    // stale UNPAID row created at checkout plus the PAID receipt, and `ORDER BY created_at` would
    // hand the printer the stale one and re-charge the customer. Sum every PAID row, and let the
    // newest PAID receipt supply method/reference/paid_at.
    const payment = await one(
      `SELECT COALESCE(SUM(amount_vnd) FILTER (WHERE status='PAID'),0)::int AS paid_vnd,
              BOOL_OR(status='PAID') AS is_paid,
              (ARRAY_AGG(method ORDER BY paid_at DESC NULLS LAST, created_at DESC))[1] AS method,
              (ARRAY_AGG(reference ORDER BY paid_at DESC NULLS LAST, created_at DESC))[1] AS reference,
              MAX(paid_at) AS paid_at
         FROM payments WHERE order_id=$1`,
      [id],
    )
    const refunds = await q(`SELECT * FROM refund_requests WHERE order_id=$1 ORDER BY created_at DESC`, [id])
    const shipment = await one(`SELECT * FROM shipments WHERE order_id=$1`, [id])
    const movements = await q(
      `SELECT m.*, b.code AS batch_code FROM stock_movements m JOIN batches b ON b.id=m.batch_id
        WHERE m.source_type='ORDER' AND m.source_id=$1 ORDER BY m.occurred_at`,
      [id],
    )
    const auditTrail = await q(
      `SELECT a.*, u.email AS actor_email FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id
        WHERE a.entity_type='order' AND a.entity_id=$1 ORDER BY a.created_at`,
      [id],
    )
    return { ...order, lines, payment, refunds, shipment, movements, audit: auditTrail }
  })

  const transitions: Record<string, { from: string[]; to: string }> = {
    confirm: { from: ['PENDING'], to: 'CONFIRMED' },
    prepare: { from: ['CONFIRMED'], to: 'PREPARING' },
    deliver: { from: ['SHIPPING'], to: 'DELIVERED' },
    complete: { from: ['DELIVERED'], to: 'COMPLETED' },
    delivery_failed: { from: ['SHIPPING'], to: 'DELIVERY_FAILED' },
  }

  for (const [action, rule] of Object.entries(transitions)) {
    app.post(`/admin/orders/:id/${action}`, async (req) => {
      const s = await requireAdmin(req)
      const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
      const body = parse(z.object({ note: z.string().trim().max(300).default('') }), req.body ?? {})
      await tx(async (c) => {
        const rows = await txq<{ status: string; code: string }>(
          c,
          `SELECT status, code FROM orders WHERE id=$1 FOR UPDATE`,
          [id],
        )
        const o = rows[0]
        if (!o) throw errors.notFound('đơn hàng')
        if (!rule.from.includes(o.status)) {
          throw new AppError(409, 'INVALID_TRANSITION', `Không thể chuyển từ ${o.status} sang ${rule.to}.`)
        }
        await txq(c, `UPDATE orders SET status=$2, updated_at=now() WHERE id=$1`, [id, rule.to])
        await audit(c, s.sub, `order.${action}`, 'order', id, body.note, { status: o.status }, { status: rule.to })
        if (rule.to === 'DELIVERED') {
          await txq(c, `UPDATE shipments SET status='DELIVERED', delivered_at=now() WHERE order_id=$1`, [id])
        }
        if (rule.to === 'DELIVERY_FAILED') {
          await txq(c, `UPDATE shipments SET status='FAILED' WHERE order_id=$1`, [id])
        }
      })
      return { ok: true, status: rule.to }
    })
  }

  app.patch('/admin/orders/:id/shipment', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({
        carrier: z.string().trim().max(80).default(''),
        tracking_code: z.string().trim().max(80).default(''),
        courier_name: z.string().trim().max(80).default(''),
        note: z.string().trim().max(300).default(''),
      }),
      req.body,
    )
    await tx(async (c) => {
      const exists = await txq(c, `SELECT id FROM orders WHERE id=$1`, [id])
      if (exists.length === 0) throw errors.notFound('đơn hàng')
      await txq(
        c,
        `INSERT INTO shipments (order_id, carrier, tracking_code, courier_name, note)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (order_id) DO UPDATE SET carrier=$2, tracking_code=$3, courier_name=$4, note=$5`,
        [id, body.carrier, body.tracking_code, body.courier_name, body.note],
      )
      await audit(c, s.sub, 'shipment.updated', 'order', id, '', null, body)
    })
    return { ok: true }
  })

  /** Replaces an allocation with another sellable batch before shipping — old row kept as REPLACED (TC15). */
  app.post('/admin/orders/:id/reallocate', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({
        allocation_id: z.string().uuid(),
        batch_id: z.string().uuid(),
        quantity: z.number().positive(),
        reason: z.string().trim().min(3, 'Ghi lý do đổi lô').max(200),
      }),
      req.body,
    )
    await tx(async (c) => {
      const allocs = await txq<{
        id: string; warehouse_id: string; batch_id: string; reserved_qty: number; shipped_qty: number
        status: string; unit_price_vnd: number; discount_vnd: number; order_status: string; order_line_id: string
      }>(
        c,
        `SELECT a.id, a.warehouse_id, a.batch_id, a.reserved_qty, a.shipped_qty, a.status, a.unit_price_vnd, a.discount_vnd,
                o.status AS order_status, a.order_line_id
           FROM order_line_allocations a JOIN order_lines l ON l.id=a.order_line_id
           JOIN orders o ON o.id=l.order_id WHERE a.id=$1 AND o.id=$2 FOR UPDATE OF a`,
        [body.allocation_id, id],
      )
      const a = allocs[0]
      if (!a) throw errors.notFound('phân bổ lô')
      if (a.status !== 'ACTIVE' || a.shipped_qty > 0) {
        throw new AppError(409, 'INVALID_STATE', 'Chỉ đổi được phân bổ chưa xuất kho.')
      }
      if (['SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED'].includes(a.order_status)) {
        throw new AppError(409, 'INVALID_STATE', 'Đơn đã xuất hoặc đã đóng, không thể đổi lô.')
      }
      // Guard: never reserve more than the line holds, never invent reserved stock.
      if (body.quantity > a.reserved_qty) {
        throw new AppError(422, 'INVALID_DATA', `Số lượng đổi lô (${body.quantity}) vượt lượng đang giữ chỗ (${a.reserved_qty}).`)
      }
      const target = await txq<{ warehouse_id: string; available: number }>(
        c,
        `SELECT i.warehouse_id, (i.on_hand_qty - i.reserved_qty) AS available FROM inventory i
           JOIN batches b ON b.id=i.batch_id JOIN products p ON p.id=b.product_id
          WHERE i.batch_id=$1 AND ${SHIPPABLE_SQL}
          ORDER BY (i.on_hand_qty - i.reserved_qty) DESC
          FOR UPDATE OF i`,
        [body.batch_id],
      )
      if (target.length === 0) {
        throw new AppError(409, 'BATCH_BLOCKED', 'Lô được chọn không đủ điều kiện bán/xuất.')
      }
      if (target[0]!.available < body.quantity) {
        throw errors.outOfStock([{ product_name: 'Lô mới', requested: body.quantity, available: target[0]!.available }])
      }
      const newWarehouse = target[0]!.warehouse_id
      await txq(
        c,
        `UPDATE inventory SET reserved_qty = GREATEST(0, reserved_qty - $3), updated_at=now()
          WHERE warehouse_id=$1 AND batch_id=$2`,
        [a.warehouse_id, a.batch_id, a.reserved_qty],
      )
      const bumped = await txq(
        c,
        `UPDATE inventory SET reserved_qty = reserved_qty + $3, updated_at=now()
          WHERE warehouse_id=$1 AND batch_id=$2 AND on_hand_qty - reserved_qty >= $3
          RETURNING reserved_qty`,
        [newWarehouse, body.batch_id, body.quantity],
      )
      if (bumped.length === 0) {
        throw errors.outOfStock([{ product_name: 'Lô mới', requested: body.quantity, available: 0 }])
      }
      await txq(c, `UPDATE order_line_allocations SET status='REPLACED' WHERE id=$1`, [a.id])
      await txq(
        c,
        `INSERT INTO order_line_allocations (order_line_id, warehouse_id, batch_id, reserved_qty, shipped_qty,
                                            unit_price_vnd, discount_vnd, status)
         VALUES ($1,$2,$3,$4,0,$5,$6,'ACTIVE')`,
        [a.order_line_id, newWarehouse, body.batch_id, body.quantity, a.unit_price_vnd, a.discount_vnd],
      )
      await audit(c, s.sub, 'order.reallocated', 'order', id, body.reason, { from: a.batch_id }, { to: body.batch_id })
    })
    return { ok: true }
  })

  /** Ships exactly the reserved allocations. Blocks when a batch is expired/HOLD/RECALLED (TC16). */
  app.post('/admin/orders/:id/ship', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({
        carrier: z.string().trim().max(80).default(''),
        tracking_code: z.string().trim().max(80).default(''),
        courier_name: z.string().trim().max(80).default(''),
      }),
      req.body ?? {},
    )
    const out = await tx(async (c) => {
      const orders = await txq<{ status: string; code: string }>(
        c,
        `SELECT status, code FROM orders WHERE id=$1 FOR UPDATE`,
        [id],
      )
      const o = orders[0]
      if (!o) throw errors.notFound('đơn hàng')
      if (!['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)) {
        throw new AppError(409, 'INVALID_TRANSITION', 'Chỉ xuất kho cho đơn chưa giao.')
      }
      const allocs = await txq<{
        id: string; warehouse_id: string; batch_id: string; reserved_qty: number; batch_code: string
        safety_status: string; quality_status: string; publication_status: string; expiry_ok: boolean
        on_hand_qty: number; reserved_inv: number
      }>(
        c,
        `SELECT a.id, a.warehouse_id, a.batch_id, a.reserved_qty, b.code AS batch_code,
                b.safety_status, b.quality_status, b.publication_status,
                (b.expiry_date >= ${TODAY}) AS expiry_ok, i.on_hand_qty, i.reserved_qty AS reserved_inv
           FROM order_line_allocations a JOIN batches b ON b.id=a.batch_id
           JOIN inventory i ON i.warehouse_id=a.warehouse_id AND i.batch_id=a.batch_id
          WHERE a.order_line_id IN (SELECT id FROM order_lines WHERE order_id=$1)
            AND a.status='ACTIVE' AND a.reserved_qty > 0
          ORDER BY b.code
          FOR UPDATE OF i, a`,
        [id],
      )
      if (allocs.length === 0) throw new AppError(409, 'INVALID_STATE', 'Đơn hàng không còn phân bổ lô để xuất.')
      const blocked = allocs.filter(
        (a) => !(a.quality_status === 'PASS' && a.publication_status === 'PUBLISHED' && a.safety_status === 'NORMAL' && a.expiry_ok),
      )
      if (blocked.length > 0) {
        throw new AppError(
          409,
          'BATCH_BLOCKED',
          `Không thể xuất: lô ${blocked.map((a) => a.batch_code).join(', ')} đã hết hạn/bị khóa/thu hồi. Vui lòng phân bổ lại hoặc hủy đơn.`,
          undefined,
          { blocked_batches: blocked.map((a) => a.batch_code) },
        )
      }
      for (const a of allocs) {
        const onHandAfter = roundQty(a.on_hand_qty - a.reserved_qty)
        const reservedAfter = roundQty(a.reserved_inv - a.reserved_qty)
        await txq(
          c,
          `UPDATE inventory SET on_hand_qty=$3, reserved_qty=$4, updated_at=now()
            WHERE warehouse_id=$1 AND batch_id=$2`,
          [a.warehouse_id, a.batch_id, onHandAfter, reservedAfter],
        )
        await txq(c, `UPDATE order_line_allocations SET shipped_qty=$2, status='ACTIVE' WHERE id=$1`, [a.id, a.reserved_qty])
        await txq(
          c,
          `INSERT INTO stock_movements (warehouse_id, batch_id, type, quantity, on_hand_after, reason, source_type, source_id, actor_id)
           VALUES ($1,$2,'OUT',$3,$4,$5,'ORDER',$6,$7)`,
          [a.warehouse_id, a.batch_id, a.reserved_qty, onHandAfter, `Xuất cho đơn ${o.code}`, id, s.sub],
        )
        await batchEvent(c, a.batch_id, 'STOCK_OUT', 'Xuất kho', `${a.reserved_qty} cho đơn ${o.code}`, s.sub)
      }
      await txq(c, `UPDATE orders SET status='SHIPPING', updated_at=now() WHERE id=$1`, [id])
      await txq(
        c,
        `INSERT INTO shipments (order_id, carrier, tracking_code, courier_name, status, shipped_at)
         VALUES ($1,$2,$3,$4,'SHIPPING',now())
         ON CONFLICT (order_id) DO UPDATE SET status='SHIPPING', shipped_at=now(),
           carrier=COALESCE(NULLIF($2,''),shipments.carrier),
           tracking_code=COALESCE(NULLIF($3,''),shipments.tracking_code),
           courier_name=COALESCE(NULLIF($4,''),shipments.courier_name)`,
        [id, body.carrier, body.tracking_code, body.courier_name],
      )
      await audit(c, s.sub, 'order.shipped', 'order', id, '', null, {
        allocations: allocs.map((a) => ({ batch: a.batch_code, qty: a.reserved_qty })),
      })
      return { ok: true, status: 'SHIPPING', shipped: allocs.map((a) => ({ batch_code: a.batch_code, qty: a.reserved_qty })) }
    })
    return out
  })

  // ================= ADM-10 Payments & refunds =================
  app.post('/admin/orders/:id/payment', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({ reference: z.string().trim().max(120).default(''), note: z.string().trim().max(300).default('') }),
      req.body ?? {},
    )
    await tx(async (c) => {
      const orders = await txq<{ payment_status: string; total_vnd: number; code: string }>(
        c,
        `SELECT payment_status, total_vnd, code FROM orders WHERE id=$1 FOR UPDATE`,
        [id],
      )
      const o = orders[0]
      if (!o) throw errors.notFound('đơn hàng')
      // Double-click safety (TC20): already PAID is a no-op, revenue counted once.
      if (o.payment_status === 'PAID' || o.payment_status === 'PARTIALLY_REFUNDED' || o.payment_status === 'REFUNDED') {
        return
      }
      await txq(c, `UPDATE payments SET status='PAID', paid_at=now(), reference=$3, recorded_by=$2 WHERE order_id=$1 AND status='UNPAID'`, [
        id, s.sub, body.reference,
      ])
      const updated = await txq(c, `SELECT 1 FROM payments WHERE order_id=$1 AND status='PAID'`, [id])
      if (updated.length === 0) {
        await txq(
          c,
          `INSERT INTO payments (order_id, method, amount_vnd, status, paid_at, reference, recorded_by)
           SELECT id, payment_method, total_vnd, 'PAID', now(), $2, $3 FROM orders WHERE id=$1`,
          [id, body.reference, s.sub],
        )
      }
      await txq(c, `UPDATE orders SET payment_status='PAID', updated_at=now() WHERE id=$1`, [id])
      await audit(c, s.sub, 'payment.confirmed', 'order', id, body.note, null, { amount: o.total_vnd, reference: body.reference })
    })
    return { ok: true }
  })

  app.get('/admin/refunds', async (req) => {
    await requireAdmin(req)
    return q(
      `SELECT r.*, o.code AS order_code, u.email AS customer_email,
              'HT-' || to_char(r.created_at,'YYYY') || '-' || lpad((
                 SELECT COUNT(*) FROM refund_requests r2
                  WHERE date_trunc('year', r2.created_at)=date_trunc('year', r.created_at)
                    AND (r2.created_at, r2.id) <= (r.created_at, r.id))::text, 4, '0') AS doc_code
         FROM refund_requests r JOIN orders o ON o.id=r.order_id JOIN users u ON u.id=o.customer_id
        ORDER BY r.created_at DESC`,
    )
  })

  app.post('/admin/refunds', async (req, reply) => {
    const s = await requireAdmin(req)
    const body = parse(
      z.object({ order_id: z.string().uuid(), amount_vnd: z.number().int().positive(), reason: z.string().trim().min(3).max(300) }),
      req.body,
    )
    const r = await tx(async (c) => {
      const o = await txq<{ total_vnd: number; payment_status: string }>(c, `SELECT total_vnd, payment_status FROM orders WHERE id=$1`, [body.order_id])
      if (o.length === 0) throw errors.notFound('đơn hàng')
      if (o[0]!.payment_status === 'UNPAID') {
        throw new AppError(422, 'INVALID_DATA', 'Đơn chưa thanh toán, không cần hoàn tiền.')
      }
      // Money out can never exceed money actually received, whatever the order total says.
      const money = await txq<{ paid: number; reserved: number }>(
        c,
        `SELECT
           (SELECT COALESCE(SUM(amount_vnd),0)::int FROM payments WHERE order_id=$1 AND status='PAID') AS paid,
           (SELECT COALESCE(SUM(amount_vnd),0)::int FROM refund_requests
             WHERE order_id=$1 AND status IN ('PENDING','APPROVED','COMPLETED')) AS reserved`,
        [body.order_id],
      )
      const paidVnd = money[0]?.paid ?? 0
      if (paidVnd === 0) throw new AppError(422, 'INVALID_DATA', 'Đơn chưa ghi nhận khoản thu nào, không thể hoàn tiền.')
      if ((money[0]?.reserved ?? 0) + body.amount_vnd > paidVnd) {
        throw new AppError(
          422,
          'INVALID_DATA',
          `Tổng tiền hoàn vượt quá số tiền đã thu (${paidVnd.toLocaleString('vi-VN')}₫).`,
        )
      }
      const row = await txq<{ id: string }>(
        c,
        `INSERT INTO refund_requests (order_id, amount_vnd, reason) VALUES ($1,$2,$3) RETURNING id`,
        [body.order_id, body.amount_vnd, body.reason],
      )
      return { id: row[0]!.id }
    })
    return reply.code(201).send(r)
  })

  app.post('/admin/refunds/:id/:action', async (req) => {
    const s = await requireAdmin(req)
    const { id, action } = parse(z.object({ id: z.string().uuid(), action: z.enum(['approve', 'complete', 'reject']) }), req.params)
    const body = parse(z.object({ note: z.string().trim().max(300).default('') }), req.body ?? {})
    await tx(async (c) => {
      const rows = await txq<{ order_id: string; amount_vnd: number; status: string }>(
        c,
        `SELECT order_id, amount_vnd, status FROM refund_requests WHERE id=$1 FOR UPDATE`,
        [id],
      )
      const r = rows[0]
      if (!r) throw errors.notFound('yêu cầu hoàn tiền')
      const next = action === 'approve' ? 'APPROVED' : action === 'complete' ? 'COMPLETED' : 'REJECTED'
      if (action === 'approve' && r.status !== 'PENDING') throw new AppError(409, 'INVALID_TRANSITION', 'Chỉ duyệt được yêu cầu đang chờ.')
      if (action === 'complete' && r.status !== 'APPROVED') throw new AppError(409, 'INVALID_TRANSITION', 'Chỉ hoàn tất được yêu cầu đã duyệt.')
      if (action === 'reject' && (r.status === 'COMPLETED' || r.status === 'REJECTED')) {
        throw new AppError(409, 'INVALID_TRANSITION', 'Yêu cầu đã xử lý xong.')
      }
      await txq(
        c,
        `UPDATE refund_requests SET status=$2, handled_by=$3, note=$4,
                completed_at = CASE WHEN $2='COMPLETED' THEN now() ELSE completed_at END
          WHERE id=$1`,
        [id, next, s.sub, body.note],
      )
      if (next === 'COMPLETED') {
        const totals = await txq<{ refunded: number; paid: number }>(
          c,
          `SELECT
             (SELECT COALESCE(SUM(amount_vnd),0)::int FROM refund_requests WHERE order_id=$1 AND status='COMPLETED') AS refunded,
             (SELECT COALESCE(SUM(amount_vnd),0)::int FROM payments WHERE order_id=$1 AND status='PAID') AS paid`,
          [r.order_id],
        )
        const t = totals[0]!
        const status = t.refunded >= t.paid ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
        await txq(c, `UPDATE orders SET payment_status=$2, updated_at=now() WHERE id=$1`, [r.order_id, status])
      }
      await audit(c, s.sub, `refund.${action}`, 'order', r.order_id, body.note, { status: r.status }, { status: next })
    })
    return { ok: true }
  })

  // ================= ADM-09 Promotions =================
  app.get('/admin/promotions', async (req) => {
    await requireAdmin(req)
    return q(`SELECT * FROM promotions ORDER BY created_at DESC`)
  })

  app.post('/admin/promotions', async (req, reply) => {
    const s = await requireAdmin(req)
    const body = parse(
      z.object({
        code: z.string().trim().min(3).max(32),
        name: z.string().trim().min(2).max(80),
        type: z.enum(['PERCENT', 'AMOUNT']),
        value: z.number().int().positive(),
        start_at: z.string().min(10),
        end_at: z.string().min(10),
        usage_limit: z.number().int().positive().nullish(),
        min_subtotal_vnd: z.number().int().nonnegative().default(0),
      }),
      req.body,
    )
    if (body.type === 'PERCENT' && body.value > 90) throw errors.invalid('Giảm giá tối đa 90%.')
    const r = await tx(async (c) => {
      const dupe = await txq(c, `SELECT 1 FROM promotions WHERE upper(code)=upper($1)`, [body.code])
      if (dupe.length) throw new AppError(409, 'CODE_EXISTS', 'Mã khuyến mãi đã tồn tại.')
      const row = await txq<{ id: string }>(
        c,
        `INSERT INTO promotions (code, name, type, value, start_at, end_at, usage_limit, min_subtotal_vnd)
         VALUES (upper($1),$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [body.code, body.name, body.type, body.value, body.start_at, body.end_at, body.usage_limit ?? null, body.min_subtotal_vnd],
      )
      await audit(c, s.sub, 'promotion.created', 'promotion', row[0]!.id, '', null, body)
      return { id: row[0]!.id }
    })
    return reply.code(201).send(r)
  })

  app.patch('/admin/promotions/:id', async (req) => {
    await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(z.object({ status: z.enum(['ACTIVE', 'INACTIVE']).optional(), usage_limit: z.number().int().positive().nullish() }), req.body)
    await q(
      `UPDATE promotions SET status=COALESCE($2,status), usage_limit=COALESCE($3,usage_limit) WHERE id=$1`,
      [id, body.status ?? null, body.usage_limit ?? null],
    )
    return { ok: true }
  })

  // ================= ADM-11 Reviews & complaints =================
  app.get('/admin/reviews', async (req) => {
    await requireAdmin(req)
    return q(
      `SELECT r.*, p.name AS product_name, o.code AS order_code, cp.name AS customer_name
         FROM reviews r JOIN products p ON p.id=r.product_id
         JOIN order_lines l ON l.id=r.order_line_id JOIN orders o ON o.id=l.order_id
         LEFT JOIN customer_profiles cp ON cp.user_id=r.customer_id
        ORDER BY r.created_at DESC LIMIT 200`,
    )
  })

  app.post('/admin/reviews/:id/hide', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(z.object({ reason: z.string().trim().min(5, 'Ghi lý do ẩn đánh giá').max(200) }), req.body)
    await tx(async (c) => {
      await txq(c, `UPDATE reviews SET status='HIDDEN', hidden_reason=$2 WHERE id=$1`, [id, body.reason])
      await audit(c, s.sub, 'review.hidden', 'review', id, body.reason)
    })
    return { ok: true }
  })

  app.get('/admin/complaints', async (req) => {
    await requireAdmin(req)
    const f = parse(z.object({ status: z.string().optional(), batch_id: z.string().uuid().optional() }), req.query ?? {})
    const params: unknown[] = []
    const where: string[] = []
    if (f.status) {
      params.push(f.status)
      where.push(`c.status=$${params.length}`)
    }
    if (f.batch_id) {
      params.push(f.batch_id)
      where.push(`c.batch_id=$${params.length}`)
    }
    return q(
      `SELECT c.*, u.email AS customer_email, cp.name AS customer_name, b.code AS batch_code, o.code AS order_code
         FROM complaints c JOIN users u ON u.id=c.customer_id
         LEFT JOIN customer_profiles cp ON cp.user_id=u.id
         LEFT JOIN batches b ON b.id=c.batch_id LEFT JOIN orders o ON o.id=c.order_id
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY c.created_at DESC LIMIT 200`,
      params,
    )
  })

  app.get('/admin/complaints/:id', async (req) => {
    await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const c = await one<Record<string, unknown>>(
      `SELECT c.*, u.email AS customer_email, cp.name AS customer_name, cp.phone AS customer_phone,
              b.code AS batch_code, o.code AS order_code,
              (SELECT r.id FROM recalls r WHERE r.batch_id=c.batch_id ORDER BY r.started_at DESC LIMIT 1) AS recall_id
         FROM complaints c JOIN users u ON u.id=c.customer_id
         LEFT JOIN customer_profiles cp ON cp.user_id=u.id
         LEFT JOIN batches b ON b.id=c.batch_id LEFT JOIN orders o ON o.id=c.order_id
        WHERE c.id=$1`,
      [id],
    )
    if (!c) throw errors.notFound('khiếu nại')
    const messages = await q(
      `SELECT m.*, COALESCE(cp.name, u.email) AS actor_name FROM complaint_messages m
         JOIN users u ON u.id=m.actor_id LEFT JOIN customer_profiles cp ON cp.user_id=u.id
        WHERE m.complaint_id=$1 ORDER BY m.created_at`,
      [id],
    )
    const files = await q(`SELECT id, url, mime FROM complaint_files WHERE complaint_id=$1`, [id])
    return { ...c, messages, files }
  })

  app.post('/admin/complaints/:id/messages', async (req, reply) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(z.object({ content: z.string().trim().min(1).max(2000) }), req.body)
    await tx(async (c) => {
      const exists = await txq(c, `SELECT status FROM complaints WHERE id=$1 FOR UPDATE`, [id])
      if (exists.length === 0) throw errors.notFound('khiếu nại')
      if (exists[0]!.status === 'CLOSED') throw new AppError(409, 'COMPLAINT_CLOSED', 'Khiếu nại đã đóng.')
      await txq(c, `INSERT INTO complaint_messages (complaint_id, actor_id, actor_role, content) VALUES ($1,$2,'ADMIN',$3)`, [id, s.sub, body.content])
      if (exists[0]!.status === 'NEW') await txq(c, `UPDATE complaints SET status='PROCESSING', updated_at=now() WHERE id=$1`, [id])
      else await txq(c, `UPDATE complaints SET updated_at=now() WHERE id=$1`, [id])
    })
    return reply.code(201).send({ ok: true })
  })

  app.post('/admin/complaints/:id/status', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({ status: z.enum(['NEW', 'PROCESSING', 'RESOLVED', 'CLOSED']), resolution: z.string().trim().max(1000).default('') }),
      req.body,
    )
    await tx(async (c) => {
      await txq(c, `UPDATE complaints SET status=$2, resolution=COALESCE(NULLIF($3,''),resolution), updated_at=now() WHERE id=$1`, [
        id, body.status, body.resolution,
      ])
      await audit(c, s.sub, 'complaint.status', 'complaint', id, body.resolution, null, { status: body.status })
    })
    return { ok: true }
  })

  // ================= ADM-12 Users =================
  app.get('/admin/customers', async (req) => {
    await requireAdmin(req)
    const { page, pageSize } = parse(pagination, req.query ?? {})
    const search = (req.query as { search?: string } | undefined)?.search
    const params: unknown[] = []
    let where = `WHERE u.role='CUSTOMER'`
    if (search) {
      params.push(`%${normalizeVi(search)}%`)
      where += ` AND (vi_norm(u.email) LIKE $${params.length} OR vi_norm(cp.name) LIKE $${params.length} OR vi_norm(cp.phone) LIKE $${params.length})`
    }
    params.push(pageSize, (page - 1) * pageSize)
    const rows = await q(
      `SELECT u.id, u.email, u.status, u.created_at, cp.name, cp.phone,
              (SELECT COUNT(*)::int FROM orders o WHERE o.customer_id=u.id) AS order_count,
              (SELECT COALESCE(SUM(o.total_vnd),0)::int FROM orders o WHERE o.customer_id=u.id AND o.payment_status IN ('PAID','PARTIALLY_REFUNDED','REFUNDED')) AS spent_vnd
         FROM users u LEFT JOIN customer_profiles cp ON cp.user_id=u.id
         ${where} ORDER BY u.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    )
    const total = await one<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM users u LEFT JOIN customer_profiles cp ON cp.user_id=u.id ${where}`,
      params.slice(0, -2),
    )
    return { data: rows, page, pageSize, total: total?.n ?? 0 }
  })

  app.post('/admin/customers/:id/status', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({ status: z.enum(['ACTIVE', 'LOCKED']), reason: z.string().trim().min(3, 'Ghi lý do khóa/mở tài khoản').max(200) }),
      req.body,
    )
    await tx(async (c) => {
      const target = await txq<{ role: string; status: string }>(c, `SELECT role, status FROM users WHERE id=$1 FOR UPDATE`, [id])
      if (target.length === 0) throw errors.notFound('tài khoản')
      if (target[0]!.role === 'ADMIN') throw errors.forbidden()
      // Token version bump kills existing sessions immediately (TC33).
      await txq(
        c,
        `UPDATE users SET status=$2, token_version = token_version + 1 WHERE id=$1`,
        [id, body.status],
      )
      await audit(c, s.sub, 'customer.status', 'user', id, body.reason, { status: target[0]!.status }, { status: body.status })
    })
    return { ok: true }
  })

  app.get('/admin/customers/:id', async (req) => {
    await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const user = await one<Record<string, unknown>>(
      `SELECT u.id, u.email, u.status, u.created_at, cp.name, cp.phone FROM users u
         LEFT JOIN customer_profiles cp ON cp.user_id=u.id WHERE u.id=$1 AND u.role='CUSTOMER'`,
      [id],
    )
    if (!user) throw errors.notFound('khách hàng')
    const orders = await q(
      `SELECT id, code, status, payment_status, total_vnd, placed_at FROM orders WHERE customer_id=$1 ORDER BY placed_at DESC LIMIT 50`,
      [id],
    )
    const addresses = await q(`SELECT * FROM addresses WHERE user_id=$1 AND deleted_at IS NULL`, [id])
    return { ...user, orders, addresses }
  })

  // ================= ADM-13 Reports =================
  app.get('/admin/reports/revenue', async (req) => {
    await requireAdmin(req)
    const f = parse(z.object({ from: dateOnly.optional(), to: dateOnly.optional(), group_by: z.enum(['day', 'month']).default('day') }), req.query ?? {})
    const from = f.from ?? todayVN(-30)
    const to = f.to ?? todayVN()
    const unit = f.group_by === 'month' ? 'month' : 'day'
    const rows = await q(
      `WITH paid AS (
         SELECT date_trunc($3, p.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') AS bucket, SUM(p.amount_vnd)::int AS gross
           FROM payments p JOIN orders o ON o.id=p.order_id
          WHERE p.status='PAID' AND NOT o.is_demo AND p.paid_at::date BETWEEN $1::date AND $2::date GROUP BY 1),
       refunded AS (
         SELECT date_trunc($3, r.completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh') AS bucket, SUM(r.amount_vnd)::int AS refunded
           FROM refund_requests r JOIN orders o ON o.id=r.order_id
          WHERE r.status='COMPLETED' AND NOT o.is_demo AND r.completed_at::date BETWEEN $1::date AND $2::date GROUP BY 1)
       SELECT COALESCE(paid.bucket, refunded.bucket) AS bucket, COALESCE(gross,0) AS gross,
              COALESCE(refunded,0) AS refunded, COALESCE(gross,0)-COALESCE(refunded,0) AS net
         FROM paid FULL OUTER JOIN refunded ON paid.bucket=refunded.bucket ORDER BY 1`,
      [from, to, unit],
    )
    const summary = await one<{ gross: number; refunded: number }>(
      `SELECT
        (SELECT COALESCE(SUM(p.amount_vnd),0)::int FROM payments p JOIN orders o ON o.id=p.order_id
          WHERE p.status='PAID' AND NOT o.is_demo AND p.paid_at::date BETWEEN $1::date AND $2::date) AS gross,
        (SELECT COALESCE(SUM(r.amount_vnd),0)::int FROM refund_requests r JOIN orders o ON o.id=r.order_id
          WHERE r.status='COMPLETED' AND NOT o.is_demo AND r.completed_at::date BETWEEN $1::date AND $2::date) AS refunded`,
      [from, to],
    )
    return {
      data: rows,
      summary: { gross: summary?.gross ?? 0, refunded: summary?.refunded ?? 0, net: (summary?.gross ?? 0) - (summary?.refunded ?? 0) },
      range: { from, to },
    }
  })

  app.get('/admin/reports/operations', async (req) => {
    await requireAdmin(req)
    const f = parse(z.object({ from: dateOnly.optional(), to: dateOnly.optional() }), req.query ?? {})
    const from = f.from ?? todayVN(-30)
    const to = f.to ?? todayVN()
    const ordersByStatus = await q(
      `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total_vnd),0)::int AS total_vnd FROM orders
        WHERE placed_at::date BETWEEN $1::date AND $2::date GROUP BY status ORDER BY status`,
      [from, to],
    )
    const inventoryByBatch = await q(
      `SELECT b.code AS batch_code, p.name AS product_name, b.expiry_date, b.quality_status, b.safety_status,
              COALESCE(SUM(i.on_hand_qty),0) AS on_hand, COALESCE(SUM(i.reserved_qty),0) AS reserved,
              COALESCE(SUM(i.on_hand_qty - i.reserved_qty),0) AS available
         FROM batches b JOIN products p ON p.id=b.product_id
         LEFT JOIN inventory i ON i.batch_id=b.id GROUP BY b.id, p.name ORDER BY b.expiry_date`,
    )
    const batchesByState = await one(
      `SELECT
        COUNT(*) FILTER (WHERE expiry_date >= ${TODAY} AND publication_status='PUBLISHED' AND safety_status='NORMAL')::int AS active,
        COUNT(*) FILTER (WHERE expiry_date >= ${TODAY} AND expiry_date <= ${TODAY}+7)::int AS near_expiry,
        COUNT(*) FILTER (WHERE expiry_date < ${TODAY})::int AS expired,
        COUNT(*) FILTER (WHERE safety_status='HOLD')::int AS hold,
        COUNT(*) FILTER (WHERE safety_status='RECALLED')::int AS recalled
       FROM batches`,
    )
    const labTests = await q(`SELECT overall_result, COUNT(*)::int AS count FROM lab_tests WHERE is_effective GROUP BY overall_result`)
    const qrScans = await q(
      `SELECT b.code AS batch_code, COUNT(s.id)::int AS scans, MAX(s.scanned_at) AS last_scan
         FROM qr_codes q JOIN batches b ON b.id=q.batch_id LEFT JOIN qr_scans s ON s.qr_id=q.id
        WHERE s.scanned_at IS NULL OR s.scanned_at::date BETWEEN $1::date AND $2::date
        GROUP BY b.code ORDER BY scans DESC LIMIT 50`,
      [from, to],
    )
    return { ordersByStatus, inventoryByBatch, batchesByState, labTests, qrScans, range: { from, to } }
  })

  // ================= ADM-04 Recalls =================
  app.get('/admin/recalls', async (req) => {
    await requireAdmin(req)
    return q(
      `SELECT r.*, b.code AS batch_code, p.name AS product_name,
              (SELECT COUNT(*)::int FROM recall_contacts rc WHERE rc.recall_id=r.id) AS affected_count
         FROM recalls r JOIN batches b ON b.id=r.batch_id JOIN products p ON p.id=b.product_id
        ORDER BY r.started_at DESC`,
    )
  })

  app.post('/admin/batches/:id/recalls', async (req, reply) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({ reason: z.string().trim().min(5, 'Ghi rõ lý do thu hồi').max(500), severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('HIGH') }),
      req.body,
    )
    const out = await tx(async (c) => {
      const b = await txq<{ code: string; safety_status: string }>(
        c,
        `SELECT code, safety_status FROM batches WHERE id=$1 FOR UPDATE`,
        [id],
      )
      if (b.length === 0) throw errors.notFound('lô hàng')
      if (b[0]!.safety_status === 'RECALLED') throw new AppError(409, 'ALREADY_RECALLED', 'Lô này đã bị thu hồi.')

      // 1) Block sale/ship atomically.
      await txq(c, `UPDATE batches SET safety_status='RECALLED' WHERE id=$1`, [id])
      await txq(c, `UPDATE qr_codes SET status='ACTIVE' WHERE batch_id=$1`, [id])
      await batchEvent(c, id, 'RECALL', 'Thu hồi lô', body.reason, s.sub)

      // 2) Release pre-ship reservations and flag the orders for reallocation (TC22).
      const pendingOrders = await txq<{ order_id: string }>(
        c,
        `SELECT DISTINCT l.order_id FROM order_line_allocations a JOIN order_lines l ON l.id=a.order_line_id
          WHERE a.batch_id=$1 AND a.status='ACTIVE' AND a.reserved_qty>0 AND a.shipped_qty=0`,
        [id],
      )
      for (const po of pendingOrders) {
        await releaseAllocations(c, po.order_id, 'NEEDS_REALLOCATION')
        await txq(c, `UPDATE orders SET needs_reallocation=true, updated_at=now() WHERE id=$1`, [po.order_id])
      }

      const recall = await txq<{ id: string }>(
        c,
        `INSERT INTO recalls (batch_id, reason, severity, created_by) VALUES ($1,$2,$3,$4) RETURNING id`,
        [id, body.reason, body.severity, s.sub],
      )
      const recallId = recall[0]!.id

      // 3) Enumerate shipped allocations only (TC21): orders that never received this batch
      //    must not be listed, even if they received other batches of the same product.
      const shipped = await txq<{ order_id: string; customer_id: string; status: string; qty: number }>(
        c,
        `SELECT l.order_id, o.customer_id, o.status, SUM(a.shipped_qty) AS qty
           FROM order_line_allocations a JOIN order_lines l ON l.id=a.order_line_id
           JOIN orders o ON o.id=l.order_id
          WHERE a.batch_id=$1 AND a.shipped_qty > 0
          GROUP BY l.order_id, o.customer_id, o.status`,
        [id],
      )
      for (const sh of shipped) {
        const stage = sh.status === 'SHIPPING' ? 'SHIPPING' : 'DELIVERED'
        await txq(
          c,
          `INSERT INTO recall_contacts (recall_id, order_id, customer_id, stage, affected_qty)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT (recall_id, order_id) DO NOTHING`,
          [recallId, sh.order_id, sh.customer_id, stage, sh.qty],
        )
      }
      await audit(c, s.sub, 'batch.recalled', 'batch', id, body.reason, { status: b[0]!.safety_status }, { status: 'RECALLED' })
      return {
        id: recallId,
        released_pending_orders: pendingOrders.length,
        shipped_orders: shipped.length,
      }
    })
    return reply.code(201).send(out)
  })

  app.get('/admin/recalls/:id', async (req) => {
    await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const recall = await one<Record<string, unknown>>(
      `SELECT r.*, b.code AS batch_code, b.expiry_date, p.name AS product_name
         FROM recalls r JOIN batches b ON b.id=r.batch_id JOIN products p ON p.id=b.product_id WHERE r.id=$1`,
      [id],
    )
    if (!recall) throw errors.notFound('đợt thu hồi')
    const contacts = await q(
      `SELECT rc.*, o.code AS order_code, u.email AS customer_email, cp.name AS customer_name, cp.phone AS customer_phone
         FROM recall_contacts rc JOIN orders o ON o.id=rc.order_id JOIN users u ON u.id=rc.customer_id
         LEFT JOIN customer_profiles cp ON cp.user_id=u.id
        WHERE rc.recall_id=$1 ORDER BY rc.stage, o.placed_at`,
      [id],
    )
    const pendingOrders = await q(
      `SELECT DISTINCT o.id, o.code, o.status, o.total_vnd, u.email AS customer_email
         FROM order_line_allocations a JOIN order_lines l ON l.id=a.order_line_id
         JOIN orders o ON o.id=l.order_id JOIN users u ON u.id=o.customer_id
        WHERE a.batch_id=$1 AND o.needs_reallocation=true`,
      [recall.batch_id],
    )
    const inventory = await q(`SELECT warehouse_id, on_hand_qty, reserved_qty, (on_hand_qty-reserved_qty) AS available FROM inventory WHERE batch_id=$1`, [recall.batch_id])
    return { ...recall, contacts, pending_orders: pendingOrders, inventory }
  })

  app.post('/admin/recalls/:id/contacts/:contactId', async (req) => {
    const s = await requireAdmin(req)
    const { id, contactId } = parse(z.object({ id: z.string().uuid(), contactId: z.string().uuid() }), req.params)
    const body = parse(
      z.object({ contact_status: z.enum(['PENDING', 'CONTACTED', 'RESOLVED', 'REFUNDED']), note: z.string().trim().max(300).default('') }),
      req.body,
    )
    await tx(async (c) => {
      await txq(
        c,
        `UPDATE recall_contacts SET contact_status=$3, note=$4, handled_at=now() WHERE id=$1 AND recall_id=$2`,
        [contactId, id, body.contact_status, body.note],
      )
      await audit(c, s.sub, 'recall.contact', 'recall', id, body.note, null, { contact_status: body.contact_status })
    })
    return { ok: true }
  })

  app.post('/admin/recalls/:id/close', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(z.object({ summary: z.string().trim().min(5, 'Nhập biên bản kết thúc').max(1000) }), req.body)
    await tx(async (c) => {
      // Closing the recall never re-enables selling (ADM-04 rule).
      await txq(c, `UPDATE recalls SET status='CLOSED', closed_at=now(), summary=$2 WHERE id=$1 AND status='OPEN'`, [id, body.summary])
      await audit(c, s.sub, 'recall.closed', 'recall', id, body.summary)
    })
    return { ok: true }
  })

  // ================= ADM-06 QR listing =================
  app.get('/admin/qr-codes', async (req) => {
    await requireAdmin(req)
    return q(
      `SELECT q.id, q.token, q.status, q.created_at, b.id AS batch_id, b.code AS batch_code,
              b.publication_status, b.safety_status, p.name AS product_name,
              (SELECT COUNT(*)::int FROM qr_scans s WHERE s.qr_id=q.id) AS scan_count,
              (SELECT max(scanned_at) FROM qr_scans s WHERE s.qr_id=q.id) AS last_scan
         FROM qr_codes q JOIN batches b ON b.id=q.batch_id JOIN products p ON p.id=b.product_id
        ORDER BY q.created_at DESC`,
    )
  })

  app.post('/admin/qr-codes/:id/regenerate', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    await tx(async (c) => {
      const row = await txq<{ batch_id: string }>(c, `SELECT batch_id FROM qr_codes WHERE id=$1`, [id])
      if (row.length === 0) throw errors.notFound('mã QR')
      await txq(c, `UPDATE qr_codes SET token=$2 WHERE id=$1`, [id, randomBytes(24).toString('base64url')])
      await audit(c, s.sub, 'qr.regenerated', 'batch', row[0]!.batch_id, 'Tạo lại token QR')
    })
    return { ok: true }
  })

  // ================= ADM-05/04 corrections with audit =================
  app.post('/admin/batches/:id/corrections', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({
        field: z.enum(['storage_condition', 'notes', 'harvest_date', 'pack_date', 'expiry_date']),
        value: z.string().trim().min(1).max(300),
        reason: z.string().trim().min(5, 'Ghi lý do điều chỉnh dữ liệu công bố').max(300),
      }),
      req.body,
    )
    await tx(async (c) => {
      const before = await txq<Record<string, unknown>>(c, `SELECT * FROM batches WHERE id=$1 FOR UPDATE`, [id])
      if (before.length === 0) throw errors.notFound('lô hàng')
      if (before[0]!.publication_status !== 'PUBLISHED') {
        throw new AppError(422, 'INVALID_DATA', 'Chỉ cần điều chỉnh có lưu vết cho lô đã công khai.')
      }
      const allowed = ['storage_condition', 'notes', 'harvest_date', 'pack_date', 'expiry_date'] as const
      if (!allowed.includes(body.field)) throw errors.invalid('Trường không được điều chỉnh.')
      await txq(c, `UPDATE batches SET ${body.field} = $2 WHERE id = $1`, [id, body.value])
      await batchEvent(c, id, 'CORRECTION', 'Điều chỉnh dữ liệu công bố', body.reason, s.sub, {
        field: body.field,
        before: before[0]![body.field],
        after: body.value,
      })
      await audit(c, s.sub, 'batch.corrected', 'batch', id, body.reason, { [body.field]: before[0]![body.field] }, { [body.field]: body.value })
    })
    return { ok: true }
  })

  // ================= Service area (Hưng Yên wards) =================
  app.get('/admin/service-area/wards', async (req) => {
    await requireAdmin(req)
    const f = parse(
      z.object({ q: z.string().trim().max(80).optional(), only_disabled: z.coerce.boolean().default(false) }),
      req.query ?? {},
    )
    const rows = await q(
      `SELECT w.code, w.name, w.type, w.in_service_area, w.disabled_at, w.dataset_version,
              (SELECT COUNT(*)::int FROM orders o
                WHERE o.address_snapshot->>'ward_code' = w.code
                  AND o.status NOT IN ('DELIVERED','COMPLETED','CANCELLED','DELIVERY_FAILED')) AS open_orders,
              (SELECT COUNT(*)::int FROM addresses a
                WHERE a.ward_code = w.code AND a.deleted_at IS NULL) AS saved_addresses
         FROM wards w
        WHERE w.province_code = '33'
          AND ($1::text IS NULL OR w.search_text LIKE '%' || $1 || '%')
          AND (NOT $2::boolean OR NOT w.in_service_area)
        ORDER BY w.type DESC, w.name`,
      [f.q ? normalizeVi(f.q) : null, f.only_disabled],
    )
    const active = await one<{ n: number }>(`SELECT COUNT(*)::int AS n FROM wards WHERE in_service_area`)
    return { data: rows, active_count: active?.n ?? 0, total: rows.length }
  })

  app.patch('/admin/service-area/wards/:code', async (req) => {
    const s = await requireAdmin(req)
    const { code } = parse(z.object({ code: z.string().regex(/^\d{4,5}$/) }), req.params)
    const body = parse(z.object({ in_service_area: z.boolean(), reason: z.string().trim().max(200).default('') }), req.body)
    await tx(async (c) => {
      const ward = await txq<{ name: string; in_service_area: boolean }>(
        c,
        `SELECT name, in_service_area FROM wards WHERE code = $1 FOR UPDATE`,
        [code],
      )
      if (ward.length === 0) throw errors.notFound('xã/phường')
      if (!body.in_service_area) {
        // Never let the province be switched off by accident.
        const active = await txq<{ n: number }>(c, `SELECT COUNT(*)::int AS n FROM wards WHERE in_service_area`)
        if ((active[0]?.n ?? 0) <= 1) {
          throw errors.conflict('SERVICE_AREA_LAST_WARD', 'Không thể tắt xã/phường phục vụ cuối cùng.')
        }
      }
      if (ward[0]!.in_service_area === body.in_service_area) return
      await txq(
        c,
        `UPDATE wards SET in_service_area = $2, disabled_at = CASE WHEN $2 THEN NULL ELSE now() END,
                          -- $3 lands untyped inside CASE, so the uuid column needs an explicit cast.
                          disabled_by = CASE WHEN $2 THEN NULL ELSE $3::uuid END, updated_at = now()
          WHERE code = $1`,
        [code, body.in_service_area, s.sub],
      )
      await audit(c, s.sub, body.in_service_area ? 'service_area.enabled' : 'service_area.disabled',
        'ward', code, body.reason, { in_service_area: ward[0]!.in_service_area }, { in_service_area: body.in_service_area })
    })
    return { ok: true }
  })

  // ================= Settings (P2 switches) =================
  app.get('/admin/settings', async (req) => {
    await requireAdmin(req)
    return q(`SELECT key, value FROM settings`)
  })

  app.patch('/admin/settings', async (req) => {
    const s = await requireAdmin(req)
    // Two operational knobs only: allocation strategy, and the low-stock threshold the
    // warehouse screen counts against. Anything else needs a real consumer first.
    const body = parse(
      z.discriminatedUnion('key', [
        z.object({ key: z.literal('allocation_strategy'), value: z.enum(['FIFO', 'FEFO']) }),
        z.object({ key: z.literal('low_stock_threshold'), value: z.string().trim().regex(/^\d{1,4}$/, 'Ngưỡng phải là số 0–9999') }),
      ]),
      req.body,
    )
    await tx(async (c) => {
      await txq(c, `INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2`, [body.key, body.value])
      await audit(c, s.sub, 'settings.updated', 'settings', body.key, '', null, { value: body.value })
    })
    return { ok: true }
  })
}
