/** Money and quantity are formatted identically on the website and the app. */
export const vnd = (n: number | string | null | undefined): string =>
  `${Math.round(Number(n ?? 0)).toLocaleString('vi-VN')}₫`

export const qty = (n: number | string | null | undefined): string => {
  const v = Number(n ?? 0)
  return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

/**
 * `orders.discount_vnd` is the sum of per-batch markdown and the voucher. The voucher part is
 * named on `promotion_snapshot`; the remainder is the batch promotion. Two different things, so
 * every receipt prints them on separate lines instead of one ambiguous "Giảm giá".
 */
export function discountSplit(order: {
  discount_vnd: number | string
  promotion_snapshot?: unknown
}): { lot_vnd: number; voucher_vnd: number } {
  const total = Math.max(0, Math.round(Number(order.discount_vnd ?? 0)))
  const snap = order.promotion_snapshot as { discount_vnd?: number } | null | undefined
  const voucher = Math.min(total, Math.max(0, Math.round(Number(snap?.discount_vnd ?? 0))))
  return { lot_vnd: total - voucher, voucher_vnd: voucher }
}

/**
 * What the courier may still collect on delivery. Zero for a paid order, and zero for a
 * cancelled or failed one: money is never collected for goods that will not be handed over.
 * `paid_vnd` must be the sum of every PAID receipt, not one arbitrary row.
 */
export function codDue(order: {
  payment_method: string
  status: string
  total_vnd: number | string
  paid_vnd?: number | string | null
}): number {
  if (order.payment_method !== 'COD') return 0
  if (order.status === 'CANCELLED' || order.status === 'DELIVERY_FAILED') return 0
  return Math.max(0, Math.round(Number(order.total_vnd ?? 0)) - Math.round(Number(order.paid_vnd ?? 0)))
}

/** Step for a quantity stepper: 0,5 for kg/lít, whole packs for bó/gói/hộp/quả/nải/chai. */
export const qtyStep = (unit: string): number =>
  ({ kg: 0.5, g: 1, gram: 1, 'lít': 0.5, lit: 0.5, ml: 1 } as Record<string, number>)[unit.trim().toLowerCase()] ?? 1

export const dateVN = (v: string | null | undefined): string =>
  v
    ? new Date(v).toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—'

/** Short day/month label for chart axes. */
export const dayVN = (v: string | null | undefined): string =>
  v ? new Date(v).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' }) : '—'

export const dateTimeVN = (v: string | null | undefined): string =>
  v
    ? new Date(v).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

/** Order lifecycle wording shared by every client. */
export const ORDER_STATUS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  DELIVERY_FAILED: 'Giao thất bại',
}

export const PAYMENT_STATUS: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  PARTIALLY_REFUNDED: 'Hoàn một phần',
  REFUNDED: 'Đã hoàn tiền',
}

export const PAYMENT_METHOD: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
}

/** The steps a customer sees on the tracking timeline, in order. */
export const ORDER_TIMELINE: Array<{ key: string; label: string }> = [
  { key: 'PENDING', label: 'Đặt hàng' },
  { key: 'CONFIRMED', label: 'Xác nhận' },
  { key: 'PREPARING', label: 'Chuẩn bị hàng' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Đã giao' },
  { key: 'COMPLETED', label: 'Hoàn tất' },
]

export const ACTIVITY_LABEL: Record<string, string> = {
  TILLING: 'Làm đất',
  SOWING: 'Gieo trồng',
  FERTILIZING: 'Bón phân',
  PESTICIDE: 'Phun thuốc BVTV',
  IRRIGATION: 'Tưới nước',
  PRUNING: 'Tỉa cành',
  HARVEST: 'Thu hoạch',
  OTHER: 'Khác',
}

export const COMPLAINT_TYPE: Record<string, string> = {
  QUALITY: 'Chất lượng',
  DAMAGED: 'Hư hỏng',
  WRONG_ITEM: 'Sai hàng',
  SUSPECTED_FAKE: 'Nghi hàng giả',
  OTHER: 'Khác',
}

export const COMPLAINT_STATUS: Record<string, string> = {
  NEW: 'Mới',
  PROCESSING: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
}

export const QUALITY_STATUS: Record<string, string> = {
  PENDING: 'Chờ kiểm nghiệm',
  PASS: 'Đạt',
  FAIL: 'Không đạt',
}

export const PUBLICATION_STATUS: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã công khai',
  UNPUBLISHED: 'Ngừng công khai',
}

export const SAFETY_STATUS: Record<string, string> = {
  NORMAL: 'Bình thường',
  HOLD: 'Tạm giữ',
  RECALLED: 'Thu hồi',
}

export const RECALL_SEVERITY: Record<string, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Nghiêm trọng',
}

/** Free shipping threshold promised on the storefront, in VND. */
export const FREE_SHIPPING_FROM_VND = 500_000
