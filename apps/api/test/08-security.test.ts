import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, headers, json, type Ctx } from './helpers.js'
import { q } from '../src/db.js'

/** Phase A acceptance: private uploads, trace publication gating, server-side logout. */
let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6300010000050001' +
    '0d0a2db40000000049454e44ae426082',
  'hex',
)

function multipart(h: Record<string, string>) {
  const boundary = '----agri-private-boundary'
  return {
    headers: { ...h, 'content-type': `multipart/form-data; boundary=${boundary}` },
    payload: Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="proof.png"\r\nContent-Type: image/png\r\n\r\n`),
      PNG,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]),
  }
}

async function uploadAs(h: Record<string, string>, url = '/api/v1/uploads') {
  const res = await ctx.app.inject({ method: 'POST', url, ...multipart(h) })
  expect(res.statusCode).toBe(201)
  return json<{ url: string }>(res)
}

describe('private uploads (§9 #9)', () => {
  it('is unreadable anonymously and by another customer, even with the exact URL', async () => {
    const mine = await uploadAs(await ctx.customer(1))
    const anonymous = await ctx.app.inject({ url: `/api/v1${mine.url}` })
    expect([401, 403, 404]).toContain(anonymous.statusCode)
    const other = await ctx.app.inject({ url: `/api/v1${mine.url}`, headers: await ctx.customer(2) })
    expect([401, 403, 404]).toContain(other.statusCode)
  })

  it('is readable by its owner and by an admin, always without public caching', async () => {
    const h1 = await ctx.customer(1)
    const mine = await uploadAs(h1)
    const own = await ctx.app.inject({ url: `/api/v1${mine.url}`, headers: h1 })
    expect(own.statusCode).toBe(200)
    expect(own.headers['cache-control']).toContain('private')

    const admin = await ctx.app.inject({ url: `/api/v1${mine.url}`, headers: await ctx.admin() })
    expect(admin.statusCode).toBe(200)
  })

  it('serves catalogue images uploaded by an admin to everybody', async () => {
    const product = await uploadAs(await ctx.admin(), '/api/v1/admin/uploads')
    const anonymous = await ctx.app.inject({ url: `/api/v1${product.url}` })
    expect(anonymous.statusCode).toBe(200)
    expect(anonymous.headers['cache-control']).toContain('public')
  })

  it('publishes trace evidence only while the batch trace itself is published', async () => {
    const admin = await ctx.admin()
    // Evidence is uploaded like a complaint/attachment (private), then attached as public evidence.
    const file = await uploadAs(admin)
    const batch = await q<{ id: string }>(`SELECT id FROM batches WHERE publication_status='PUBLISHED' LIMIT 1`)
    const attached = await ctx.app.inject({
      method: 'POST', url: '/api/v1/admin/evidence', headers: admin,
      payload: {
        owner_type: 'BATCH', owner_id: batch[0]!.id, url: file.url,
        mime: 'image/png', description: 'Phiếu kiểm nghiệm', is_public: true,
      },
    })
    expect(attached.statusCode).toBe(201)
    expect((await ctx.app.inject({ url: `/api/v1${file.url}` })).statusCode).toBe(200)

    await q(`UPDATE batches SET publication_status='DRAFT' WHERE id=$1`, [batch[0]!.id])
    try {
      expect((await ctx.app.inject({ url: `/api/v1${file.url}` })).statusCode).toBe(404)
    } finally {
      await q(`UPDATE batches SET publication_status='PUBLISHED' WHERE id=$1`, [batch[0]!.id])
    }
  })

  it('refuses evidence pointing at a file this server never stored', async () => {
    const res = await ctx.app.inject({
      method: 'POST', url: '/api/v1/admin/evidence', headers: await ctx.admin(),
      payload: {
        owner_type: 'BATCH', owner_id: '00000000-0000-4000-8000-000000000000',
        url: '/uploads/00000000000000000000000000000000.png', mime: 'image/png', is_public: true,
      },
    })
    expect(res.statusCode).toBe(422)
  })

  it('rejects traversal-style names and non-PNG bytes', async () => {
    const traversal = await ctx.app.inject({ url: '/api/v1/uploads/..%2F..%2Fpackage.json' })
    expect([400, 404, 422]).toContain(traversal.statusCode)
    const boundary = '----agri-bad'
    const bad = await ctx.app.inject({
      method: 'POST', url: '/api/v1/uploads',
      headers: { ...(await ctx.customer(1)), 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="x.png"\r\nContent-Type: image/png\r\n\r\n`),
        Buffer.from('<html><script>alert(1)</script></html>'),
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]),
    })
    expect(bad.statusCode).toBe(422)
  })
})

describe('server-side logout (§9 #10)', () => {
  it('revokes only the token that logged out', async () => {
    const first = await ctx.token('khach1@example.com', 'Khach@123456')
    const second = await ctx.token('khach1@example.com', 'Khach@123456')

    expect((await ctx.app.inject({ url: '/api/v1/me', headers: headers(first) })).statusCode).toBe(200)
    const out = await ctx.app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: headers(first) })
    expect(out.statusCode).toBe(200)

    expect((await ctx.app.inject({ url: '/api/v1/me', headers: headers(first) })).statusCode).toBe(401)
    expect((await ctx.app.inject({ url: '/api/v1/me', headers: headers(second) })).statusCode).toBe(200)
  })
})

describe('seed safety (§9 #11)', () => {
  it('refuses to TRUNCATE outside a test/demo database', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()
    execFile(
      process.execPath,
      ['--import', 'tsx', 'src/scripts/seed.ts'],
      {
        cwd: fileURLToPath(new URL('..', import.meta.url)),
        env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: 'postgres://nobody@127.0.0.1:1/none' },
      },
      (err, stdout, stderr) => resolve(`${stdout}${stderr}${err ? 'ERR' : ''}`),
    )
    expect(await promise).toContain('Refusing to seed')
  })
})
