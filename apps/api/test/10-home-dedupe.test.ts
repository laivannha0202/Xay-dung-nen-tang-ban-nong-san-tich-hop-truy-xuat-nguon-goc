import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, type Ctx } from './helpers.js'
import { uniqueById, type HomePayload } from '@agrimarket/core'

/**
 * Regression for "Encountered two children with the same key": storefront rows key cards by
 * product id, so a product repeated inside one payload row (or across rows) duplicates the key.
 */
let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

describe('home payload has no repeated product', () => {
  it('featured and newest do not overlap', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/v1/home' })
    expect(res.statusCode).toBe(200)
    const body = res.json() as HomePayload
    const featured = new Set(body.featured.map((p) => p.id))
    expect(body.newest.filter((p) => featured.has(p.id))).toEqual([])
  })

  it('a row that repeats an id keeps one copy', () => {
    const a = { id: 'a' }
    const b = { id: 'b' }
    expect(uniqueById([a, b, a, b, a])).toEqual([a, b])
  })
})
