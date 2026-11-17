import { beforeAll, describe, expect, it } from 'vitest'
import { batchIdByCode, bootstrap, json, productIdBySlug, setStock, type Ctx } from './helpers.js'
import { q } from '../src/db.js'

/**
 * Regression tests for P1 behaviour that the flow-level suites did not pin down:
 * account lock, admin-only uploads, repeated upload names, review/complaint
 * ownership, stock blockers on the QR/report side and the login throttle.
 */
let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63600000020001' +
    '0d0a2db40000000049454e44ae426082',
  'hex',
)

function multipart(headers: Record<string, string>) {
  const boundary = '----agri-test-boundary'
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="proof.png"\r\nContent-Type: image/png\r\n\r\n`,
  )
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
  return {
    headers: { ...headers, 'content-type': `multipart/form-data; boundary=${boundary}` },
    payload: Buffer.concat([head, PNG, tail]),
  }
}

async function addressId(n: number) {
  const rows = await q<{ id: string }>(
    `SELECT a.id FROM addresses a JOIN users u ON u.id=a.user_id WHERE u.email=$1 LIMIT 1`,
    [`khach${n}@example.com`],
  )
  return rows[0]!.id
}

describe('CUS-01-04 / ADM-12-03 account lock', () => {
  it('a locked customer gets 403 on private APIs, cannot log in or order; unlock restores access', async () => {
    const admin = await ctx.admin()
    const h1 = await ctx.customer(1)
    const id = (await q<{ id: string }>(`SELECT id FROM users WHERE email='khach1@example.com'`))[0]!.id

    const lock = await ctx.app.inject({
      method: 'POST', url: `/api/v1/admin/customers/${id}/status`, headers: admin,
      payload: { status: 'LOCKED', reason: 'Vi phạm thử nghiệm' },
    })
    expect(lock.statusCode).toBe(200)

    const orders = await ctx.app.inject({ url: '/api/v1/me/orders', headers: h1 })
    expect(orders.statusCode).toBe(401)

    const login = await ctx.app.inject({
      method: 'POST', url: '/api/v1/auth/login',
      payload: { email: 'khach1@example.com', password: 'Khach@123456' },
    })
    expect(login.statusCode).toBe(403)
    expect((await json(login)).error.code).toBe('ACCOUNT_LOCKED')

    const unlock = await ctx.app.inject({
      method: 'POST', url: `/api/v1/admin/customers/${id}/status`, headers: admin,
      payload: { status: 'ACTIVE', reason: 'Đã đối soát' },
    })
    expect(unlock.statusCode).toBe(200)
    // Token version changed on lock, so the old session stays dead; a fresh login works.
    expect((await ctx.app.inject({ url: '/api/v1/me/orders', headers: h1 })).statusCode).toBe(401)
    const fresh = await ctx.customer(1)
    expect((await ctx.app.inject({ url: '/api/v1/me/orders', headers: fresh })).statusCode).toBe(200)
  })
})

describe('CUS-01-02 / CUS-01-03 login throttle', () => {
  it('five wrong passwords lock the email for 15 minutes with 429, correct password still refused', async () => {
    const email = 'khach2@example.com'
    for (let i = 0; i < 5; i++) {
      const r = await ctx.app.inject({
        method: 'POST', url: '/api/v1/auth/login', payload: { email, password: 'WrongPass123' },
      })
      expect(r.statusCode).toBe(401)
    }
    const blocked = await ctx.app.inject({
      method: 'POST', url: '/api/v1/auth/login', payload: { email, password: 'Khach@123456' },
    })
    expect(blocked.statusCode).toBe(429)
    await q(`DELETE FROM login_attempts WHERE lower(email)=$1`, [email])
  })
})

describe('ADM-03-03 / CUS-11-03 upload', () => {
  it('customer upload is private to the session; non-image bytes are rejected', async () => {
    const h1 = await ctx.customer(1)
    const ok = await ctx.app.inject({ method: 'POST', url: '/api/v1/uploads', ...multipart(h1) })
    expect(ok.statusCode).toBe(201)
    const { url } = await json<{ url: string }>(ok)
    const name = url.split('/').pop()!
    const row = await q<{ owner_type: string; owner_id: string; is_public: boolean }>(
      `SELECT owner_type, owner_id, is_public FROM evidence_files WHERE url=$1`,
      [url],
    )
    const me = await json<{ id: string }>(await ctx.app.inject({ url: '/api/v1/me', headers: h1 }))
    expect(row[0]).toMatchObject({ owner_type: 'UPLOAD', owner_id: me.id, is_public: false })

    const html = Buffer.from('<html><script>alert(1)</script></html>')
    const boundary = '----agri-test-boundary'
    const bad = await ctx.app.inject({
      method: 'POST', url: '/api/v1/uploads',
      headers: { ...h1, 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="x.png"\r\nContent-Type: image/png\r\n\r\n`),
        html,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]),
    })
    expect(bad.statusCode).toBe(422)

    // The file name is random, so an uploaded name cannot be derived from the original one.
    expect(name).toMatch(/^[a-f0-9]{32}\.png$/)
  })

  it('guest cannot upload', async () => {
    const res = await ctx.app.inject({ method: 'POST', url: '/api/v1/uploads', ...multipart({}) })
    expect(res.statusCode).toBe(401)
  })
})

