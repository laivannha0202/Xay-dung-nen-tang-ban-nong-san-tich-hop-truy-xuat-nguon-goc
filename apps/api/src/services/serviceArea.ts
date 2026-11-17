import { q, txq, type Tx } from '../db.js'
import { AppError } from '../lib/errors.js'

/**
 * Service area = the 104 commune-level units of post-merger Hưng Yên (Nghị quyết
 * 1666/NQ-UBTVQH15). Checkout is only ever validated against this local dataset —
 * no third-party geocoding at order time.
 */
export const PROVINCE = { code: '33', name: 'Tỉnh Hưng Yên' } as const

export interface Ward {
  code: string
  name: string
  type: string
  province_code: string
  in_service_area: boolean
}

/** Diacritic-insensitive, lowercase, single-spaced — same shape as `wards.search_text`. */
export function normalizeVi(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export const SERVICE_AREA_OUT = 'SERVICE_AREA_UNAVAILABLE'
export const ADDRESS_NEEDS_UPDATE = 'ADDRESS_NEEDS_UPDATE'

export function serviceAreaError(): AppError {
  return new AppError(
    409,
    SERVICE_AREA_OUT,
    'AgriMarket hiện chỉ giao hàng trong tỉnh Hưng Yên. Vui lòng chọn lại xã/phường nhận hàng.',
  )
}

export function addressNeedsUpdateError(): AppError {
  return new AppError(
    409,
    ADDRESS_NEEDS_UPDATE,
    'Địa chỉ này được nhập trước khi cập nhật địa giới. Vui lòng chọn lại xã/phường để tiếp tục.',
  )
}

/** Ward active for delivery, or the matching error (never silently coerced). */
export async function requireServiceableWard(c: Tx | null, code: string | null | undefined): Promise<Ward> {
  if (!code) throw addressNeedsUpdateError()
  const sql = `SELECT code, name, type, province_code, in_service_area FROM wards WHERE code = $1`
  const rows = c ? await txq<Ward>(c, sql, [code]) : await q<Ward>(sql, [code])
  const ward = rows[0]
  if (!ward || ward.province_code !== PROVINCE.code || !ward.in_service_area) throw serviceAreaError()
  return ward
}

export async function serviceAreaSummary() {
  const row = await q<{ total: number; active: number; version: string }>(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE in_service_area)::int AS active,
            MAX(dataset_version) AS version
       FROM wards WHERE province_code = $1`,
    [PROVINCE.code],
  )
  return {
    province: PROVINCE,
    dataset_version: row[0]?.version ?? '',
    ward_count: row[0]?.total ?? 0,
    serviceable_ward_count: row[0]?.active ?? 0,
    ship_fee_vnd: 20_000,
    free_ship_threshold_vnd: 500_000,
  }
}
