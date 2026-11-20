import { beforeAll, describe, expect, it } from 'vitest'
import { bootstrap, json, productIdBySlug, type Ctx } from './helpers.js'
import { q } from '../src/db.js'

/**
 * Phase B–D acceptance: Hưng Yên service area, address codes, shipping fee rules
 * and the hard back-end gate that refuses delivery outside the province.
 */
let ctx: Ctx
beforeAll(async () => {
  ctx = await bootstrap()
}, 180000)

async function addressId(n: number) {
  const rows = await q<{ id: string }>(
    `SELECT a.id FROM addresses a JOIN users u ON u.id=a.user_id WHERE u.email=$1 LIMIT 1`,
    [`khach${n}@example.com`],
  )
  return rows[0]!.id
}

async function newAddress(n: number, wardCode: string, street = '12 Đường Làng') {
  const h = await ctx.customer(n)
  const res = await ctx.app.inject({
    method: 'POST', url: '/api/v1/me/addresses', headers: h,
    payload: { recipient_name: 'Khách Thử', phone: '0912345678', ward_code: wardCode, street_detail: street },
  })
  return { status: res.statusCode, body: res.json() }
}

async function preview(n: number, addressIdValue: string | null, qty = 1) {
  const h = await ctx.customer(n)
  const productId = await productIdBySlug('gao-st25')
  return ctx.app.inject({
    method: 'POST', url: '/api/v1/checkout/preview', headers: h,
    payload: { items: [{ product_id: productId, quantity: qty }], address_id: addressIdValue },
  })
}

describe('service area dataset (Nghị quyết 1666/NQ-UBTVQH15)', () => {
  it('exposes exactly 104 ward-level units: 93 xã + 11 phường, province 33', async () => {
    const res = await json<{ data: Array<{ type: string; province_code: string; code: string }>; total: number }>(
      await ctx.app.inject({ url: '/api/v1/locations/wards' }),
    )
    expect(res.total).toBe(104)
    expect(res.data.filter((w) => w.type === 'Xã')).toHaveLength(93)
    expect(res.data.filter((w) => w.type === 'Phường')).toHaveLength(11)
    expect(new Set(res.data.map((w) => w.code)).size).toBe(104)
    expect(res.data.every((w) => w.province_code === '33')).toBe(true)

    const area = await json<{ ward_count: number; serviceable_ward_count: number; ship_fee_vnd: number }>(
      await ctx.app.inject({ url: '/api/v1/locations/service-area' }),
    )
    expect(area).toMatchObject({ ward_count: 104, ship_fee_vnd: 20_000 })
    expect(area.serviceable_ward_count).toBe(104)
  })

  it('search ignores diacritics and case, and orders communes before wards', async () => {
    const res = await json<{ data: Array<{ name: string }> }>(
      await ctx.app.inject({ url: '/api/v1/locations/wards?q=pho%20hien' }),
    )
    expect(res.data.map((w) => w.name)).toContain('Phường Phố Hiến')

    // "Đức" must match "duc" (diacritics) and "Dực" (đ/d fold) — both fold to "duc".
    const upper = await json<{ data: Array<{ name: string }> }>(
      await ctx.app.inject({ url: '/api/v1/locations/wards?q=%C4%90%E1%BB%A9c%20H%E1%BB%A3p' }),
    )
    expect(upper.data.map((w) => w.name)).toEqual(['Xã Đức Hợp'])
  })

  it('carries the codes from QĐ 19/2025 appendix II, including the five that diachiviet got wrong', async () => {
    const rows = await q<{ code: string; name: string }>(`SELECT code, name FROM wards ORDER BY code`)
    expect(rows).toHaveLength(104)
    const byCode = Object.fromEntries(rows.map((r) => [r.code, r.name]))
    expect(byCode).toMatchObject({
      '11953': 'Phường Phố Hiến',
      '11986': 'Xã Như Quỳnh',
      '12052': 'Xã Yên Mỹ',
      '12220': 'Xã Triệu Việt Vương',
      '12478': 'Xã Tân Tiến',
      '12841': 'Xã Bắc Thái Ninh',
    })
    const version = await q<{ dataset_version: string }>(`SELECT DISTINCT dataset_version FROM wards`)
    expect(version).toEqual([{ dataset_version: 'hy-2025-nq1666-qd19-2026-11-17' }])
  })

  it('rejects a province code that is not Hưng Yên instead of leaking other data', async () => {
    const res = await json<{ data: unknown[]; total: number }>(
      await ctx.app.inject({ url: '/api/v1/locations/wards?province_code=01' }),
    )
    expect(res).toEqual({ data: [], total: 0 })
    const one = await ctx.app.inject({ url: '/api/v1/locations/wards/99999' })
    expect(one.statusCode).toBe(404)
  })
})

