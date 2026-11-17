import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { one, q, tx, txq } from '../db.js'
import { parse, pagination } from '../lib/validate.js'
import { requireAdmin } from '../lib/auth.js'
import { AppError, errors } from '../lib/errors.js'
import { SELLABLE_SQL, SHIPPABLE_SQL, TODAY, roundQty, todayVN } from '../services/invariants.js'
import { audit, batchEvent, buildQuote, releaseAllocations } from '../services/pricing.js'
import { config } from '../config.js'
import { renderLabelPdf } from '../services/tracePdf.js'

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có dạng YYYY-MM-DD')

export async function adminRoutes(app: FastifyInstance) {
  // ================= ADM-01 Dashboard =================
  app.get('/admin/dashboard', async (req) => {
    await requireAdmin(req)
    const range = parse(
      z.object({ from: dateOnly.optional(), to: dateOnly.optional() }).default({}),
      req.query ?? {},
    )
    const params: unknown[] = []
    let rangeSql = ''
    if (range.from) {
      params.push(range.from)
      rangeSql += ` AND o.placed_at >= $${params.length}::date`
    }
    if (range.to) {
      params.push(range.to)
      rangeSql += ` AND o.placed_at < ($${params.length}::date + interval '1 day')`
    }

    const revenue = await one<{ gross: number; refunded: number; net: number }>(
      `SELECT
         COALESCE((SELECT SUM(p.amount_vnd) FROM payments p JOIN orders o ON o.id=p.order_id
                   WHERE p.status='PAID' ${rangeSql}),0)::int AS gross,
         COALESCE((SELECT SUM(r.amount_vnd) FROM refund_requests r JOIN orders o ON o.id=r.order_id
                    WHERE r.status='COMPLETED' ${rangeSql}),0)::int AS refunded,
         0::int AS net`,
      params,
    )
    const net = (revenue?.gross ?? 0) - (revenue?.refunded ?? 0)

    const orders = await one(
      `SELECT
         COUNT(*) FILTER (WHERE status='PENDING')::int AS pending,
         COUNT(*) FILTER (WHERE status IN ('CONFIRMED','PREPARING'))::int AS processing,
         COUNT(*) FILTER (WHERE status='SHIPPING')::int AS shipping,
         COUNT(*) FILTER (WHERE status IN ('DELIVERED','COMPLETED'))::int AS delivered,
         COUNT(*)::int AS total
       FROM orders o WHERE true ${rangeSql}`,
      params,
    )
    const batches = await one(
      `SELECT
         COUNT(*) FILTER (WHERE publication_status='PUBLISHED')::int AS published,
         COUNT(*) FILTER (WHERE quality_status='PENDING')::int AS pending_quality,
         COUNT(*) FILTER (WHERE quality_status='FAIL')::int AS failed,
         COUNT(*) FILTER (WHERE safety_status='HOLD')::int AS on_hold,
         COUNT(*) FILTER (WHERE safety_status='RECALLED')::int AS recalled,
         COUNT(*) FILTER (WHERE expiry_date < ${TODAY})::int AS expired,
         COUNT(*) FILTER (WHERE expiry_date >= ${TODAY} AND expiry_date <= ${TODAY} + 7)::int AS near_expiry
       FROM batches b`,
    )
    const alerts = await q(
      `(SELECT 'ORDER' AS kind, o.id::text AS id, o.code AS label, 'Đơn chờ xác nhận' AS detail, o.placed_at AS at
          FROM orders o WHERE o.status='PENDING' ORDER BY o.placed_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'LAB_FAIL', b.id::text, b.code, 'Phiếu kiểm nghiệm không đạt', b.created_at
          FROM batches b WHERE b.quality_status='FAIL' ORDER BY b.created_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'COMPLAINT', c.id::text, c.code, 'Khiếu nại mới', c.created_at
          FROM complaints c WHERE c.status='NEW' ORDER BY c.created_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'RECALL', r.id::text, bt.code, 'Lô đang thu hồi', r.started_at
          FROM recalls r JOIN batches bt ON bt.id=r.batch_id WHERE r.status='OPEN' ORDER BY r.started_at DESC LIMIT 5)
       ORDER BY at DESC LIMIT 20`,
    )
    const complaints = await one(
      `SELECT COUNT(*) FILTER (WHERE status='NEW')::int AS new_count,
              COUNT(*) FILTER (WHERE status IN ('NEW','PROCESSING'))::int AS open_count FROM complaints`,
    )
    return {
      revenue: { gross: revenue?.gross ?? 0, refunded: revenue?.refunded ?? 0, net },
      orders,
      batches,
      complaints,
      alerts,
      range: { from: range.from ?? null, to: range.to ?? null },
    }
  })

  // ================= ADM-02 Categories & products =================
  app.get('/admin/categories', async (req) => {
    await requireAdmin(req)
    return q(
      `SELECT c.*, (SELECT COUNT(*)::int FROM products p WHERE p.category_id=c.id) AS product_count
         FROM categories c ORDER BY c.sort_order, c.name`,
    )
  })

  app.post('/admin/categories', async (req, reply) => {
    const s = await requireAdmin(req)
    const body = parse(
      z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(300).default(''), sort_order: z.number().int().default(0) }),
      req.body,
    )
    const slug = slugify(body.name)
    const row = await tx(async (c) => {
      const r = await txq<{ id: string }>(
        c,
        `INSERT INTO categories (slug, name, description, sort_order) VALUES ($1,$2,$3,$4) RETURNING id`,
        [slug, body.name, body.description, body.sort_order],
      )
      await audit(c, s.sub, 'category.created', 'category', r[0]!.id, '', null, body)
      return r[0]!
    })
    return reply.code(201).send(row)
  })

  app.patch('/admin/categories/:id', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({
        name: z.string().trim().min(2).max(80).optional(),
        description: z.string().trim().max(300).optional(),
        status: z.enum(['ACTIVE', 'HIDDEN']).optional(),
        sort_order: z.number().int().optional(),
      }),
      req.body,
    )
    await tx(async (c) => {
      await txq(
        c,
        `UPDATE categories SET name=COALESCE($2,name), description=COALESCE($3,description),
                status=COALESCE($4,status), sort_order=COALESCE($5,sort_order) WHERE id=$1`,
        [id, body.name ?? null, body.description ?? null, body.status ?? null, body.sort_order ?? null],
      )
      await audit(c, s.sub, 'category.updated', 'category', id, '', null, body)
    })
    return { ok: true }
  })

  app.get('/admin/products', async (req) => {
    await requireAdmin(req)
    const { page, pageSize } = parse(pagination, req.query ?? {})
    const f = parse(
      z.object({ search: z.string().trim().max(100).optional(), status: z.enum(['ACTIVE','INACTIVE']).optional() }),
      req.query ?? {},
    )
    const params: unknown[] = []
    const where: string[] = []
    if (f.search) {
      params.push(`%${f.search}%`)
      where.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`)
    }
    if (f.status) {
      params.push(f.status)
      where.push(`p.status=$${params.length}`)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    params.push(pageSize, (page - 1) * pageSize)
    const rows = await q(
      `SELECT p.id, p.sku, p.slug, p.name, p.unit, p.base_price_vnd, p.status, p.requires_trace,
              p.shelf_life_days, c.name AS category_name, p.category_id,
              (SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order LIMIT 1) AS image,
              COALESCE((SELECT SUM(i.on_hand_qty - i.reserved_qty) FROM inventory i JOIN batches b ON b.id=i.batch_id
                         WHERE b.product_id=p.id AND ${SELLABLE_SQL}),0) AS available,
              (SELECT COUNT(*)::int FROM batches b WHERE b.product_id=p.id) AS batch_count
         FROM products p JOIN categories c ON c.id=p.category_id
         ${whereSql} ORDER BY p.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    )
    const total = await one<{ n: number }>(`SELECT COUNT(*)::int AS n FROM products p ${whereSql}`, params.slice(0, -2))
    return { data: rows, page, pageSize, total: total?.n ?? 0 }
  })

  app.post('/admin/products', async (req, reply) => {
    const s = await requireAdmin(req)
    const body = parse(
      z.object({
        category_id: z.string().uuid(),
        sku: z.string().trim().min(2).max(40),
        name: z.string().trim().min(2).max(120),
        description: z.string().trim().max(4000).default(''),
        storage: z.string().trim().max(500).default(''),
        origin_note: z.string().trim().max(500).default(''),
        unit: z.string().trim().min(1).max(16).default('kg'),
        base_price_vnd: z.number().int().nonnegative('Giá không hợp lệ'),
        shelf_life_days: z.number().int().positive('Hạn dùng phải lớn hơn 0'),
        requires_trace: z.boolean().default(true),
        images: z.array(z.object({ url: z.string().min(1), alt: z.string().default('') })).default([]),
      }),
      req.body,
    )
    const row = await tx(async (c) => {
      const dupe = await txq(c, `SELECT 1 FROM products WHERE sku = $1`, [body.sku])
      if (dupe.length) throw new AppError(409, 'SKU_EXISTS', 'SKU đã tồn tại.')
      const baseSlug = slugify(body.name)
      const slugRow = await txq<{ n: number }>(c, `SELECT COUNT(*)::int AS n FROM products WHERE slug LIKE $1`, [`${baseSlug}%`])
      const slug = (slugRow[0]?.n ?? 0) === 0 ? baseSlug : `${baseSlug}-${(slugRow[0]?.n ?? 0) + 1}`
      const r = await txq<{ id: string }>(
        c,
        `INSERT INTO products (category_id, sku, slug, name, description, storage, origin_note, unit,
                               base_price_vnd, shelf_life_days, requires_trace)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
        [body.category_id, body.sku, slug, body.name, body.description, body.storage, body.origin_note,
         body.unit, body.base_price_vnd, body.shelf_life_days, body.requires_trace],
      )
      const pid = r[0]!.id
      for (const [i, img] of body.images.entries()) {
        await txq(c, `INSERT INTO product_images (product_id, url, alt, sort_order) VALUES ($1,$2,$3,$4)`, [pid, img.url, img.alt, i])
      }
      await audit(c, s.sub, 'product.created', 'product', pid, '', null, { sku: body.sku })
      return { id: pid }
    })
    return reply.code(201).send(row)
  })

  app.patch('/admin/products/:id', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({
        category_id: z.string().uuid().optional(),
        name: z.string().trim().min(2).max(120).optional(),
        description: z.string().trim().max(4000).optional(),
        storage: z.string().trim().max(500).optional(),
        origin_note: z.string().trim().max(500).optional(),
        unit: z.string().trim().min(1).max(16).optional(),
        base_price_vnd: z.number().int().nonnegative().optional(),
        shelf_life_days: z.number().int().positive().optional(),
        requires_trace: z.boolean().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
        images: z.array(z.object({ url: z.string().min(1), alt: z.string().default('') })).optional(),
      }),
      req.body,
    )
    await tx(async (c) => {
      const before = await txq(c, `SELECT name, base_price_vnd, status FROM products WHERE id=$1`, [id])
      if (before.length === 0) throw errors.notFound('sản phẩm')
      await txq(
        c,
        `UPDATE products SET
           category_id=COALESCE($2,category_id), name=COALESCE($3,name), description=COALESCE($4,description),
           storage=COALESCE($5,storage), origin_note=COALESCE($6,origin_note), unit=COALESCE($7,unit),
           base_price_vnd=COALESCE($8,base_price_vnd), shelf_life_days=COALESCE($9,shelf_life_days),
           requires_trace=COALESCE($10,requires_trace), status=COALESCE($11,status)
         WHERE id=$1`,
        [id, body.category_id ?? null, body.name ?? null, body.description ?? null, body.storage ?? null,
         body.origin_note ?? null, body.unit ?? null, body.base_price_vnd ?? null,
         body.shelf_life_days ?? null, body.requires_trace ?? null, body.status ?? null],
      )
      if (body.images) {
        await txq(c, `DELETE FROM product_images WHERE product_id=$1`, [id])
        for (const [i, img] of body.images.entries()) {
          await txq(c, `INSERT INTO product_images (product_id, url, alt, sort_order) VALUES ($1,$2,$3,$4)`, [id, img.url, img.alt, i])
        }
      }
      await audit(c, s.sub, 'product.updated', 'product', id, '', before[0], body)
    })
    return { ok: true }
  })

  app.get('/admin/products/:id', async (req) => {
    await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const p = await one<Record<string, unknown>>(`SELECT * FROM products WHERE id=$1`, [id])
    if (!p) throw errors.notFound('sản phẩm')
    const images = await q(`SELECT url, alt FROM product_images WHERE product_id=$1 ORDER BY sort_order`, [id])
    const batches = await q(
      `SELECT b.id, b.code, b.harvest_date, b.expiry_date, b.quality_status, b.publication_status, b.safety_status,
              COALESCE(i.on_hand,0) AS on_hand, COALESCE(i.reserved,0) AS reserved,
              COALESCE(i.on_hand,0) - COALESCE(i.reserved,0) AS available
         FROM batches b LEFT JOIN LATERAL (
           SELECT SUM(on_hand_qty) AS on_hand, SUM(reserved_qty) AS reserved FROM inventory WHERE batch_id=b.id
         ) i ON true
        WHERE b.product_id=$1 ORDER BY b.created_at DESC`,
      [id],
    )
    return { ...p, images, batches }
  })

  // ================= ADM-03 Suppliers & farms =================
  app.get('/admin/suppliers', async (req) => {
    await requireAdmin(req)
    return q(
      `SELECT s.*, (SELECT COUNT(*)::int FROM farms f WHERE f.supplier_id=s.id) AS farm_count
         FROM suppliers s ORDER BY s.name`,
    )
  })

  app.post('/admin/suppliers', async (req, reply) => {
    const s = await requireAdmin(req)
    const body = parse(
      z.object({
        code: z.string().trim().min(2).max(30),
        name: z.string().trim().min(2).max(120),
        business_type: z.string().trim().max(60).default('Hợp tác xã'),
        contact_name: z.string().trim().max(80).default(''),
        contact_phone: z.string().trim().max(20).default(''),
        contact_email: z.string().trim().max(120).default(''),
      }),
      req.body,
    )
    const row = await tx(async (c) => {
      const dupe = await txq(c, `SELECT 1 FROM suppliers WHERE code=$1`, [body.code])
      if (dupe.length) throw new AppError(409, 'CODE_EXISTS', 'Mã nhà cung cấp đã tồn tại.')
      const r = await txq<{ id: string }>(
        c,
        `INSERT INTO suppliers (code, name, business_type, contact_name, contact_phone, contact_email)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [body.code, body.name, body.business_type, body.contact_name, body.contact_phone, body.contact_email],
      )
      await audit(c, s.sub, 'supplier.created', 'supplier', r[0]!.id, '', null, { code: body.code })
      return { id: r[0]!.id }
    })
    return reply.code(201).send(row)
  })

  app.patch('/admin/suppliers/:id', async (req) => {
    await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({
        name: z.string().trim().min(2).max(120).optional(),
        business_type: z.string().trim().max(60).optional(),
        contact_name: z.string().trim().max(80).optional(),
        contact_phone: z.string().trim().max(20).optional(),
        contact_email: z.string().trim().max(120).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      }),
      req.body,
    )
    await q(
      `UPDATE suppliers SET name=COALESCE($2,name), business_type=COALESCE($3,business_type),
         contact_name=COALESCE($4,contact_name), contact_phone=COALESCE($5,contact_phone),
         contact_email=COALESCE($6,contact_email), status=COALESCE($7,status) WHERE id=$1`,
      [id, body.name ?? null, body.business_type ?? null, body.contact_name ?? null,
       body.contact_phone ?? null, body.contact_email ?? null, body.status ?? null],
    )
    return { ok: true }
  })

  app.get('/admin/farms', async (req) => {
    await requireAdmin(req)
    return q(
      `SELECT f.*, s.name AS supplier_name, s.status AS supplier_status,
              (SELECT COUNT(*)::int FROM crop_seasons cs WHERE cs.farm_id=f.id) AS season_count
         FROM farms f JOIN suppliers s ON s.id=f.supplier_id ORDER BY f.name`,
    )
  })

  app.post('/admin/farms', async (req, reply) => {
    const s = await requireAdmin(req)
    const body = parse(
      z.object({
        supplier_id: z.string().uuid(),
        name: z.string().trim().min(2).max(120),
        province: z.string().trim().min(1).max(80),
        district: z.string().trim().min(1).max(80),
        commune: z.string().trim().min(1).max(80),
        address_detail: z.string().trim().max(200).default(''),
        latitude: z.number().min(-90).max(90).nullish(),
        longitude: z.number().min(-180).max(180).nullish(),
        area_ha: z.number().nonnegative().default(0),
        crops: z.string().trim().max(200).default(''),
        manager_name: z.string().trim().max(80).default(''),
        manager_phone: z.string().trim().max(20).default(''),
      }),
      req.body,
    )
    const row = await tx(async (c) => {
      const sup = await txq<{ status: string }>(c, `SELECT status FROM suppliers WHERE id=$1`, [body.supplier_id])
      if (sup.length === 0) throw errors.notFound('nhà cung cấp')
      if (sup[0]!.status !== 'ACTIVE') {
        throw new AppError(422, 'INVALID_DATA', 'Nhà cung cấp đã ngừng hoạt động, không thể tạo nông trại mới.')
      }
      const r = await txq<{ id: string }>(
        c,
        `INSERT INTO farms (supplier_id, name, province, district, commune, address_detail, latitude, longitude,
                            area_ha, crops, manager_name, manager_phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
        [body.supplier_id, body.name, body.province, body.district, body.commune, body.address_detail,
         body.latitude ?? null, body.longitude ?? null, body.area_ha, body.crops, body.manager_name, body.manager_phone],
      )
      await audit(c, s.sub, 'farm.created', 'farm', r[0]!.id, '', null, { name: body.name })
      return { id: r[0]!.id }
    })
    return reply.code(201).send(row)
  })

  app.patch('/admin/farms/:id', async (req) => {
    await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({
        name: z.string().trim().min(2).max(120).optional(),
        province: z.string().trim().max(80).optional(),
        district: z.string().trim().max(80).optional(),
        commune: z.string().trim().max(80).optional(),
        address_detail: z.string().trim().max(200).optional(),
        latitude: z.number().min(-90).max(90).nullish(),
        longitude: z.number().min(-180).max(180).nullish(),
        area_ha: z.number().nonnegative().optional(),
        crops: z.string().trim().max(200).optional(),
        manager_name: z.string().trim().max(80).optional(),
        manager_phone: z.string().trim().max(20).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      }),
      req.body,
    )
    await q(
      `UPDATE farms SET name=COALESCE($2,name), province=COALESCE($3,province), district=COALESCE($4,district),
         commune=COALESCE($5,commune), address_detail=COALESCE($6,address_detail),
         latitude=COALESCE($7,latitude), longitude=COALESCE($8,longitude), area_ha=COALESCE($9,area_ha),
         crops=COALESCE($10,crops), manager_name=COALESCE($11,manager_name),
         manager_phone=COALESCE($12,manager_phone), status=COALESCE($13,status) WHERE id=$1`,
      [id, body.name ?? null, body.province ?? null, body.district ?? null, body.commune ?? null,
       body.address_detail ?? null, body.latitude ?? null, body.longitude ?? null, body.area_ha ?? null,
       body.crops ?? null, body.manager_name ?? null, body.manager_phone ?? null, body.status ?? null],
    )
    return { ok: true }
  })

  // ================= ADM-04 Seasons, logs, batches =================
  app.get('/admin/seasons', async (req) => {
    await requireAdmin(req)
    return q(
      `SELECT cs.*, f.name AS farm_name, p.name AS product_name, p.unit,
              (SELECT COUNT(*)::int FROM batches b WHERE b.season_id=cs.id) AS batch_count,
              (SELECT COUNT(*)::int FROM cultivation_logs cl WHERE cl.season_id=cs.id) AS log_count
         FROM crop_seasons cs JOIN farms f ON f.id=cs.farm_id JOIN products p ON p.id=cs.product_id
        ORDER BY cs.created_at DESC`,
    )
  })

  app.post('/admin/seasons', async (req, reply) => {
    const s = await requireAdmin(req)
    const body = parse(
      z.object({
        farm_id: z.string().uuid(),
        product_id: z.string().uuid(),
        variation: z.string().optional(),
        variety: z.string().trim().max(80).default(''),
        area_ha: z.number().nonnegative().default(0),
        sown_at: dateOnly,
        expected_harvest_at: dateOnly,
      }),
      req.body,
    )
    const row = await tx(async (c) => {
      const farm = await txq<{ name: string; status: string; supplier_status: string }>(
        c,
        `SELECT f.name, f.status, sup.status AS supplier_status FROM farms f
           JOIN suppliers sup ON sup.id=f.supplier_id WHERE f.id=$1`,
        [body.farm_id],
      )
      if (farm.length === 0) throw errors.notFound('nông trại')
      if (farm[0]!.status !== 'ACTIVE' || farm[0]!.supplier_status !== 'ACTIVE') {
        throw new AppError(422, 'INVALID_DATA', 'Nông trại hoặc nhà cung cấp đã ngừng hoạt động.')
      }
      // Same atomic counter as orders: COUNT(*)+1 repeats a code once a season row is removed.
      const seq = await txq<{ n: number }>(
        c,
        `INSERT INTO code_sequences (kind, year, last_value) VALUES ('season', $1, 1)
         ON CONFLICT (kind, year) DO UPDATE SET last_value = code_sequences.last_value + 1
         RETURNING last_value AS n`,
        [Number(todayVN().slice(0, 4))],
      )
      const code = `SS-${todayVN().slice(0, 4)}-${String(seq[0]!.n).padStart(4, '0')}`
      const r = await txq<{ id: string }>(
        c,
        `INSERT INTO crop_seasons (farm_id, product_id, code, variety, area_ha, sown_at, expected_harvest_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [body.farm_id, body.product_id, code, body.variety, body.area_ha, body.sown_at, body.expected_harvest_at],
      )
      await audit(c, s.sub, 'season.created', 'season', r[0]!.id, '', null, { code })
      return { id: r[0]!.id, code }
    })
    return reply.code(201).send(row)
  })

  app.get('/admin/seasons/:id', async (req) => {
    await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const season = await one<Record<string, unknown>>(
      `SELECT cs.*, f.name AS farm_name, f.province, f.latitude, f.longitude, f.supplier_id,
              p.name AS product_name, p.sku, p.unit, p.requires_trace, s.name AS supplier_name
         FROM crop_seasons cs JOIN farms f ON f.id=cs.farm_id JOIN products p ON p.id=cs.product_id
         JOIN suppliers s ON s.id=f.supplier_id WHERE cs.id=$1`,
      [id],
    )
    if (!season) throw errors.notFound('mùa vụ')
    const logs = await q(`SELECT * FROM cultivation_logs WHERE season_id=$1 ORDER BY activity_at, created_at`, [id])
    const batches = await q(`SELECT * FROM batches WHERE season_id=$1 ORDER BY created_at DESC`, [id])
    const earliest = await one<{ d: string | null }>(
      `SELECT to_char(max(activity_at + isolation_days), 'YYYY-MM-DD') AS d FROM cultivation_logs
        WHERE season_id=$1 AND activity='PESTICIDE' AND isolation_days IS NOT NULL`,
      [id],
    )
    return { ...season, logs, batches, earliest_harvest_date: earliest?.d ?? null }

  })

  app.post('/admin/seasons/:id/logs', async (req, reply) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({
        activity: z.enum(['TILLING', 'SOWING', 'FERTILIZING', 'PESTICIDE', 'IRRIGATION', 'PRUNING', 'HARVEST', 'OTHER']),
        activity_at: dateOnly,
        performer: z.string().trim().max(80).default(''),
        materials: z.string().trim().max(200).default(''),
        pesticide_name: z.string().trim().max(120).nullish(),
        isolation_days: z.number().int().min(0).max(365).nullish(),
        note: z.string().trim().max(500).default(''),
      }),
      req.body,
    )
    if (body.activity === 'PESTICIDE' && (body.isolation_days === null || body.isolation_days === undefined)) {
      throw new AppError(422, 'INVALID_DATA', 'Ghi nhận phun thuốc bắt buộc nhập thời gian cách ly.', {
        isolation_days: 'Bắt buộc với hoạt động phun thuốc',
      })
    }
    const row = await tx(async (c) => {
      const season = await txq(c, `SELECT id FROM crop_seasons WHERE id=$1`, [id])
      if (season.length === 0) throw errors.notFound('mùa vụ')
      const r = await txq<{ id: string }>(
        c,
        `INSERT INTO cultivation_logs (season_id, activity, activity_at, performer, materials,
                                      pesticide_name, isolation_days, note, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [id, body.activity, body.activity_at, body.performer, body.materials,
         body.pesticide_name ?? null, body.isolation_days ?? null, body.note, s.sub],
      )
      return { id: r[0]!.id }
    })
    return reply.code(201).send(row)
  })

  app.get('/admin/batches', async (req) => {
    await requireAdmin(req)
    const { page, pageSize } = parse(pagination, req.query ?? {})
    const f = parse(
      z.object({
        search: z.string().trim().max(100).optional(),
        quality: z.enum(['PENDING', 'PASS', 'FAIL']).optional(),
        publication: z.enum(['DRAFT', 'PUBLISHED', 'UNPUBLISHED']).optional(),
        safety: z.enum(['NORMAL', 'HOLD', 'RECALLED']).optional(),
      }),
      req.query ?? {},
    )
    const params: unknown[] = []
    const where: string[] = []
    if (f.search) {
      params.push(`%${f.search}%`)
      where.push(`(b.code ILIKE $${params.length} OR p.name ILIKE $${params.length})`)
    }
    for (const [col, val] of [['quality_status', f.quality], ['publication_status', f.publication], ['safety_status', f.safety]] as const) {
      if (val) {
        params.push(val)
        where.push(`b.${col} = $${params.length}`)
      }
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    params.push(pageSize, (page - 1) * pageSize)
    const rows = await q(
      `SELECT b.id, b.code, b.harvest_date, b.pack_date, b.expiry_date, b.harvested_qty,
              b.quality_status, b.publication_status, b.safety_status, b.created_at,
              p.name AS product_name, p.unit, f.name AS farm_name, cs.code AS season_code,
              COALESCE(i.on_hand,0) AS on_hand, COALESCE(i.reserved,0) AS reserved,
              COALESCE(i.on_hand,0)-COALESCE(i.reserved,0) AS available,
              qr.token AS qr_token,
              (b.expiry_date < ${TODAY}) AS is_expired
         FROM batches b JOIN products p ON p.id=b.product_id
         JOIN crop_seasons cs ON cs.id=b.season_id JOIN farms f ON f.id=cs.farm_id
         LEFT JOIN LATERAL (SELECT SUM(on_hand_qty) AS on_hand, SUM(reserved_qty) AS reserved
                              FROM inventory WHERE batch_id=b.id) i ON true
         LEFT JOIN qr_codes qr ON qr.batch_id=b.id
         ${whereSql} ORDER BY b.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    )
    const total = await one<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM batches b JOIN products p ON p.id=b.product_id ${whereSql}`,
      params.slice(0, -2),
    )
    return { data: rows, page, pageSize, total: total?.n ?? 0 }
  })

  app.post('/admin/batches', async (req, reply) => {
    const s = await requireAdmin(req)
    const body = parse(
      z.object({
        season_id: z.string().uuid(),
        // Optional: leave blank to auto-generate the batch code.
        code: z.string().trim().max(40).default(''),
        harvest_date: dateOnly,
        pack_date: dateOnly,
        expiry_date: dateOnly,
        harvested_qty: z.number().positive('Sản lượng phải lớn hơn 0'),
        storage_condition: z.string().trim().max(200).default(''),
        notes: z.string().trim().max(500).default(''),
      }),
      req.body,
    )
    const row = await tx(async (c) => {
      const season = await txq<{ product_id: string; sown_at: string; product_name: string }>(
        c,
        `SELECT cs.product_id, cs.sown_at, p.name AS product_name
           FROM crop_seasons cs JOIN products p ON p.id=cs.product_id WHERE cs.id=$1`,
        [body.season_id],
      )
      if (season.length === 0) throw errors.notFound('mùa vụ')
      // Blank code = server-generated `LO-YYYY-NNNN` (same atomic counter as orders);
      // the shopper-facing label must stay unique per batch, never derived from COUNT(*).
      let code = body.code
      if (code === '') {
        const seq = await txq<{ n: number }>(
          c,
          `INSERT INTO code_sequences (kind, year, last_value) VALUES ('batch', $1, 1)
           ON CONFLICT (kind, year) DO UPDATE SET last_value = code_sequences.last_value + 1
           RETURNING last_value AS n`,
          [Number(todayVN().slice(0, 4))],
        )
        code = `LO-${todayVN().slice(0, 4)}-${String(seq[0]!.n).padStart(4, '0')}`
      }
      const dupe = await txq(c, `SELECT 1 FROM batches WHERE code=$1`, [code])
      if (dupe.length) {
        throw new AppError(409, 'BATCH_CODE_EXISTS', 'Mã lô đã tồn tại. Mã lô không được tái sử dụng cho vụ mới.')
      }

      // Pesticide isolation gate (ADM-04-03, TC02): harvest must be >= max(log_date + isolation_days).
      // to_char in SQL: pg returns a JS Date at local midnight, so toISOString() would move the
      // gate one day earlier in ICT and let a batch be harvested inside the isolation window.
      const isolation = await txq<{ min_date: string | null }>(
        c,
        `SELECT to_char(max(activity_at + isolation_days), 'YYYY-MM-DD') AS min_date FROM cultivation_logs
          WHERE season_id=$1 AND activity='PESTICIDE' AND isolation_days IS NOT NULL`,
        [body.season_id],
      )
      const minStr = isolation[0]?.min_date
      if (minStr && body.harvest_date < minStr) {
        throw new AppError(
          422,
          'INVALID_DATA',
          `Ngày thu hoạch vi phạm thời gian cách ly thuốc BVTV. Ngày hợp lệ sớm nhất là ${minStr}.`,
          { harvest_date: `Không được trước ${minStr}` },
        )
      }
      if (body.expiry_date <= body.harvest_date) {
        throw new AppError(422, 'INVALID_DATA', 'Hạn dùng phải sau ngày thu hoạch.', {
          expiry_date: 'Hạn dùng phải sau ngày thu hoạch',
        })
      }

      const r = await txq<{ id: string }>(
        c,
        `INSERT INTO batches (season_id, product_id, code, harvest_date, pack_date, expiry_date, harvested_qty,
                             storage_condition, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [body.season_id, season[0]!.product_id, code, body.harvest_date, body.pack_date,
         body.expiry_date, body.harvested_qty, body.storage_condition, body.notes],
      )
      const bid = r[0]!.id
      await batchEvent(c, bid, 'HARVEST', 'Thu hoạch', `Sản lượng ${body.harvested_qty} từ mùa vụ`, s.sub)
      await audit(c, s.sub, 'batch.created', 'batch', bid, '', null, { code: body.code })
      return { id: bid }
    })
    return reply.code(201).send(row)
  })

  app.get('/admin/batches/:id', async (req) => {
    await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const b = await one<Record<string, unknown>>(
      `SELECT b.*, p.name AS product_name, p.sku, p.unit, p.base_price_vnd, p.requires_trace,
              cs.id AS season_id, cs.code AS season_code, cs.variety, cs.sown_at, cs.expected_harvest_at,
              f.id AS farm_id, f.name AS farm_name, f.province, f.district, f.commune, f.latitude, f.longitude,
              s.name AS supplier_name, qr.token AS qr_token, qr.id AS qr_id,
              COALESCE(i.on_hand,0) AS on_hand, COALESCE(i.reserved,0) AS reserved,
              COALESCE(i.on_hand,0)-COALESCE(i.reserved,0) AS available
         FROM batches b JOIN products p ON p.id=b.product_id
         JOIN crop_seasons cs ON cs.id=b.season_id JOIN farms f ON f.id=cs.farm_id
         JOIN suppliers s ON s.id=f.supplier_id
         LEFT JOIN qr_codes qr ON qr.batch_id=b.id
         LEFT JOIN LATERAL (SELECT SUM(on_hand_qty) AS on_hand, SUM(reserved_qty) AS reserved
                              FROM inventory WHERE batch_id=b.id) i ON true
        WHERE b.id=$1`,
      [id],
    )
    if (!b) throw errors.notFound('lô hàng')
    const events = await q(`SELECT * FROM batch_events WHERE batch_id=$1 ORDER BY occurred_at`, [id])
    const logs = await q(`SELECT * FROM cultivation_logs WHERE season_id=$1 ORDER BY activity_at`, [b.season_id])
    const tests = await q(
      `SELECT t.*, (SELECT jsonb_agg(m ORDER BY m.id) FROM lab_test_metrics m WHERE m.lab_test_id=t.id) AS metrics
         FROM lab_tests t WHERE t.batch_id=$1 ORDER BY t.created_at DESC`,
      [id],
    )
    const certificates = await q(`SELECT * FROM certificates WHERE batch_id=$1 ORDER BY valid_from DESC`, [id])
    const allocations = await q(
      `SELECT a.id, o.code AS order_code, o.status AS order_status, a.reserved_qty, a.shipped_qty, a.status,
              l.product_name, u.email AS customer_email, o.id AS order_id
         FROM order_line_allocations a JOIN order_lines l ON l.id=a.order_line_id
         JOIN orders o ON o.id=l.order_id JOIN users u ON u.id=o.customer_id
        WHERE a.batch_id=$1 ORDER BY o.placed_at DESC`,
      [id],
    )
    const complaints = await q(
      `SELECT id, code, type, status, created_at FROM complaints WHERE batch_id=$1 ORDER BY created_at DESC`,
      [id],
    )
    const recall = await one(`SELECT * FROM recalls WHERE batch_id=$1 ORDER BY started_at DESC LIMIT 1`, [id])
    const scans = await one<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM qr_scans s JOIN qr_codes q ON q.id=s.qr_id WHERE q.batch_id=$1`,
      [id],
    )
    return {
      ...b,
      events, logs, lab_tests: tests, certificates, allocations, complaints, recall,
      scan_count: scans?.n ?? 0,
    }
  })

  app.post('/admin/batches/:id/lab-tests', async (req, reply) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(
      z.object({
        laboratory: z.string().trim().min(2, 'Nhập đơn vị kiểm nghiệm').max(120),
        sampled_at: dateOnly,
        resulted_at: dateOnly,
        attachment_url: z.string().trim().max(400).nullish(),
        notes: z.string().trim().max(500).default(''),
        metrics: z
          .array(
            z.object({
              metric: z.string().trim().min(1, 'Nhập tên chỉ tiêu').max(120),
              measured_value: z.string().trim().min(1, 'Nhập giá trị đo').max(60),
              unit: z.string().trim().max(30).default(''),
              reference_limit: z.string().trim().max(60).default(''),
              result: z.enum(['PASS', 'FAIL']),
            }),
          )
          .min(1, 'Phiếu kiểm nghiệm cần ít nhất một chỉ tiêu'),
      }),
      req.body,
    )
    const overall = body.metrics.some((m) => m.result === 'FAIL') ? 'FAIL' : 'PASS'
    const out = await tx(async (c) => {
      const batch = await txq<{ code: string }>(c, `SELECT code FROM batches WHERE id=$1 FOR UPDATE`, [id])
      if (batch.length === 0) throw errors.notFound('lô hàng')
      const r = await txq<{ id: string }>(
        c,
        `INSERT INTO lab_tests (batch_id, laboratory, sampled_at, resulted_at, overall_result, attachment_url, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [id, body.laboratory, body.sampled_at, body.resulted_at, overall, body.attachment_url ?? null, body.notes],
      )
      for (const m of body.metrics) {
        await txq(
          c,
          `INSERT INTO lab_test_metrics (lab_test_id, metric, measured_value, unit, reference_limit, result)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [r[0]!.id, m.metric, m.measured_value, m.unit, m.reference_limit, m.result],
        )
      }
      // A FAIL result immediately blocks selling: quality=FAIL and safety=HOLD (ADM-05-04).
      if (overall === 'FAIL') {
        await txq(c, `UPDATE batches SET quality_status='FAIL', safety_status='HOLD' WHERE id=$1`, [id])
        await batchEvent(c, id, 'LAB_FAIL', 'Kiểm nghiệm không đạt', `Phiếu ${body.laboratory}: có chỉ tiêu không đạt`, s.sub)
      } else {
        await batchEvent(c, id, 'LAB_PASS', 'Kiểm nghiệm đạt', `Phiếu ${body.laboratory}: tất cả chỉ tiêu đạt`, s.sub)
      }
      await audit(c, s.sub, 'labtest.created', 'batch', id, '', null, { overall })
      return { id: r[0]!.id, overall_result: overall }
    })
    return reply.code(201).send(out)
  })

  app.post('/admin/lab-tests/:id/confirm', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(z.object({ reason: z.string().trim().min(5, 'Ghi rõ lý do xác nhận').max(300) }), req.body)
    await tx(async (c) => {
      const test = await txq<{ batch_id: string; overall_result: string }>(
        c,
        `SELECT batch_id, overall_result FROM lab_tests WHERE id=$1 FOR UPDATE`,
        [id],
      )
      if (test.length === 0) throw errors.notFound('phiếu kiểm nghiệm')
      const t = test[0]!
      await txq(c, `UPDATE lab_tests SET is_effective=false WHERE batch_id=$1 AND is_effective`, [t.batch_id])
      await txq(c, `UPDATE lab_tests SET is_effective=true, confirmed_by=$2, confirmed_at=now() WHERE id=$1`, [id, s.sub])
      if (t.overall_result === 'PASS') {
        // Reopening a HOLD batch requires this explicit Admin confirmation + reason (ADM-05-05).
        await txq(
          c,
          `UPDATE batches SET quality_status='PASS',
                  safety_status = CASE WHEN safety_status='HOLD' THEN 'NORMAL' ELSE safety_status END
            WHERE id=$1`,
          [t.batch_id],
        )
        await batchEvent(c, t.batch_id, 'LAB_CONFIRMED', 'Xác nhận kiểm nghiệm đạt', body.reason, s.sub)
      } else {
        await txq(c, `UPDATE batches SET quality_status='FAIL', safety_status='HOLD' WHERE id=$1`, [t.batch_id])
      }
      await audit(c, s.sub, 'labtest.confirmed', 'batch', t.batch_id, body.reason, null, { lab_test_id: id })
    })
    return { ok: true }
  })

  app.post('/admin/batches/:id/publish', async (req) => {
    const s = await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const body = parse(z.object({ reason: z.string().trim().max(300).default('') }), req.body ?? {})
    await tx(async (c) => {
      const rows = await txq<{
        code: string; quality_status: string; safety_status: string; publication_status: string
        requires_trace: boolean; has_effective_pass: boolean; log_count: number
      }>(
        c,
        `SELECT b.code, b.quality_status, b.safety_status, b.publication_status, p.requires_trace,
                EXISTS (SELECT 1 FROM lab_tests t WHERE t.batch_id=b.id AND t.is_effective AND t.overall_result='PASS') AS has_effective_pass,
                (SELECT COUNT(*)::int FROM cultivation_logs cl WHERE cl.season_id=b.season_id) AS log_count
           FROM batches b JOIN products p ON p.id=b.product_id WHERE b.id=$1 FOR UPDATE OF b`,
        [id],
      )
      const b = rows[0]
      if (!b) throw errors.notFound('lô hàng')
      const missing: string[] = []
      if (b.quality_status !== 'PASS') missing.push('Lô phải có kết quả kiểm nghiệm Đạt')
      if (!b.has_effective_pass) missing.push('Chưa có phiếu kiểm nghiệm Đạt được xác nhận')
      if (b.safety_status !== 'NORMAL') missing.push('Lô đang bị tạm giữ hoặc thu hồi')
      if (b.requires_trace && b.log_count === 0) missing.push('Thiếu nhật ký canh tác')
      if (missing.length > 0) {
        throw new AppError(422, 'INVALID_DATA', `Không thể công khai lô: ${missing.join('; ')}.`, undefined, { missing })
      }
      await txq(
        c,
        `UPDATE batches SET publication_status='PUBLISHED', published_at=now(), published_by=$2 WHERE id=$1`,
        [id, s.sub],
      )
      await txq(
        c,
        `INSERT INTO qr_codes (batch_id, token) VALUES ($1,$2) ON CONFLICT (batch_id) DO NOTHING`,
        [id, randomBytes(24).toString('base64url')],
      )
      await batchEvent(c, id, 'PUBLISHED', 'Công khai hồ sơ lô', body.reason || 'Đủ điều kiện công khai', s.sub)
      await audit(c, s.sub, 'batch.published', 'batch', id, body.reason, { status: b.publication_status }, { status: 'PUBLISHED' })
    })
    const qr = await one<{ token: string }>(`SELECT token FROM qr_codes WHERE batch_id=$1`, [id])
    if (!qr) throw errors.notFound('mã QR')
    return { ok: true, trace_url: `${config.publicWebUrl}/t/${qr.token}`, token: qr.token }
  })

  /** Printable sticker: QR + tên sản phẩm, mã lô, ngày thu hoạch, hạn dùng (ADM-06-02). */
  app.get('/admin/batches/:id/label.pdf', async (req, reply) => {
    await requireAdmin(req)
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const row = await one<{ token: string; code: string; product_name: string; harvest_date: string; expiry_date: string }>(
      `SELECT q.token, b.code, p.name AS product_name, to_char(b.harvest_date,'DD/MM/YYYY') AS harvest_date,
              to_char(b.expiry_date,'DD/MM/YYYY') AS expiry_date
         FROM qr_codes q JOIN batches b ON b.id=q.batch_id JOIN products p ON p.id=b.product_id
        WHERE q.batch_id=$1`,
      [id],
    )
    if (!row) throw errors.notFound('mã QR')
    const pdf = await renderLabelPdf(`${config.publicWebUrl}/t/${row.token}`, row)
    return reply
      .type('application/pdf')
      .header('content-disposition', `inline; filename="tem-${row.code}.pdf"`)
      .send(pdf)
  })

  app.get('/admin/certificates', async (req) => {
    await requireAdmin(req)
    return q(
      `SELECT c.*, b.code AS batch_code, f.name AS farm_name FROM certificates c
         LEFT JOIN batches b ON b.id=c.batch_id LEFT JOIN farms f ON f.id=c.farm_id
        ORDER BY c.created_at DESC`,
    )
  })

  app.post('/admin/certificates', async (req, reply) => {
    const s = await requireAdmin(req)
    const body = parse(
      z.object({
        farm_id: z.string().uuid().nullish(),
        batch_id: z.string().uuid().nullish(),
        type: z.string().trim().min(2).max(80),
        number: z.string().trim().min(1).max(80),
        issuer: z.string().trim().min(2).max(120),
        valid_from: dateOnly,
        valid_until: dateOnly.nullish(),
        scope: z.string().trim().max(200).default(''),
        attachment_url: z.string().trim().max(400).nullish(),
        is_public: z.boolean().default(true),
      }),
      req.body,
    )
    if (!body.farm_id && !body.batch_id) {
      throw new AppError(422, 'INVALID_DATA', 'Chứng nhận phải gắn với nông trại hoặc lô hàng.')
    }
    // Check the owner first so a bad id is a 404, not a foreign-key 500.
    if (body.farm_id) {
      const farm = await one(`SELECT 1 FROM farms WHERE id=$1`, [body.farm_id])
      if (!farm) throw errors.notFound('nông trại')
    }
    if (body.batch_id) {
      const batch = await one(`SELECT 1 FROM batches WHERE id=$1`, [body.batch_id])
      if (!batch) throw errors.notFound('lô hàng')
    }
    const r = await one<{ id: string }>(
      `INSERT INTO certificates (farm_id, batch_id, type, number, issuer, valid_from, valid_until, scope,
                                 attachment_url, is_public)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [body.farm_id ?? null, body.batch_id ?? null, body.type, body.number, body.issuer, body.valid_from,
       body.valid_until ?? null, body.scope, body.attachment_url ?? null, body.is_public],
    )
    await audit(null, s.sub, 'certificate.created', 'certificate', r?.id ?? '', '', null, body)
    return reply.code(201).send({ id: r?.id })
  })
}