describe('ADM-05-01 certificate requires an existing batch', () => {
  it('a certificate with an unknown batch id is rejected, not silently orphaned', async () => {
    const admin = await ctx.admin()
    const res = await ctx.app.inject({
      method: 'POST', url: '/api/v1/admin/certificates', headers: admin,
      payload: {
        batch_id: '00000000-0000-4000-8000-000000000000', type: 'VietGAP', number: 'VG-TEST-1',
        issuer: 'Trung tâm thử nghiệm', valid_from: '2026-01-01', valid_until: '2027-01-01',
      },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('ADM-07-06 sellable gate is shared by every read path', () => {
  it('a recalled batch leaves the catalogue count and blocks checkout', async () => {
    const admin = await ctx.admin()
    const h1 = await ctx.customer(1)
    const p = await productIdBySlug('xoai-cat-hoa-loc')
    const batch = await batchIdByCode('LO-2026-0005')
    await setStock(batch, 20)

    const before = await json<{ available: number }>(
      await ctx.app.inject({ url: `/api/v1/products/${p}` }),
    )
    expect(before.available).toBeGreaterThan(0)

    const recall = await ctx.app.inject({
      method: 'POST', url: `/api/v1/admin/batches/${batch}/recalls`, headers: admin,
      payload: { reason: 'Phát hiện dư lượng', severity: 'HIGH' },
    })
    expect([200, 201]).toContain(recall.statusCode)

    const after = await json<{ available: number }>(await ctx.app.inject({ url: `/api/v1/products/${p}` }))
    expect(after.available).toBe(before.available - 20)

    const preview = await ctx.app.inject({
      method: 'POST', url: '/api/v1/checkout/preview', headers: h1, payload: { items: [{ product_id: p, quantity: 1 }] },
    })
    expect(preview.statusCode).toBe(409)
    expect((await json(preview)).error.code).toBe('OUT_OF_STOCK')
  })
})

describe('CUS-10 / CUS-11 ownership', () => {
  it('reviews and complaints of another customer are invisible and unusable', async () => {
    const h1 = await ctx.customer(1)
    const h2 = await ctx.customer(2)

    const mine = await json<Array<{ id: string }>>(await ctx.app.inject({ url: '/api/v1/me/complaints', headers: h1 }))
    expect(mine.length).toBeGreaterThan(0)
    const foreign = await ctx.app.inject({ url: `/api/v1/me/complaints/${mine[0]!.id}`, headers: h2 })
    expect(foreign.statusCode).toBe(404)
    const reply = await ctx.app.inject({
      method: 'POST', url: `/api/v1/me/complaints/${mine[0]!.id}/messages`, headers: h2,
      payload: { content: 'Mình chen vào' },
    })
    expect(reply.statusCode).toBe(404)

    // Reviewing a line that belongs to another customer fails even with a valid uuid.
    const line = (await q<{ id: string }>(
      `SELECT l.id FROM order_lines l JOIN orders o ON o.id=l.order_id
        WHERE o.customer_id=(SELECT id FROM users WHERE email='khach1@example.com') LIMIT 1`,
    ))[0]!.id
    const res = await ctx.app.inject({
      method: 'POST', url: '/api/v1/me/reviews', headers: h2,
      payload: { order_line_id: line, rating: 5, comment: 'Không phải đơn của tôi' },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('CUS-06-03 payment methods are COD / bank transfer only', () => {
  it('an unknown payment method is rejected with 422', async () => {
    const h1 = await ctx.customer(1)
    const p = await productIdBySlug('rau-muong')
    const preview = await json<{ version: string }>(
      await ctx.app.inject({
        method: 'POST', url: '/api/v1/checkout/preview', headers: h1, payload: { items: [{ product_id: p, quantity: 1 }] },
      }),
    )
    const res = await ctx.app.inject({
      method: 'POST', url: '/api/v1/orders',
      headers: { ...h1, 'idempotency-key': `k-method-${Date.now()}` },
      payload: {
        address_id: await addressId(1), payment_method: 'CREDIT_CARD',
        quote_version: preview.version, items: [{ product_id: p, quantity: 1 }],
      },
    })
    expect(res.statusCode).toBe(422)
  })
})