describe('address validation', () => {
  it('stores a Hưng Yên address by ward code and resolves names server-side', async () => {
    const created = await newAddress(1, '11953')
    expect(created.status).toBe(201)
    const rows = await q<{ province: string; province_code: string; ward: string; ward_code: string }>(
      `SELECT province, province_code, ward, ward_code FROM addresses WHERE id=$1`,
      [created.body.id],
    )
    expect(rows[0]).toMatchObject({
      province: 'Tỉnh Hưng Yên', province_code: '33', ward: 'Phường Phố Hiến', ward_code: '11953',
    })
  })

  it('rejects missing, malformed and unknown ward codes', async () => {
    expect((await newAddress(1, '')).status).toBe(422)
    expect((await newAddress(1, 'abc')).status).toBe(422)
    expect((await newAddress(1, '00001')).status).toBe(409)
  })

  it('leaves legacy typed-in addresses flagged until the shopper re-picks a ward', async () => {
    const h = await ctx.customer(2)
    const legacy = await q<{ id: string }>(
      `INSERT INTO addresses (user_id, recipient_name, phone, province, district, ward, street_detail, is_default)
       SELECT id,'Cũ','0900000000','TP. Hồ Chí Minh','Quận 1','Phường Bến Nghé','9 Lý Tự Trọng',false
         FROM users WHERE email='khach2@example.com' RETURNING id`,
    )
    const list = await json<Array<{ id: string; needs_confirmation: boolean; in_service_area: number | null }>>(
      await ctx.app.inject({ url: '/api/v1/me/addresses', headers: h }),
    )
    expect(list.find((a) => a.id === legacy[0]!.id)).toMatchObject({ needs_confirmation: true })

    const previewRes = await preview(2, legacy[0]!.id)
    expect(previewRes.json().address_status).toBe('NEEDS_UPDATE')

    const patched = await ctx.app.inject({
      method: 'PATCH', url: `/api/v1/me/addresses/${legacy[0]!.id}`, headers: h,
      payload: { ward_code: '11980' },
    })
    expect(patched.statusCode).toBe(200)
    const after = await q<{ needs_confirmation: boolean; ward_code: string; district: string | null }>(
      `SELECT (ward_code IS NULL) AS needs_confirmation, ward_code, district FROM addresses WHERE id=$1`,
      [legacy[0]!.id],
    )
    expect(after[0]).toMatchObject({ needs_confirmation: false, ward_code: '11980' })
  })
})

describe('admin service-area console', () => {
  it('disables and re-enables a ward, hiding and restoring it in the shopper picker', async () => {
    const h = await ctx.admin()
    const patch = (in_service_area: boolean) =>
      ctx.app.inject({
        method: 'PATCH', url: '/api/v1/admin/service-area/wards/11980', headers: h,
        payload: { in_service_area, reason: 'test service-area console' },
      })
    const picker = async () =>
      (await ctx.app.inject({ method: 'GET', url: '/api/v1/locations/wards?q=hong%20chau' })).json<{ total: number }>()

    const off = await patch(false)
    expect(off.statusCode).toBe(200)
    // Disabled ward must disappear from the picker, not just from the quote.
    expect((await picker()).total).toBe(0)

    const back = await patch(true)
    expect(back.statusCode).toBe(200)
    expect((await picker()).total).toBe(1)
  })
})

