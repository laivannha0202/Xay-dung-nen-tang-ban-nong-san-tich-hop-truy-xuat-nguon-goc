import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, type Ctx } from './helpers.js'

let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

/**
 * Regressions for the printed-document audit:
 *  - a phiếu kho needs product/unit per movement, so the single-movement endpoint must keep them
 *  - the demo warehouse must read as the Hưng Yên store, not the old HCM placeholder
 */
describe('print documents', () => {
  it('single movement carries what the phiếu prints', async () => {
    const admin = await ctx.admin()
    const list = await ctx.app.inject({ url: '/api/v1/admin/stock/movements?pageSize=1', headers: admin })
    const id = list.json().data[0].id as string
    const res = await ctx.app.inject({ url: `/api/v1/admin/stock/movements/${id}`, headers: admin })
    expect(res.statusCode).toBe(200)
    const m = res.json()
    expect(m.product_name).toBeTruthy()
    expect(m.unit).toBeTruthy()
    expect(m.warehouse_name).toBeTruthy()
    expect(m.batch_code).toBeTruthy()
  })

  it('unknown movement 404s instead of printing an empty sheet', async () => {
    const res = await ctx.app.inject({
      url: '/api/v1/admin/stock/movements/00000000-0000-4000-8000-000000000000',
      headers: await ctx.admin(),
    })
    expect(res.statusCode).toBe(404)
  })

  it('demo warehouse is the Hưng Yên hub', async () => {
    const res = await ctx.app.inject({ url: '/api/v1/admin/warehouses', headers: await ctx.admin() })
    const rows = res.json() as Array<{ code: string; name: string; address: string }>
    expect(rows).toHaveLength(1)
    expect(rows[0]!.code).toBe('KHO-HY')
    expect(rows[0]!.name).not.toMatch(/HCM|Hồ Chí Minh/)
    expect(rows[0]!.address).toMatch(/Hưng Yên/)
  })
})
