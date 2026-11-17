import type { FastifyInstance } from 'fastify'
import type pg from 'pg'
import { z } from 'zod'
import { one, q, tx, txq } from '../db.js'
import { parse, pagination } from '../lib/validate.js'
import { errors } from '../lib/errors.js'
import { SELLABLE_SQL, TODAY } from '../services/invariants.js'
import { PROVINCE, normalizeVi, serviceAreaSummary, type Ward } from '../services/serviceArea.js'
import { renderTracePdf, type TracePayload } from '../services/tracePdf.js'

/** Availability is always derived from sellable batches, never stored on Product. */
const AVAILABILITY_LATERAL = `
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(i.on_hand_qty - i.reserved_qty), 0) AS available
      FROM inventory i JOIN batches b ON b.id = i.batch_id
     WHERE b.product_id = p.id AND ${SELLABLE_SQL}
  ) av ON true
`

const PRODUCT_LIST_SQL = `
  SELECT p.id, p.sku, p.slug, p.name, p.unit, p.base_price_vnd, p.category_id, p.requires_trace,
         p.shelf_life_days, p.origin_note, c.name AS category_name, c.slug AS category_slug,
         av.available, (av.available > 0) AS in_stock,
         p.created_at,
         (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image,
         (SELECT COUNT(*)::int FROM product_images WHERE product_id = p.id) AS image_count,
         COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r
                    WHERE r.product_id = p.id AND r.status = 'VISIBLE'), 0) AS rating,
         (SELECT COUNT(*)::int FROM reviews r WHERE r.product_id = p.id AND r.status = 'VISIBLE') AS review_count,
         EXISTS (SELECT 1 FROM batch_promotions bp JOIN batches b2 ON b2.id = bp.batch_id
                  WHERE b2.product_id = p.id AND bp.status = 'ACTIVE' AND now() BETWEEN bp.starts_at AND bp.ends_at
                    AND b2.safety_status='NORMAL' AND b2.expiry_date >= ${TODAY}) AS has_batch_promo
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ${AVAILABILITY_LATERAL}
   WHERE p.status = 'ACTIVE' AND c.status = 'ACTIVE'
`

interface TraceRow {
  id: string
  code: string
  harvest_date: string
  pack_date: string | null
  expiry_date: string
  harvested_qty: number
  quality_status: string
  publication_status: string
  safety_status: string
  storage_condition: string
  published_at: string | null
  is_demo: boolean
  product_name: string
  sku: string
  product_slug: string
  unit: string
  base_price_vnd: number
  product_description: string
  storage: string
  origin_note: string
  product_image: string | null
  season_code: string
  variety: string
  sown_at: string
  expected_harvest_at: string
  area_ha: number
  farm_name: string
  province: string
  district: string
  commune: string
  latitude: number | null
  longitude: number | null
  supplier_name: string
  business_type: string
  qr_id: string | null
  qr_status: string | null
  recall_id: string | null
  recall_reason: string | null
  recall_severity: string | null
  recall_started_at: string | null
  recall_status: string | null
}

