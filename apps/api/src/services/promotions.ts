import { q, txq, type Tx } from '../db.js'
import { roundVnd } from './invariants.js'

/**
 * One rule set for "is this voucher usable", shared by the offer list, the wallet
 * and checkout. A saved voucher is never trusted on its own: its window, its
 * remaining uses and the cart total are re-read from `promotions` every time.
 *
 * Usage policy: `usage_limit` caps a program for its whole lifetime — it does not
 * refill each month. `promotions.used_count` is the single source of truth and the
 * same column `consumePromotionUse` guards on in SQL, so a list can never promise a
 * use that submit then refuses. `used_count` rises once per placed order and never
 * falls: a cancelled order keeps its use until a refund policy is decided.
 */
export interface PromotionRow {
  id: string
  code: string
  name: string
  type: 'PERCENT' | 'AMOUNT'
  value: number
  start_at: string
  end_at: string
  usage_limit: number | null
  used_count: number
  min_subtotal_vnd: number
  status: 'ACTIVE' | 'INACTIVE'
}

export type PromotionState =
  | 'AVAILABLE' // usable now with this subtotal (and stock, for EVERYONE)
  | 'UPCOMING'
  | 'EXPIRED'
  | 'PAUSED'
  | 'USED_UP'
  | 'MIN_SUBTOTAL'
  | 'INVALID'

export interface PromotionView extends PromotionRow {
  state: PromotionState
  /** Why it is not usable, in words a shopper can act on. Empty when AVAILABLE. */
  reason: string
  /** VND of goods still missing before the minimum is met (0 otherwise). */
  remaining_vnd: number
  /** What the shopper would save with the given subtotal; 0 until eligible. */
  discount_vnd: number
  saved: boolean
}

export const PROMOTION_SELECT = `
  SELECT p.id, p.code, p.name, p.type, p.value, p.start_at, p.end_at,
         p.usage_limit, p.used_count, p.min_subtotal_vnd, p.status
    FROM promotions p`

/** Discount this promotion grants on a goods total, never above the goods total. */
export function discountFor(type: 'PERCENT' | 'AMOUNT', value: number, subtotal: number): number {
  return type === 'PERCENT' ? roundVnd((subtotal * value) / 100) : Math.min(value, subtotal)
}

/**
 * Locates the reason a voucher cannot be used right now.
 * `subtotal = null` means the caller has no cart (the public board): the program's own
 * state is still reported, but its minimum is a condition to print, not a verdict.
 */
export function promotionState(
  p: PromotionRow,
  subtotal: number | null,
  now = new Date(),
): PromotionState {
  if (p.status !== 'ACTIVE') return 'PAUSED'
  if (now < new Date(p.start_at)) return 'UPCOMING'
  if (now >= new Date(p.end_at)) return 'EXPIRED'
  if (p.usage_limit !== null && p.used_count >= p.usage_limit) return 'USED_UP'
  if (subtotal !== null && subtotal < p.min_subtotal_vnd) return 'MIN_SUBTOTAL'
  return 'AVAILABLE'
}

const pct = (n: number) => n.toLocaleString('vi-VN')

export function promotionReason(
  p: PromotionRow,
  state: PromotionState,
  subtotal: number | null,
): string {
  const min = `${pct(p.min_subtotal_vnd)}₫`
  switch (state) {
    case 'PAUSED':
      return 'Chương trình đang tạm dừng.'
    case 'UPCOMING':
      return `Chương trình bắt đầu từ ${new Date(p.start_at).toLocaleDateString('vi-VN')}.`
    case 'EXPIRED':
      return `Mã đã hết hạn từ ${new Date(p.end_at).toLocaleDateString('vi-VN')}.`
    case 'USED_UP':
      return 'Mã đã hết lượt sử dụng.'
    case 'MIN_SUBTOTAL':
      return `Đơn tối thiểu ${min} — còn thiếu ${pct(Math.max(0, p.min_subtotal_vnd - (subtotal ?? 0)))}₫.`
    case 'INVALID':
      return 'Mã khuyến mãi không tồn tại.'
    default:
      return ''
  }
}

export function toView(
  p: PromotionRow,
  subtotal: number | null,
  saved: boolean,
  now = new Date(),
): PromotionView {
  const state = promotionState(p, subtotal, now)
  return {
    ...p,
    state,
    reason: promotionReason(p, state, subtotal),
    remaining_vnd:
      state === 'MIN_SUBTOTAL' && subtotal !== null ? Math.max(0, p.min_subtotal_vnd - subtotal) : 0,
    discount_vnd:
      state === 'AVAILABLE' && subtotal !== null ? discountFor(p.type, p.value, subtotal) : 0,
    saved,
  }
}

/**
 * Programs whose window is open; a paused, ended or not-yet-started one is never
 * advertised. One that is live but out of uses is listed, and says so on its card.
 */
export async function listPublicPromotions(c: Tx | null): Promise<PromotionRow[]> {
  const sql = `${PROMOTION_SELECT}
    WHERE p.status = 'ACTIVE' AND now() BETWEEN p.start_at AND p.end_at
    ORDER BY p.end_at ASC, p.code`
  return c ? txq<PromotionRow>(c, sql) : q<PromotionRow>(sql)
}

/** The signed-in shopper's wallet, joined against the live program. */
export async function listWallet(c: Tx | null, customerId: string): Promise<PromotionRow[]> {
  const sql = `${PROMOTION_SELECT}
     JOIN customer_saved_promotions sp ON sp.promotion_id = p.id AND sp.customer_id = $1
    ORDER BY sp.saved_at DESC`
  return c ? txq<PromotionRow>(c, sql, [customerId]) : q<PromotionRow>(sql, [customerId])
}

export async function savedCodes(c: Tx | null, customerId: string): Promise<Set<string>> {
  const sql = `SELECT p.code FROM customer_saved_promotions sp JOIN promotions p ON p.id = sp.promotion_id
                WHERE sp.customer_id = $1`
  const rows = c ? await txq<{ code: string }>(c, sql, [customerId]) : await q<{ code: string }>(sql, [customerId])
  return new Set(rows.map((r) => r.code))
}

/** One promotion by code, or null. Used by checkout; never trusts the client beyond the code. */
export async function promotionByCode(c: Tx, code: string): Promise<PromotionRow | null> {
  const rows = await txq<PromotionRow>(c, `${PROMOTION_SELECT} WHERE upper(p.code) = upper($1)`, [code])
  return rows[0] ?? null
}

/**
 * Consumes one use of a limited program inside the caller's transaction. The guard
 * lives in SQL, so two orders racing for the last use cannot both succeed: the
 * loser gets 0 rows and its whole order is rolled back, refunding nothing but stock.
 * The window and status are re-checked here too, so a program paused between the
 * quote and the commit cannot still take a use.
 */
export async function consumePromotionUse(c: Tx, promotionId: string): Promise<void> {
  const rows = await txq<{ id: string }>(
    c,
    `UPDATE promotions SET used_count = used_count + 1
      WHERE id = $1
        AND (usage_limit IS NULL OR used_count < usage_limit)
        AND status = 'ACTIVE'
        AND now() BETWEEN start_at AND end_at
      RETURNING id`,
    [promotionId],
  )
  if (rows.length === 0) throw new PromotionUsedUp()
}

/** Carries the code the route maps to a friendly 409 instead of a generic failure. */
export class PromotionUsedUp extends Error {
  constructor() {
    super('Mã khuyến mãi vừa hết lượt sử dụng.')
  }
}
