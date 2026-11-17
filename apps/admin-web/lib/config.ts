export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1'
/** Storefront host, used for "view public page", QR links and the 404 fallback. */
export const CUSTOMER_WEB = process.env.NEXT_PUBLIC_CUSTOMER_WEB ?? 'http://localhost:3000'
/**
 * Stored uploads live on the API; seeded catalogue paths (/images/...) are served by the
 * storefront. Admin has no copy of those files, so they must be absolute to the customer host.
 */
export const mediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`
  if (url.startsWith('/')) return `${CUSTOMER_WEB}${url}`
  return url
}
