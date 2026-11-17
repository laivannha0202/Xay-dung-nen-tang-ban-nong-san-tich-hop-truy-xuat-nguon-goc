/**
 * One tone per status string, shared by web and mobile so a "RECALLED" batch never
 * looks green on one client and red on another.
 */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand'

const TONES: Record<string, Tone> = {
  // orders
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'info',
  SHIPPING: 'info',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  DELIVERY_FAILED: 'danger',
  // payment
  UNPAID: 'warning',
  PAID: 'success',
  PARTIALLY_REFUNDED: 'info',
  REFUNDED: 'neutral',
  // quality / publication / safety
  PASS: 'success',
  FAIL: 'danger',
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  UNPUBLISHED: 'neutral',
  NORMAL: 'success',
  HOLD: 'warning',
  RECALLED: 'danger',
  // complaints, refunds, recalls
  NEW: 'warning',
  PROCESSING: 'info',
  RESOLVED: 'success',
  CLOSED: 'neutral',
  APPROVED: 'info',
  REJECTED: 'danger',
  OPEN: 'danger',
  // accounts, suppliers, products
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'warning',
  LOCKED: 'danger',
  // recall severity
  LOW: 'neutral',
  MEDIUM: 'warning',
  HIGH: 'danger',
}

/**
 * Vietnamese wording for every enum the API can return. Clients pass an explicit label when
 * the context differs (e.g. `DRAFT` on a batch vs a review); this is the safe default so a raw
 * `PENDING` never leaks into an admin table.
 */
export const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã huỷ',
  DELIVERY_FAILED: 'Giao thất bại',
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  PARTIALLY_REFUNDED: 'Hoàn một phần',
  REFUNDED: 'Đã hoàn tiền',
  PASS: 'Đạt',
  FAIL: 'Không đạt',
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã công khai',
  UNPUBLISHED: 'Ngừng công khai',
  NORMAL: 'Bình thường',
  HOLD: 'Tạm giữ',
  RECALLED: 'Thu hồi',
  NEW: 'Mới',
  PROCESSING: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  OPEN: 'Đang mở',
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  SUSPENDED: 'Tạm đình chỉ',
  LOCKED: 'Đã khoá',
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Nghiêm trọng',
  VISIBLE: 'Đang hiển thị',
  HIDDEN: 'Đã ẩn',
  EXPIRED: 'Hết hạn',
}

export const toneFor = (status: string | null | undefined): Tone =>
  (status && TONES[status]) || 'neutral'

/** Tailwind classes per tone; the admin and storefront share the same palette. */
export const TONE_CLASS: Record<Tone, string> = {
  success: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  warning: 'bg-sand-50 text-sand-700 ring-sand-500/25',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  info: 'bg-ink-100 text-ink-700 ring-ink-400/30',
  neutral: 'bg-ink-100 text-ink-600 ring-ink-300/40',
  brand: 'bg-brand-100 text-brand-800 ring-brand-600/25',
}