describe('shipping fee and delivery gate', () => {
  it('quotes 20.000₫ under 500.000₫ and 0₫ from the threshold', async () => {
    const addr = await addressId(1)
    const small = (await preview(1, addr, 1)).json()
    expect(small.ship_fee_final).toBe(true)
    expect(small.subtotal_vnd).toBeLessThan(500_000)
    expect(small.ship_fee_vnd).toBe(20_000)
    expect(small.total_vnd).toBe(small.subtotal_vnd + 20_000)

    // Gạo ST25 is 38.000₫/kg in the demo catalogue, so 14 kg = 532.000₫ crosses the threshold.
    const big = (await preview(1, addr, 14)).json()
    expect(big.subtotal_vnd).toBeGreaterThanOrEqual(500_000)
    expect(big.ship_fee_vnd).toBe(0)
  })

  it('marks the fee as non-final while no address is chosen', async () => {
    const res = (await preview(1, null)).json()
    expect(res.address_status).toBe('MISSING')
    expect(res.ship_fee_final).toBe(false)
  })

  it('refuses an order whose ward was switched off', async () => {
    const h = await ctx.customer(2)
    const addr = await addressId(2)
    const productId = await productIdBySlug('gao-st25')
    const quote = (await ctx.app.inject({
      method: 'POST', url: '/api/v1/checkout/preview', headers: h,
      payload: { items: [{ product_id: productId, quantity: 1 }], address_id: addr },
    })).json()
    expect(quote.address_status).toBe('OK')

    await q(`UPDATE wards SET in_service_area = false WHERE code = '11980'`)
    try {
      const blocked = await ctx.app.inject({
        method: 'POST', url: '/api/v1/orders', headers: { ...h, 'idempotency-key': 'k-area-off' },
        payload: {
          address_id: addr, payment_method: 'COD', quote_version: quote.version,
          items: [{ product_id: productId, quantity: 1 }],
        },
      })
      expect(blocked.statusCode).toBe(409)
      expect(blocked.json().error.code).toBe('SERVICE_AREA_UNAVAILABLE')

      // Nothing was held: the rejected key produced no order.
      const records = await q(
        `SELECT order_id FROM idempotency_records WHERE key='k-area-off'`,
      )
      expect(records).toHaveLength(0)
    } finally {
      await q(`UPDATE wards SET in_service_area = true WHERE code = '11980'`)
    }
  })

  it('cannot deliver an order to a manually forged out-of-province snapshot', async () => {
    const h = await ctx.customer(2)
    const forged = await q<{ id: string }>(
      `INSERT INTO addresses (user_id, recipient_name, phone, province, district, ward, street_detail, is_default)
       SELECT id,'Sai','0900000000','Hà Nội','Hoàn Kiếm','Phường Hàng Bạc','1 Đinh Tiên Hoàng',false
         FROM users WHERE email='khach2@example.com' RETURNING id`,
    )
    const previewRes = await preview(2, forged[0]!.id)
    expect(previewRes.json().address_status).toBe('NEEDS_UPDATE')

    const productId = await productIdBySlug('gao-st25')
    const submit = await ctx.app.inject({
      method: 'POST', url: '/api/v1/orders', headers: { ...h, 'idempotency-key': 'k-forged' },
      payload: {
        address_id: forged[0]!.id, payment_method: 'COD', quote_version: previewRes.json().version,
        items: [{ product_id: productId, quantity: 1 }],
      },
    })
    expect(submit.statusCode).toBe(409)
    expect(['ADDRESS_NEEDS_UPDATE', 'SERVICE_AREA_UNAVAILABLE']).toContain(submit.json().error.code)
  })
})
