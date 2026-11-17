import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, json, type Ctx } from './helpers.js'

let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

describe('TC01/02/03/04 provenance gate', () => {
  it('TC01: public API refuses a batch without an effective PASS lab test', async () => {
    const admin = await ctx.admin()
    const seasons = await json(await ctx.app.inject({ url: '/api/v1/admin/seasons', headers: admin }))
    const seasonId = seasons[0].id as string
    const created = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/admin/batches',
      headers: admin,
      payload: {
        season_id: seasonId,
        code: 'LO-TC01',
        harvest_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        pack_date: new Date().toISOString().slice(0, 10),
        expiry_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        harvested_qty: 50,
      },
    })
    expect(created.statusCode).toBe(201)
    const batchId = created.json().id as string

    const publish = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/admin/batches/${batchId}/publish`,
      headers: admin,
      payload: {},
    })
    expect(publish.statusCode).toBe(422)
    expect(publish.json().error.message).toContain('kiểm nghiệm')
  })

  it('TC02: harvest before pesticide isolation date is rejected', async () => {
    const admin = await ctx.admin()
    const seasons = await json(await ctx.app.inject({ url: '/api/v1/admin/seasons', headers: admin }))
    const seasonId = seasons.find((s: { code: string }) => s.code === 'SS-2026-0001').id as string
    const detail = await json(
      await ctx.app.inject({ url: `/api/v1/admin/seasons/${seasonId}`, headers: admin }),
    )
    const pesticide = detail.logs.find((l: { activity: string }) => l.activity === 'PESTICIDE')
    const harvestTooEarly = pesticide.activity_at.slice(0, 10)

    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/admin/batches',
      headers: admin,
      payload: {
        season_id: seasonId,
        code: 'LO-TC02',
        harvest_date: harvestTooEarly,
        pack_date: harvestTooEarly,
        expiry_date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
        harvested_qty: 10,
      },
    })
    expect(res.statusCode).toBe(422)
    expect(res.json().error.code).toBe('INVALID_DATA')
    expect(res.json().error.field_errors.harvest_date).toBeTruthy()
  })

  it('TC02b: isolation gate uses the ICT calendar day, not UTC', async () => {
    const admin = await ctx.admin()
    const seasons = await json(await ctx.app.inject({ url: '/api/v1/admin/seasons', headers: admin }))
    const seasonId = seasons.find((s: { code: string }) => s.code === 'SS-2026-0001').id as string
    const detail = await json(
      await ctx.app.inject({ url: `/api/v1/admin/seasons/${seasonId}`, headers: admin }),
    )
    const minStr = String(detail.earliest_harvest_date).slice(0, 10)
    expect(minStr).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    const dayBefore = new Date(new Date(`${minStr}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10)
    const mk = (code: string, harvest: string) => ({
      season_id: seasonId,
      code,
      harvest_date: harvest,
      pack_date: harvest,
      expiry_date: new Date(new Date(`${harvest}T00:00:00Z`).getTime() + 20 * 86400000).toISOString().slice(0, 10),
      harvested_qty: 10,
    })

    const early = await ctx.app.inject({ method: 'POST', url: '/api/v1/admin/batches', headers: admin, payload: mk('LO-TC02B-EARLY', dayBefore) })
    expect(early.statusCode).toBe(422)
    expect(early.json().error.field_errors.harvest_date).toContain(minStr)

    const onDate = await ctx.app.inject({ method: 'POST', url: '/api/v1/admin/batches', headers: admin, payload: mk('LO-TC02B-OK', minStr) })
    expect(onDate.statusCode).toBe(201)
  })

  it('TC03: FAIL lab test locks the batch and blocks checkout', async () => {
    const admin = await ctx.admin()
    const customer = await ctx.customer(1)
    const products = await json(await ctx.app.inject({ url: '/api/v1/products?search=rau%20mu%E1%BB%91ng' }))
    const product = products.data[0]

    // The seeded muống batch is sellable; blank it out by failing its lab test.
    const batches = await json(await ctx.app.inject({ url: '/api/v1/admin/batches?search=LO-2026-0006', headers: admin }))
    const batchId = batches.data[0].id as string
    const fail = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/admin/batches/${batchId}/lab-tests`,
      headers: admin,
      payload: {
        laboratory: 'Chi cục BVTV',
        sampled_at: new Date().toISOString().slice(0, 10),
        resulted_at: new Date().toISOString().slice(0, 10),
        metrics: [{ metric: 'Dư lượng thuốc BVTV', measured_value: '0.4', unit: 'mg/kg', reference_limit: '≤0.05', result: 'FAIL' }],
      },
    })
    expect(fail.statusCode).toBe(201)
    expect(fail.json().overall_result).toBe('FAIL')

    const detail = await json(await ctx.app.inject({ url: `/api/v1/admin/batches/${batchId}`, headers: admin }))
    expect(detail.quality_status).toBe('FAIL')
    expect(detail.safety_status).toBe('HOLD')

    const quote = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/checkout/preview',
      headers: customer,
      payload: { items: [{ product_id: product.id, quantity: 1 }] },
    })
    expect(quote.statusCode).toBe(409)
    expect(quote.json().error.code).toBe('OUT_OF_STOCK')
  })

  it('TC04: QR trace returns farm/season/batch, hides drafts, blocks unknown tokens', async () => {
    const trace = await json(await ctx.app.inject({ url: '/api/v1/t/demo-ca-chua-lo-0001' }))
    expect(trace.batch.code).toBe('LO-2026-0001')
    expect(trace.farm.name).toContain('Đơn Dương')
    expect(trace.season.code).toMatch(/^SS-/)
    expect(trace.supplier.name).toBeTruthy()
    expect(trace.lab_tests[0].metrics.length).toBeGreaterThan(0)
    expect(trace.alert).toBeNull()
    // No contact PII anywhere in the public payload.
    expect(JSON.stringify(trace)).not.toMatch(/@|0901/)

    const unknown = await ctx.app.inject({ url: '/api/v1/t/khong-ton-tai-123456' })
    expect(unknown.statusCode).toBe(404)

    // Expired batch keeps its page but must raise the EXPIRED alert.
    const expired = await json(await ctx.app.inject({ url: '/api/v1/t/demo-ca-chua-het-han' }))
    expect(expired.alert.level).toBe('EXPIRED')
  })
})
