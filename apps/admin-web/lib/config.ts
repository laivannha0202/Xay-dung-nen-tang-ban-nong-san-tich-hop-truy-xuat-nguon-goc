export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1'
/** Stored uploads are served (and authorized) by the API, not by this app. */
export const mediaUrl = (url: string | null | undefined): string | null =>
  url && url.startsWith('/uploads/') ? `${API_BASE}${url}` : (url ?? null)
/** Storefront host, used for "view public page", QR links and the 404 fallback. */
export const CUSTOMER_WEB = process.env.NEXT_PUBLIC_CUSTOMER_WEB ?? 'http://localhost:3000'
