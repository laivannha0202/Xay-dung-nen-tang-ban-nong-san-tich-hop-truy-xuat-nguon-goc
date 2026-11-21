import { createHash } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { one, q, tx, txq } from '../db.js'
import { parse, pagination } from '../lib/validate.js'
import { requireCustomer, requireUser } from '../lib/auth.js'
import { AppError, errors } from '../lib/errors.js'
import { SELLABLE_SQL, quantityAllowed, roundQty } from '../services/invariants.js'
import { PROVINCE, requireServiceableWard, serviceAreaSummary } from '../services/serviceArea.js'
import { FREE_SHIP_THRESHOLD_VND } from '../services/pricing.js'
import {
  allocateAndReserve,
  audit,
  buildQuote,
  nextOrderCode,
  quoteVersion,
  releaseAllocations,
  shipFeeFor,
} from '../services/pricing.js'

/**
 * Address input: the client only picks a ward *code*; names come from `wards`,
 * so a tampered payload cannot smuggle an out-of-province or disabled ward.
 * `district` is legacy-only (kept for historical snapshots).
 */
const addressSchema = z.object({
  recipient_name: z.string().trim().min(2, 'Vui lòng nhập tên người nhận').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{8,10}$/, 'Số điện thoại không hợp lệ (VD: 0901234567)'),
  ward_code: z.string().trim().regex(/^\d{4,5}$/, 'Vui lòng chọn xã/phường'),
  street_detail: z.string().trim().min(3, 'Vui lòng nhập địa chỉ chi tiết').max(200),
  is_default: z.boolean().optional(),
})

async function cartPayload(customerId: string) {
  const rows = await q<{
    product_id: string; quantity: number; sku: string; name: string; slug: string; unit: string
    base_price_vnd: number; status: string; image: string | null
    available: number; is_available: boolean
  }>(
    `SELECT ci.product_id, ci.quantity, p.sku, p.name, p.slug, p.unit, p.base_price_vnd, p.status,
            (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image,
            COALESCE(s.available, 0) AS available,
            (p.status = 'ACTIVE' AND COALESCE(s.available,0) > 0) AS is_available
       FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN LATERAL (
         SELECT SUM(i.on_hand_qty - i.reserved_qty) AS available
           FROM inventory i JOIN batches b ON b.id = i.batch_id
          WHERE b.product_id = p.id AND ${SELLABLE_SQL}
       ) s ON true
      WHERE c.customer_id = $1
      ORDER BY ci.product_id`,
    [customerId],
  )
  const subtotal = rows.reduce((s, r) => s + Math.round(r.quantity * r.base_price_vnd), 0)
  const shipFee = shipFeeFor(subtotal)
  return {
    items: rows.map((r) => ({ ...r, line_total_vnd: Math.round(r.quantity * r.base_price_vnd) })),
    subtotal_vnd: subtotal,
    ship_fee_estimate_vnd: shipFee,
    total_estimate_vnd: subtotal + shipFee,
    free_ship_threshold_vnd: FREE_SHIP_THRESHOLD_VND,
    service_area: await serviceAreaSummary(),
    item_count: rows.length,
  }
}