export async function publicRoutes(app: FastifyInstance) {
  app.get('/categories', async () => {
    return q(
      `SELECT c.id, c.slug, c.name, c.description,
              (SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id AND p.status='ACTIVE') AS product_count,
              COALESCE(c.image_url, (SELECT url FROM product_images pi JOIN products p2 ON p2.id = pi.product_id
                WHERE p2.category_id = c.id ORDER BY pi.sort_order LIMIT 1)) AS image
         FROM categories c WHERE c.status = 'ACTIVE' ORDER BY c.sort_order, c.name`,
    )
  })

  app.get('/products', async (req) => {
    const { page, pageSize } = parse(pagination, req.query ?? {})
    const filters = parse(
      z.object({
        search: z.string().trim().max(100).optional(),
        category_id: z.string().uuid().optional(),
        category_slug: z.string().optional(),
        min_price: z.coerce.number().nonnegative().optional(),
        max_price: z.coerce.number().nonnegative().optional(),
        in_stock: z.enum(['true', 'false']).optional(),
        sort: z.enum(['name', 'price_asc', 'price_desc', 'newest', 'rating']).default('newest'),
      }),
      req.query ?? {},
    )
    const params: unknown[] = []
    const where: string[] = []
    if (filters.search) {
      params.push(`%${filters.search}%`)
      where.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.sku ILIKE $${params.length})`)
    }
    if (filters.category_id) {
      params.push(filters.category_id)
      where.push(`p.category_id = $${params.length}`)
    }
    if (filters.category_slug) {
      params.push(filters.category_slug)
      where.push(`c.slug = $${params.length}`)
    }
    if (filters.min_price !== undefined) {
      params.push(filters.min_price)
      where.push(`p.base_price_vnd >= $${params.length}`)
    }
    if (filters.max_price !== undefined) {
      params.push(filters.max_price)
      where.push(`p.base_price_vnd <= $${params.length}`)
    }
    const having: string[] = []
    if (filters.in_stock === 'true') having.push('av.available > 0')
    if (filters.in_stock === 'false') having.push('COALESCE(av.available,0) = 0')

    const orderBy = {
      name: 't.name ASC',
      price_asc: 't.base_price_vnd ASC',
      price_desc: 't.base_price_vnd DESC',
      newest: 't.created_at DESC',
      rating: 't.rating DESC NULLS LAST',
    }[filters.sort]

    const whereSql = where.length ? `AND ${where.join(' AND ')}` : ''
    params.push(pageSize, (page - 1) * pageSize)
    const limitIdx = params.length - 1
    const offsetIdx = params.length

    const rows = await q(
      `SELECT * FROM (${PRODUCT_LIST_SQL} ${whereSql}
        ${having.length ? `AND ${having.join(' AND ')}` : ''}) t
       ORDER BY ${orderBy} LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    )
    const countParams = params.slice(0, params.length - 2)
    const total = await one<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM (${PRODUCT_LIST_SQL} ${whereSql}
        ${having.length ? `AND ${having.join(' AND ')}` : ''}) t`,
      countParams,
    )
    return { data: rows, page, pageSize, total: total?.n ?? 0 }
  })

  app.get('/products/:key', async (req) => {
    const { key } = parse(z.object({ key: z.string().min(1) }), req.params)
    const isUuid = /^[0-9a-f-]{36}$/i.test(key)
    const product = await one<Record<string, unknown>>(
      `SELECT * FROM (${PRODUCT_LIST_SQL} AND (p.id::text = $1 OR p.slug = $1)) t LIMIT 1`,
      [key],
    )
    if (!product) throw errors.notFound('sản phẩm')
    void isUuid
    const id = product.id as string
    const images = await q(`SELECT url, alt FROM product_images WHERE product_id = $1 ORDER BY sort_order`, [id])
    const detail = await one(
      `SELECT description, storage, origin_note, base_price_vnd, unit, shelf_life_days, requires_trace, sku
         FROM products WHERE id = $1`,
      [id],
    )
    const categories = await one<{ name: string; slug: string }>(
      `SELECT c.name, c.slug FROM categories c WHERE c.id = (SELECT category_id FROM products WHERE id = $1)`,
      [id],
    )
    const reviews = await q(
      `SELECT r.rating, r.comment, r.created_at, COALESCE(cp.name, 'Khách hàng') AS customer_name
         FROM reviews r LEFT JOIN customer_profiles cp ON cp.user_id = r.customer_id
        WHERE r.product_id = $1 AND r.status = 'VISIBLE' ORDER BY r.created_at DESC LIMIT 20`,
      [id],
    )
    const batches = await q<{ code: string; harvest_date: string; expiry_date: string; farm_name: string; province: string; qr_token: string | null; discount_percent: number | null }>(
      `SELECT b.code, b.harvest_date, b.expiry_date, f.name AS farm_name, f.province,
              qr.token AS qr_token, bp.discount_percent
         FROM batches b
         JOIN crop_seasons s ON s.id = b.season_id
         JOIN farms f ON f.id = s.farm_id
         LEFT JOIN qr_codes qr ON qr.batch_id = b.id AND qr.status='ACTIVE'
         LEFT JOIN batch_promotions bp ON bp.batch_id = b.id AND bp.status='ACTIVE' AND now() BETWEEN bp.starts_at AND bp.ends_at
        WHERE b.product_id = $1 AND b.publication_status = 'PUBLISHED' AND b.safety_status = 'NORMAL'
          AND b.quality_status='PASS' AND b.expiry_date >= ${TODAY}
        ORDER BY b.expiry_date`,
      [id],
    )
    return {
      ...product,
      ...detail,
      category_name: categories?.name ?? null,
      category_slug: categories?.slug ?? null,
      images,
      reviews,
      public_batches: batches,
    }
  })

  app.get('/products/:id/reviews', async (req) => {
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params)
    const rows = await q(
      `SELECT r.rating, r.comment, r.created_at, COALESCE(cp.name, 'Khách hàng') AS customer_name
         FROM reviews r LEFT JOIN customer_profiles cp ON cp.user_id = r.customer_id
        WHERE r.product_id = $1 AND r.status = 'VISIBLE' ORDER BY r.created_at DESC LIMIT 50`,
      [id],
    )
    const summary = await one<{ avg: number; count: number }>(
      `SELECT COALESCE(ROUND(AVG(rating)::numeric,1),0) AS avg, COUNT(*)::int AS count
         FROM reviews WHERE product_id = $1 AND status='VISIBLE'`,
      [id],
    )
    return { data: rows, summary }
  })

  app.get('/home', async () => {
    const featured = await q(
      `SELECT * FROM (${PRODUCT_LIST_SQL}) t WHERE in_stock ORDER BY rating DESC, review_count DESC LIMIT 8`,
    )
    const newest = await q(`SELECT * FROM (${PRODUCT_LIST_SQL}) t ORDER BY created_at DESC LIMIT 8`)
    const categories = await q(
      `SELECT c.id, c.slug, c.name,
              (SELECT COUNT(*)::int FROM products p WHERE p.category_id=c.id AND p.status='ACTIVE') AS product_count,
              COALESCE(c.image_url, (SELECT url FROM product_images pi JOIN products p2 ON p2.id = pi.product_id
                WHERE p2.category_id = c.id ORDER BY pi.sort_order LIMIT 1)) AS image
         FROM categories c WHERE c.status='ACTIVE' ORDER BY c.sort_order LIMIT 8`,
    )
    const stats = await one<{ products: number; batches: number }>(
      `SELECT (SELECT COUNT(*)::int FROM products WHERE status='ACTIVE') AS products,
              (SELECT COUNT(*)::int FROM batches WHERE publication_status='PUBLISHED') AS batches`,
    )
    return { featured, newest, categories, stats }
  })

  // ---------------- public trace (no auth) ----------------
  const buildTrace = async (token: string, source: string, countScan = true): Promise<TracePayload> => {
    const row = await one<TraceRow>(
      `SELECT b.id, b.code, b.harvest_date, b.pack_date, b.expiry_date, b.harvested_qty,
              b.quality_status, b.publication_status, b.safety_status, b.storage_condition,
              b.published_at, b.is_demo,
              p.name AS product_name, p.sku, p.slug AS product_slug, p.unit, p.base_price_vnd,
              p.description AS product_description, p.storage, p.origin_note,
              (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS product_image,
              s.code AS season_code, s.variety, s.sown_at, s.expected_harvest_at, s.area_ha,
              f.name AS farm_name, f.province, f.district, f.commune, f.latitude, f.longitude,
              sup.name AS supplier_name, sup.business_type,
              qr.id AS qr_id, qr.status AS qr_status,
              r.id AS recall_id, r.reason AS recall_reason, r.severity AS recall_severity,
              r.started_at AS recall_started_at, r.status AS recall_status
         FROM qr_codes qr
         JOIN batches b ON b.id = qr.batch_id
         JOIN products p ON p.id = b.product_id
         JOIN crop_seasons s ON s.id = b.season_id
         JOIN farms f ON f.id = s.farm_id
         JOIN suppliers sup ON sup.id = f.supplier_id
         LEFT JOIN recalls r ON r.batch_id = b.id AND r.status = 'OPEN'
        WHERE qr.token = $1 AND qr.status = 'ACTIVE'`,
      [token],
    )
    if (!row) throw errors.notFound('thông tin tem')
    // Draft/unpublished batches must not leak trace data (TC06, CUS-09-03).
    if (row.publication_status !== 'PUBLISHED') {
      throw errors.notFound('thông tin tem')
    }
    if (countScan && row.qr_id) {
      await q(`INSERT INTO qr_scans (qr_id, source) VALUES ($1,$2)`, [row.qr_id, source])
    }
    const logs = await q<TracePayload['timeline'][number]>(
      `SELECT activity, activity_at, performer, materials, pesticide_name, isolation_days, note
         FROM cultivation_logs WHERE season_id = (SELECT season_id FROM batches WHERE id = $1)
        ORDER BY activity_at`,
      [row.id],
    )
    const tests = await q<TracePayload['lab_tests'][number] & { id: string }>(
      `SELECT id, laboratory, sampled_at, resulted_at, overall_result, attachment_url, notes, is_effective
         FROM lab_tests WHERE batch_id = $1 AND is_effective ORDER BY resulted_at DESC`,
      [row.id],
    )
    const metrics = tests.length
      ? await q<TracePayload['lab_tests'][number]['metrics'][number]>(
          `SELECT m.metric, m.measured_value, m.unit, m.reference_limit, m.result
             FROM lab_test_metrics m WHERE m.lab_test_id = $1`,
          [tests[0]!.id],
        )
      : []
    const certificates = await q<TracePayload['certificates'][number]>(
      `SELECT type, number, issuer, valid_from, valid_until, scope
         FROM certificates WHERE (batch_id = $1 OR farm_id = (SELECT farm_id FROM crop_seasons WHERE id = (SELECT season_id FROM batches WHERE id=$1)))
           AND is_public AND (valid_until IS NULL OR valid_until >= ${TODAY})`,
      [row.id],
    )
    const expired = new Date(`${row.expiry_date}`) < new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))
    const alert = row.safety_status === 'RECALLED'
      ? { level: 'RECALL', title: 'LÔ HÀNG ĐANG BỊ THU HỒI', message: row.recall_reason ?? 'Lô hàng đã bị thu hồi.' }
      : row.safety_status === 'HOLD'
        ? { level: 'HOLD', title: 'LÔ HÀNG ĐANG TẠM GIỮ', message: 'Lô hàng đang được kiểm tra chất lượng, không được bán.' }
        : expired
          ? { level: 'EXPIRED', title: 'LÔ HÀNG ĐÃ HẾT HẠN', message: 'Lô hàng đã quá hạn sử dụng, không được bán.' }
          : null

    // No PII: supplier contact/phone/email and farm manager contacts are excluded.
    return {
      batch: {
        id: row.id, code: row.code, harvest_date: row.harvest_date, pack_date: row.pack_date,
        expiry_date: row.expiry_date, harvested_qty: row.harvested_qty,
        quality_status: row.quality_status, publication_status: row.publication_status,
        safety_status: row.safety_status, storage_condition: row.storage_condition,
        is_expired: expired, is_demo: row.is_demo,
      },
      product: {
        name: row.product_name, sku: row.sku, slug: row.product_slug, unit: row.unit,
        description: row.product_description, storage: row.storage, origin_note: row.origin_note,
        image: row.product_image,
      },
      farm: {
        name: row.farm_name, province: row.province, district: row.district, commune: row.commune,
        latitude: row.latitude, longitude: row.longitude,
      },
      supplier: { name: row.supplier_name, business_type: row.business_type },
      season: {
        code: row.season_code, variety: row.variety, sown_at: row.sown_at,
        expected_harvest_at: row.expected_harvest_at, area_ha: row.area_ha,
      },
      timeline: logs,
      lab_tests: tests.map((t) => ({ ...t, metrics: t.id === tests[0]!.id ? metrics : [] })),
      certificates,
      alert,
      recall: row.recall_id ? { reason: row.recall_reason, severity: row.recall_severity, started_at: row.recall_started_at } : null,
    }
  }

  app.get('/t/:token', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (req) => {
    const { token } = parse(z.object({ token: z.string().min(10).max(64) }), req.params)
    return buildTrace(token, 'WEB')
  })

  /** Downloadable per-batch trace report. Public payload only — no contact PII. */
  app.get('/t/:token/pdf', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { token } = parse(z.object({ token: z.string().min(10).max(64) }), req.params)
    const trace = await buildTrace(token, 'WEB', false)
    const pdf = await renderTracePdf(trace, token)
    return reply
      .type('application/pdf')
      .header('content-disposition', `inline; filename="truy-xuat-${trace.batch.code}.pdf"`)
      .send(pdf)
  })

  // App scans carry their own source tag for reporting.
  app.post('/public/trace/:token/scan', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (req) => {
    const { token } = parse(z.object({ token: z.string().min(10).max(64) }), req.params)
    const body = parse(z.object({ source: z.enum(['WEB', 'APP', 'OTHER']).default('APP') }), req.body ?? {})
    return buildTrace(token, body.source)
  })
}

/** Public, read-only administrative units of the delivery area (post-2025 merger). */
export async function locationRoutes(app: FastifyInstance) {
  app.get('/locations/service-area', async () => serviceAreaSummary())

  app.get('/locations/wards', async (req) => {
    const f = parse(
      z.object({
        province_code: z.string().trim().default(PROVINCE.code),
        q: z.string().trim().max(80).optional(),
        include_disabled: z.coerce.boolean().default(false),
      }),
      req.query ?? {},
    )
    if (f.province_code !== PROVINCE.code) return { data: [], total: 0 }
    const rows = await q<Ward>(
      `SELECT code, name, type, province_code, in_service_area
         FROM wards
        WHERE province_code = $1
          AND ($2::boolean OR in_service_area)
          AND ($3::text IS NULL OR search_text LIKE '%' || $3 || '%')
        ORDER BY type DESC, name`,
      [f.province_code, f.include_disabled, f.q ? normalizeVi(f.q) : null],
    )
    return { data: rows, total: rows.length }
  })

  app.get('/locations/wards/:code', async (req) => {
    const { code } = parse(z.object({ code: z.string().regex(/^\d{4,5}$/) }), req.params)
    const ward = await one<Ward>(
      `SELECT code, name, type, province_code, in_service_area FROM wards WHERE code = $1`,
      [code],
    )
    if (!ward) throw errors.notFound('xã/phường')
    return ward
  })
}
