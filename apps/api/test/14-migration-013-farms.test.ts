import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, type Ctx } from './helpers.js'
import { q } from '../src/db.js'

/**
 * Migration 013 creates the Sóc Trăng / Cà Mau origin farms. They are illustrative: they must carry
 * `is_demo`, must not present an invented manager as a real contact, and the seasons moved onto them
 * must keep their lots — the passport of a past harvest may not lose its origin.
 */
let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

describe('migration 013 origin farms', () => {
  it('is flagged demo and invents no manager contact', async () => {
    const rows = await q<{ name: string; is_demo: boolean; manager_name: string; manager_phone: string }>(
      `SELECT name, is_demo, manager_name, manager_phone FROM farms
        WHERE name IN ('Ruộng lúa Sóc Trăng','Rừng tràm U Minh Hạ') ORDER BY name`,
    )
    expect(rows).toHaveLength(2)
    for (const r of rows) {
      expect({ name: r.name, is_demo: r.is_demo }).toEqual({ name: r.name, is_demo: true })
      expect({ name: r.name, manager: r.manager_name, phone: r.manager_phone })
        .toEqual({ name: r.name, manager: '', phone: '' })
    }
  })

  it('keeps the seasons on a farm that still owns their lots', async () => {
    const bad = await q<{ code: string }>(
      `SELECT s.code FROM crop_seasons s LEFT JOIN farms f ON f.id = s.farm_id
        WHERE s.code IN ('SS-2026-0005','SS-2026-0006') AND f.id IS NULL`,
    )
    expect(bad).toEqual([])
    const moved = await q<{ code: string; farm_name: string }>(
      `SELECT s.code, f.name AS farm_name FROM crop_seasons s JOIN farms f ON f.id=s.farm_id
        WHERE s.code IN ('SS-2026-0005','SS-2026-0006') ORDER BY s.code`,
    )
    expect(moved.map((r) => r.farm_name)).toEqual(['Ruộng lúa Sóc Trăng', 'Rừng tràm U Minh Hạ'])
  })

  it('still serves the passport of a lot grown there', async () => {
    const res = await ctx.app.inject({ url: '/api/v1/t/demo-gao-st25' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.farm.name).toBe('Ruộng lúa Sóc Trăng')
    // No PII on the public passport, regardless of the farm's manager columns.
    expect(JSON.stringify(body)).not.toMatch(/0913666777|Trương Văn Lộc/)
  })
})
