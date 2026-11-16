/**
 * One tone per status string, shared by web and mobile so a "RECALLED" batch never
 * looks green on one client and red on another.
 */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

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

export const toneFor = (status: string | null | undefined): Tone =>
  (status && TONES[status]) || 'neutral'

/** Tailwind classes per tone; the admin and storefront share the same palette. */
export const TONE_CLASS: Record<Tone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}