export async function customerRoutes(app: FastifyInstance) {
  // ---------------- addresses ----------------
  app.get('/me/addresses', async (req) => {
    const s = await requireUser(req)
    return q(
      `SELECT a.*, (a.ward_code IS NULL) AS needs_confirmation,
              w.name AS ward_name, w.type AS ward_type, w.in_service_area
         FROM addresses a LEFT JOIN wards w ON w.code = a.ward_code
        WHERE a.user_id = $1 AND a.deleted_at IS NULL
        ORDER BY a.is_default DESC, a.created_at DESC`,
      [s.sub],
    )
  })

  app.post('/me/addresses', async (req, reply) => {
    const s = await requireCustomer(req)
    const body = parse(addressSchema, req.body)
    const id = await tx(async (c) => {
      const ward = await requireServiceableWard(c, body.ward_code)
      if (body.is_default) {
        await txq(c, `UPDATE addresses SET is_default = false WHERE user_id = $1`, [s.sub])
      }
      const count = await txq<{ n: number }>(
        c,
        `SELECT COUNT(*)::int AS n FROM addresses WHERE user_id = $1 AND deleted_at IS NULL`,
        [s.sub],
      )
      const makeDefault = body.is_default || count[0]!.n === 0
      const row = await txq<{ id: string }>(
        c,
        `INSERT INTO addresses (user_id, recipient_name, phone, province, district,
                                province_code, ward_code, ward, street_detail, is_default)
         VALUES ($1,$2,$3,$4,NULL,$5,$6,$7,$8,$9) RETURNING id`,
        [s.sub, body.recipient_name, body.phone, PROVINCE.name, PROVINCE.code,
         ward.code, ward.name, body.street_detail, makeDefault],
      )
      return row[0]!.id
    })
    return reply.code(201).send({ id })
  })

  app.patch('/me/addresses/:id', async (req) => {
    const s = await requireCustomer(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(addressSchema.partial(), req.body)
    await tx(async (c) => {
      const owned = await txq(c, `SELECT id FROM addresses WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`, [id, s.sub])
      if (owned.length === 0) throw errors.notFound('địa chỉ')
      // Re-picking a ward is the way a legacy address becomes valid again.
      const ward = body.ward_code ? await requireServiceableWard(c, body.ward_code) : null
      if (body.is_default) await txq(c, `UPDATE addresses SET is_default = false WHERE user_id = $1`, [s.sub])
      await txq(
        c,
        `UPDATE addresses SET
           recipient_name = COALESCE($3, recipient_name),
           phone = COALESCE($4, phone),
           province_code = COALESCE($5, province_code),
           province = COALESCE($6, province),
           ward_code = COALESCE($7, ward_code),
           ward = COALESCE($8, ward),
           street_detail = COALESCE($9, street_detail),
           is_default = COALESCE($10, is_default),
           needs_confirmation = CASE WHEN $7::text IS NULL THEN needs_confirmation ELSE false END
         WHERE id = $1 AND user_id = $2`,
        [id, s.sub, body.recipient_name ?? null, body.phone ?? null,
         ward ? PROVINCE.code : null, ward ? PROVINCE.name : null,
         ward?.code ?? null, ward?.name ?? null,
         body.street_detail ?? null, body.is_default ?? null],
      )
    })
    return { ok: true }
  })

  app.delete('/me/addresses/:id', async (req) => {
    const s = await requireCustomer(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    await tx(async (c) => {
      const rows = await txq<{ is_default: boolean }>(
        c,
        `UPDATE addresses SET deleted_at = now(), is_default = false
          WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING is_default`,
        [id, s.sub],
      )
      if (rows.length === 0) throw errors.notFound('địa chỉ')
      if (rows[0]!.is_default) {
        await txq(
          c,
          `UPDATE addresses SET is_default = true
            WHERE id = (SELECT id FROM addresses WHERE user_id = $1 AND deleted_at IS NULL
                         ORDER BY created_at DESC LIMIT 1)`,
          [s.sub],
        )
      }
    })
    return { ok: true }
  })

  // ---------------- cart (server-side, shared web↔app) ----------------
  app.get('/me/cart', async (req) => {
    const s = await requireCustomer(req)
    return cartPayload(s.sub)
  })

  app.put('/me/cart/items/:productId', async (req) => {
    const s = await requireCustomer(req)
    const { productId } = parse(z.object({ productId: z.string().uuid() }), req.params)
    const body = parse(z.object({ quantity: z.coerce.number().nonnegative().max(100000) }), req.body)
    await tx(async (c) => {
      const product = await txq<{ id: string; status: string; name: string; unit: string }>(
        c,
        `SELECT id, status, name, unit FROM products WHERE id = $1`,
        [productId],
      )
      if (product.length === 0) throw errors.notFound('sản phẩm')
      if (product[0]!.status !== 'ACTIVE') {
        throw errors.conflict('PRODUCT_UNAVAILABLE', `Sản phẩm "${product[0]!.name}" đã ngừng kinh doanh.`)
      }
      if (body.quantity > 0 && !quantityAllowed(product[0]!.unit, body.quantity)) {
        throw errors.invalid(`Số lượng "${product[0]!.name}" phải là số nguyên theo ${product[0]!.unit}.`)
      }
      const cart = await txq<{ id: string }>(
        c,
        `INSERT INTO carts (customer_id) VALUES ($1) ON CONFLICT (customer_id) DO UPDATE SET updated_at = now()
         RETURNING id`,
        [s.sub],
      )
      const cartId = cart[0]!.id
      const qty = roundQty(body.quantity)
      if (qty === 0) {
        await txq(c, `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`, [cartId, productId])
      } else {
        await txq(
          c,
          `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1,$2,$3)
           ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = $3`,
          [cartId, productId, qty],
        )
      }
      await txq(c, `UPDATE carts SET version = version + 1, updated_at = now() WHERE id = $1`, [cartId])
    })
    return cartPayload(s.sub)
  })

  app.delete('/me/cart', async (req) => {
    const s = await requireCustomer(req)
    await q(`DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE customer_id = $1)`, [s.sub])
    return cartPayload(s.sub)
  })

  // ---------------- checkout ----------------
  app.post('/checkout/preview', async (req) => {
    const s = await requireCustomer(req)
    const body = parse(
      z.object({
        items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().positive().max(100000) })).optional(),
        promotion_code: z.string().trim().max(64).nullish(),
        address_id: z.string().uuid().nullish(),
      }),
      req.body ?? {},
    )
    // Shipping is only quoted for a real, still-serviceable Hưng Yên address.
    let addressStatus: 'MISSING' | 'OUTSIDE_SERVICE_AREA' | 'NEEDS_UPDATE' | 'OK' = 'MISSING'
    let wardName: string | null = null
    if (body.address_id) {
      const addr = await one<{ ward_code: string | null; needs_confirmation: boolean }>(
        `SELECT ward_code, needs_confirmation FROM addresses
          WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [body.address_id, s.sub],
      )
      if (!addr) throw errors.notFound('địa chỉ giao hàng')
      try {
        const ward = await requireServiceableWard(null, addr.ward_code)
        wardName = ward.name
        addressStatus = 'OK'
      } catch {
        addressStatus = addr.ward_code ? 'OUTSIDE_SERVICE_AREA' : 'NEEDS_UPDATE'
      }
    }
    const items = body.items ?? (await q<{ product_id: string; quantity: number }>(
      `SELECT ci.product_id, ci.quantity FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE c.customer_id = $1`,
      [s.sub],
    ))
    if (items.length === 0) throw errors.invalid('Giỏ hàng trống.')
    const quote = await tx((c) => buildQuote(c, items, body.promotion_code ?? null))
    const promotions = await q(
      `SELECT code, name, type, value, min_subtotal_vnd, end_at FROM promotions
        WHERE status='ACTIVE' AND now() BETWEEN start_at AND end_at AND (usage_limit IS NULL OR used_count < usage_limit)
        ORDER BY end_at ASC LIMIT 10`,
    )
    return {
      ...quote,
      ship_fee_final: addressStatus === 'OK',
      address_status: addressStatus,
      ward_name: wardName,
      service_area: await serviceAreaSummary(),
      available_promotions: promotions,
    }
  })

  app.post('/orders', async (req, reply) => {
    const s = await requireCustomer(req)
    const body = parse(
      z.object({
        address_id: z.string().uuid('Vui lòng chọn địa chỉ giao hàng'),
        payment_method: z.enum(['COD', 'BANK_TRANSFER']),
        promotion_code: z.string().trim().max(64).nullish(),
        quote_version: z.string().min(1, 'Thiếu thông tin xác nhận giá'),
        items: z
          .array(z.object({ product_id: z.string().uuid(), quantity: z.number().positive().max(100000) }))
          .optional(),
        note: z.string().trim().max(500).optional(),
      }),
      req.body,
    )
    const idemKey = (req.headers['idempotency-key'] as string | undefined)?.trim()
    if (!idemKey) throw errors.invalid('Thiếu Idempotency-Key.')

    // Replay of the same key returns the same order (TC13/TC18).
    const existing = await one<{ order_id: string | null; request_hash: string }>(
      `SELECT order_id, request_hash FROM idempotency_records WHERE customer_id = $1 AND key = $2`,
      [s.sub, idemKey],
    )
    const reqHash = createHash('sha256')
      .update(JSON.stringify({ a: body.address_id, p: body.payment_method, c: body.promotion_code ?? null, i: body.items ?? [] }))
      .digest('hex')
    if (existing) {
      if (existing.request_hash !== reqHash) {
        throw new AppError(409, 'IDEMPOTENCY_MISMATCH', 'Yêu cầu trùng mã nhưng nội dung khác.')
      }
      if (existing.order_id) {
        return reply.code(200).send({ order_id: existing.order_id, idempotent: true })
      }
      throw new AppError(409, 'IN_PROGRESS', 'Đơn hàng đang được xử lý, vui lòng chờ.')
    }

    const result = await tx(async (c) => {
      const addr = await txq<Record<string, string> & { ward_code: string | null; needs_confirmation: boolean }>(
        c,
        `SELECT recipient_name, phone, province, district, ward, street_detail, ward_code, needs_confirmation
           FROM addresses WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [body.address_id, s.sub],
      )
      if (addr.length === 0) throw errors.notFound('địa chỉ giao hàng')
      const a = addr[0]!
      // Re-checked inside the order transaction: a ward can be switched off between
      // preview and submit, and that must never produce a deliverable order.
      const ward = await requireServiceableWard(c, a.ward_code)

      const items = body.items ?? await txq<{ product_id: string; quantity: number }>(
        c,
        `SELECT ci.product_id, ci.quantity FROM cart_items ci JOIN carts c2 ON c2.id = ci.cart_id WHERE c2.customer_id = $1
         ORDER BY ci.product_id`,
        [s.sub],
      )
      if (items.length === 0) throw errors.invalid('Giỏ hàng trống.')

      // Lock order is deterministic (adapters sorted) so concurrent checkouts cannot deadlock.
      const sorted = [...items].sort((x, y) => x.product_id.localeCompare(y.product_id))
      const quote = await buildQuote(c, sorted, body.promotion_code ?? null)
      if (quote.version !== body.quote_version) {
        throw errors.priceChanged(quote)
      }

      await txq(c, `INSERT INTO idempotency_records (customer_id, key, request_hash) VALUES ($1,$2,$3)`, [
        s.sub, idemKey, reqHash,
      ])

      const code = await nextOrderCode(c)
      const order = await txq<{ id: string }>(
        c,
        `INSERT INTO orders (code, customer_id, payment_method, address_snapshot, subtotal_vnd, discount_vnd,
                             ship_fee_vnd, total_vnd, promotion_id, promotion_snapshot)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [
          code, s.sub, body.payment_method,
          JSON.stringify({
            ...a,
            province: PROVINCE.name,
            province_code: PROVINCE.code,
            ward: ward.name,
            ward_code: ward.code,
            note: body.note ?? '',
          }),
          quote.subtotal_vnd, quote.promotion_discount_vnd, quote.ship_fee_vnd, quote.total_vnd,
          quote.promotion?.id ?? null,
          quote.promotion ? JSON.stringify({ ...quote.promotion, discount_vnd: quote.promotion_discount_vnd }) : null,
        ],
      )
      const orderId = order[0]!.id

      await allocateAndReserve(c, orderId, quote)

      await txq(
        c,
        `INSERT INTO payments (order_id, method, amount_vnd, status) VALUES ($1,$2,$3,'UNPAID')`,
        [orderId, body.payment_method, quote.total_vnd],
      )
      if (quote.promotion) {
        await txq(c, `UPDATE promotions SET used_count = used_count + 1 WHERE id = $1`, [quote.promotion.id])
      }
      await txq(c, `UPDATE idempotency_records SET order_id = $3 WHERE customer_id = $1 AND key = $2`, [
        s.sub, idemKey, orderId,
      ])
      await txq(c, `DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE customer_id = $1)`, [s.sub])
      await txq(c, `UPDATE carts SET version = version + 1, updated_at = now() WHERE customer_id = $1`, [s.sub])
      await audit(c, s.sub, 'order.created', 'order', orderId, '', null, { code, total: quote.total_vnd })
      return { order_id: orderId, code }
    })

    return reply.code(201).send({ ...result, status: 'PENDING', payment_status: 'UNPAID' })
  })

  app.get('/orders/by-request/:key', async (req) => {
    const s = await requireCustomer(req)
    const { key } = parse(z.object({ key: z.string().min(8) }), req.params)
    const row = await one<{ order_id: string | null }>(
      `SELECT order_id FROM idempotency_records WHERE customer_id = $1 AND key = $2`,
      [s.sub, key],
    )
    return { order_id: row?.order_id ?? null }
  })

  // ---------------- my orders ----------------
  async function loadOrder(customerId: string, orderId: string, isAdmin = false) {
    const orders = await q<Record<string, unknown>>(
      `SELECT o.*, c.recipient_name AS addr_recipient FROM orders o, jsonb_to_record(o.address_snapshot)
         AS c(recipient_name text) WHERE o.id = $1 ${isAdmin ? '' : 'AND o.customer_id = $2'}`,
      isAdmin ? [orderId] : [orderId, customerId],
    )
    const order = orders[0]
    if (!order) throw errors.notFound('đơn hàng')
    const lines = await q(
      `SELECT l.*, jsonb_agg(jsonb_build_object(
                'id', a.id, 'batch_code', b.code, 'batch_id', a.batch_id,
                'qr_token', (SELECT token FROM qr_codes WHERE batch_id = a.batch_id),
                'expiry_date', b.expiry_date, 'safety_status', b.safety_status,
                'reserved_qty', a.reserved_qty, 'shipped_qty', a.shipped_qty,
                'status', a.status, 'unit_price_vnd', a.unit_price_vnd, 'discount_vnd', a.discount_vnd,
                'image', (SELECT url FROM product_images WHERE product_id = l.product_id ORDER BY sort_order LIMIT 1)
              ) ORDER BY b.code) AS allocations,
              (SELECT jsonb_build_object('id', r.id, 'rating', r.rating, 'comment', r.comment, 'status', r.status)
                 FROM reviews r WHERE r.order_line_id = l.id AND r.customer_id = $2) AS review
         FROM order_lines l
         LEFT JOIN order_line_allocations a ON a.order_line_id = l.id
         LEFT JOIN batches b ON b.id = a.batch_id
        WHERE l.order_id = $1
        GROUP BY l.id`,
      [orderId, customerId],
    )
    // Same rule as the admin console: an order can hold several receipts, so the paid amount is
    // their sum and never one arbitrary row. The customer's "còn phải trả" reads from this.
    const payment = await one(
      `SELECT COALESCE(SUM(amount_vnd) FILTER (WHERE status='PAID'),0)::int AS paid_vnd,
              BOOL_OR(status='PAID') AS is_paid,
              MAX(paid_at) AS paid_at,
              (ARRAY_AGG(method ORDER BY paid_at DESC NULLS LAST, created_at DESC))[1] AS method,
              (ARRAY_AGG(reference ORDER BY paid_at DESC NULLS LAST, created_at DESC))[1] AS reference
         FROM payments WHERE order_id = $1`,
      [orderId],
    )
    const refunds = await q(`SELECT * FROM refund_requests WHERE order_id = $1 ORDER BY created_at DESC`, [orderId])
    const shipment = await one(`SELECT * FROM shipments WHERE order_id = $1`, [orderId])
    const shipped = lines.flatMap((l) => {
      const allocs = (l.allocations ?? []) as { shipped_qty: number; safety_status: string; batch_code: string }[]
      return allocs.filter((a) => a.shipped_qty > 0)
    })
    return {
      ...order,
      lines,
      payment,
      refunds,
      shipment,
      has_shipped: shipped.length > 0,
      recalled_batches: shipped.filter((a) => a.safety_status === 'RECALLED').map((a) => a.batch_code),
    }
  }

  app.get('/me/orders', async (req) => {
    const s = await requireCustomer(req)
    const { page, pageSize } = parse(pagination, req.query ?? {})
    const f = parse(
      z.object({ status: z.string().optional(), from: z.string().date().optional(), to: z.string().date().optional() }),
      req.query ?? {},
    )
    const where = ['o.customer_id = $1']
    const params: unknown[] = [s.sub]
    if (f.status) {
      params.push(f.status)
      where.push(`o.status = $${params.length}`)
    }
    if (f.from) {
      params.push(f.from)
      where.push(`o.placed_at >= $${params.length}::date`)
    }
    if (f.to) {
      params.push(f.to)
      where.push(`o.placed_at < ($${params.length}::date + 1)`)
    }
    const clause = where.join(' AND ')
    const rows = await q(
      `SELECT o.id, o.code, o.status, o.payment_status, o.payment_method, o.total_vnd, o.placed_at,
              (SELECT COUNT(*)::int FROM order_lines WHERE order_id = o.id) AS line_count,
              (SELECT jsonb_agg(jsonb_build_object('name', product_name, 'image',
                 (SELECT url FROM product_images WHERE product_id = order_lines.product_id ORDER BY sort_order LIMIT 1)))
                 FROM order_lines WHERE order_id = o.id) AS items
         FROM orders o
        WHERE ${clause}
        ORDER BY o.placed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, (page - 1) * pageSize],
    )
    const total = await one<{ n: number }>(`SELECT COUNT(*)::int AS n FROM orders o WHERE ${clause}`, params)
    return { data: rows, page, pageSize, total: total?.n ?? 0 }
  })

  app.get('/me/orders/:id', async (req) => {
    const s = await requireCustomer(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    return loadOrder(s.sub, id)
  })

  app.post('/me/orders/:id/cancel', async (req) => {
    const s = await requireCustomer(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(z.object({ reason: z.string().trim().min(3, 'Vui lòng nhập lý do hủy').max(300) }), req.body)

    return tx(async (c) => {
      const orders = await txq<{ id: string; status: string; payment_status: string; total_vnd: number }>(
        c,
        `SELECT id, status, payment_status, total_vnd FROM orders WHERE id = $1 AND customer_id = $2 FOR UPDATE`,
        [id, s.sub],
      )
      const order = orders[0]
      if (!order) throw errors.notFound('đơn hàng')
      if (order.status === 'CANCELLED') return { status: 'CANCELLED', already: true }
      if (order.status === 'SHIPPING' || order.status === 'DELIVERED' || order.status === 'COMPLETED') {
        throw new AppError(409, 'ORDER_NOT_CANCELLABLE', 'Đơn đã xuất kho, không thể hủy. Vui lòng gửi khiếu nại/đổi trả.')
      }
      const shipped = await txq<{ n: number }>(
        c,
        `SELECT COUNT(*)::int AS n FROM order_line_allocations a JOIN order_lines l ON l.id = a.order_line_id
          WHERE l.order_id = $1 AND a.shipped_qty > 0`,
        [id],
      )
      if ((shipped[0]?.n ?? 0) > 0) {
        throw new AppError(409, 'ORDER_NOT_CANCELLABLE', 'Đơn đã xuất kho, không thể hủy.')
      }
      const released = await releaseAllocations(c, id, 'CANCELLED')
      await txq(c, `UPDATE orders SET status='CANCELLED', cancel_reason=$2, updated_at=now() WHERE id=$1`, [id, body.reason])
      if (order.payment_status === 'PAID') {
        await txq(
          c,
          `INSERT INTO refund_requests (order_id, amount_vnd, reason, status) VALUES ($1,$2,$3,'PENDING')`,
          [id, order.total_vnd, `Hủy đơn: ${body.reason}`],
        )
      }
      await audit(c, s.sub, 'order.cancelled', 'order', id, body.reason, { status: order.status }, { status: 'CANCELLED' })
      return { status: 'CANCELLED', released_allocations: released }
    })
  })
  /**
   * "Buy again" from a past order. Prices, stock and product status are re-read now —
   * nothing from the old order is trusted — and only lines that can still be bought
   * are returned, each flagged with why it was kept or dropped.
   */
  app.get('/me/orders/:id/reorder', async (req) => {
    const s = await requireCustomer(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const owns = await one(`SELECT 1 FROM orders WHERE id=$1 AND customer_id=$2`, [id, s.sub])
    if (!owns) throw errors.notFound('đơn hàng')
    const lines = await q<{
      product_id: string; product_name: string; slug: string | null; sku: string; unit: string
      quantity: number; base_price_vnd: number | null; status: string | null; image: string | null; available: number
    }>(
      `SELECT l.product_id, l.product_name, p.slug, l.sku, l.unit, l.quantity,
              p.base_price_vnd, p.status,
              (SELECT url FROM product_images WHERE product_id = l.product_id ORDER BY sort_order LIMIT 1) AS image,
              COALESCE((SELECT SUM(i.on_hand_qty - i.reserved_qty)
                          FROM inventory i JOIN batches b ON b.id = i.batch_id
                         WHERE b.product_id = l.product_id AND ${SELLABLE_SQL}), 0) AS available
         FROM order_lines l LEFT JOIN products p ON p.id = l.product_id
        WHERE l.order_id = $1 ORDER BY l.product_name`,
      [id],
    )
    const items = lines.map((l) => {
      const buyable = Math.min(Number(l.quantity), Number(l.available))
      const reason =
        l.status !== 'ACTIVE' ? 'Sản phẩm đã ngừng kinh doanh'
        : Number(l.available) <= 0 ? 'Tạm hết hàng'
        : buyable < Number(l.quantity) ? `Chỉ còn ${buyable}/${Number(l.quantity)} ${l.unit}`
        : null
      return { ...l, quantity: buyable, available: Number(l.available), unavailable_reason: reason }
    })
    return { items: items.filter((i) => i.quantity > 0), skipped: items.filter((i) => i.quantity <= 0) }
  })


  // ---------------- reviews ----------------
  app.post('/me/reviews', async (req, reply) => {
    const s = await requireCustomer(req)
    const body = parse(
      z.object({
        order_line_id: z.string().uuid(),
        rating: z.number().int().min(1, 'Chọn số sao từ 1 đến 5').max(5),
        comment: z.string().trim().max(1000).default(''),
      }),
      req.body,
    )
    const row = await one<{ order_status: string; product_id: string; customer_id: string }>(
      `SELECT o.status AS order_status, l.product_id, o.customer_id
         FROM order_lines l JOIN orders o ON o.id = l.order_id WHERE l.id = $1`,
      [body.order_line_id],
    )
    if (!row || row.customer_id !== s.sub) throw errors.notFound('dòng đơn hàng')
    if (!['DELIVERED', 'COMPLETED'].includes(row.order_status)) {
      throw new AppError(409, 'NOT_DELIVERED', 'Bạn chỉ có thể đánh giá sau khi đã nhận hàng.')
    }
    const dupe = await one(`SELECT 1 FROM reviews WHERE customer_id = $1 AND order_line_id = $2`, [s.sub, body.order_line_id])
    if (dupe) throw new AppError(409, 'ALREADY_REVIEWED', 'Bạn đã đánh giá dòng sản phẩm này.')
    const created = await one<{ id: string }>(
      `INSERT INTO reviews (customer_id, order_line_id, product_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [s.sub, body.order_line_id, row.product_id, body.rating, body.comment],
    )
    return reply.code(201).send({ id: created?.id })
  })

  app.get('/me/reviews', async (req) => {
    const s = await requireCustomer(req)
    return q(
      `SELECT r.id, r.rating, r.comment, r.status, r.created_at, l.product_name, o.code AS order_code
         FROM reviews r JOIN order_lines l ON l.id = r.order_line_id JOIN orders o ON o.id = l.order_id
        WHERE r.customer_id = $1 ORDER BY r.created_at DESC`,
      [s.sub],
    )
  })

  // ---------------- complaints ----------------
  app.post('/me/complaints', async (req, reply) => {
    const s = await requireCustomer(req)
    const body = parse(
      z.object({
        order_id: z.string().uuid().nullish(),
        order_line_id: z.string().uuid().nullish(),
        batch_id: z.string().uuid().nullish(),
        type: z.enum(['QUALITY', 'DAMAGED', 'WRONG_ITEM', 'SUSPECTED_FAKE', 'OTHER']),
        description: z.string().trim().min(10, 'Vui lòng mô tả vấn đề (tối thiểu 10 ký tự)').max(2000),
        // Only files this customer uploaded may be attached; `mime` is re-read from the
        // stored row so a crafted request cannot label an image as something else.
        files: z.array(z.object({ url: z.string().min(1) })).max(5).optional(),
      }),
      req.body,
    )
    const code = await tx(async (c) => {
      if (body.order_id) {
        const owned = await txq(c, `SELECT id FROM orders WHERE id = $1 AND customer_id = $2`, [body.order_id, s.sub])
        if (owned.length === 0) throw errors.notFound('đơn hàng')
      }
      if (body.order_line_id) {
        const ownedLine = await txq(
          c,
          `SELECT 1 FROM order_lines l JOIN orders o ON o.id = l.order_id WHERE l.id = $1 AND o.customer_id = $2`,
          [body.order_line_id, s.sub],
        )
        if (ownedLine.length === 0) throw errors.notFound('dòng đơn hàng')
      }
      if (body.batch_id) {
        const b = await txq(c, `SELECT 1 FROM batches WHERE id = $1`, [body.batch_id])
        if (b.length === 0) throw errors.notFound('lô hàng')
      }
      // Same atomic counter as orders; the seed still carries the legacy KN-2026-0001.
      const seq = await txq<{ n: number }>(
        c,
        `INSERT INTO code_sequences (kind, year, last_value) VALUES ('complaint', $1, 1)
         ON CONFLICT (kind, year) DO UPDATE SET last_value = code_sequences.last_value + 1
         RETURNING last_value AS n`,
        [new Date().getFullYear()],
      )
      const ccode = `KN-${new Date().getFullYear()}-${String(seq[0]!.n).padStart(4, '0')}`
      const created = await txq<{ id: string }>(
        c,
        `INSERT INTO complaints (code, customer_id, order_id, order_line_id, batch_id, type, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [ccode, s.sub, body.order_id ?? null, body.order_line_id ?? null, body.batch_id ?? null, body.type, body.description],
      )
      for (const f of body.files ?? []) {
        const owned = await txq<{ mime: string }>(
          c,
          `SELECT mime FROM evidence_files WHERE url = $1 AND owner_type = 'UPLOAD' AND owner_id = $2 LIMIT 1`,
          [f.url, s.sub],
        )
        if (owned.length === 0) throw errors.invalid('Tệp đính kèm không hợp lệ. Vui lòng tải lại ảnh.')
        await txq(c, `INSERT INTO complaint_files (complaint_id, url, mime) VALUES ($1,$2,$3)`,
          [created[0]!.id, f.url, owned[0]!.mime])
      }
      await audit(c, s.sub, 'complaint.created', 'complaint', created[0]!.id, '', null, { code: ccode })
      return ccode
    })
    return reply.code(201).send({ code })
  })

  app.get('/me/complaints', async (req) => {
    const s = await requireCustomer(req)
    return q(
      `SELECT c.id, c.code, c.type, c.status, c.created_at, b.code AS batch_code, o.code AS order_code,
              (SELECT COUNT(*)::int FROM complaint_messages WHERE complaint_id = c.id) AS message_count
         FROM complaints c LEFT JOIN batches b ON b.id = c.batch_id LEFT JOIN orders o ON o.id = c.order_id
        WHERE c.customer_id = $1 ORDER BY c.created_at DESC`,
      [s.sub],
    )
  })

  app.get('/me/complaints/:id', async (req) => {
    const s = await requireCustomer(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const c = await one<Record<string, unknown>>(
      `SELECT c.*, b.code AS batch_code, o.code AS order_code FROM complaints c
         LEFT JOIN batches b ON b.id = c.batch_id LEFT JOIN orders o ON o.id = c.order_id
        WHERE c.id = $1 AND c.customer_id = $2`,
      [id, s.sub],
    )
    if (!c) throw errors.notFound('khiếu nại')
    const messages = await q(
      `SELECT m.id, m.content, m.actor_role, m.created_at, COALESCE(p.name, u.email) AS actor_name
         FROM complaint_messages m JOIN users u ON u.id = m.actor_id
         LEFT JOIN customer_profiles p ON p.user_id = u.id
        WHERE m.complaint_id = $1 ORDER BY m.created_at`,
      [id],
    )
    const files = await q(`SELECT id, url, mime FROM complaint_files WHERE complaint_id = $1`, [id])
    return { ...c, messages, files }
  })

  app.post('/me/complaints/:id/messages', async (req, reply) => {
    const s = await requireCustomer(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(z.object({ content: z.string().trim().min(1).max(2000) }), req.body)
    const owned = await one(`SELECT status FROM complaints WHERE id = $1 AND customer_id = $2`, [id, s.sub])
    if (!owned) throw errors.notFound('khiếu nại')
    if (owned.status === 'CLOSED') throw new AppError(409, 'COMPLAINT_CLOSED', 'Khiếu nại đã đóng.')
    await q(
      `INSERT INTO complaint_messages (complaint_id, actor_id, actor_role, content) VALUES ($1,$2,'CUSTOMER',$3)`,
      [id, s.sub, body.content],
    )
    await q(`UPDATE complaints SET updated_at = now() WHERE id = $1`, [id])
    return reply.code(201).send({ ok: true })
  })
}
