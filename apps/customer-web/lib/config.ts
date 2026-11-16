/** The storefront never renders admin links; this is the only cross-site URL it knows. */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1'
export const ADMIN_WEB = process.env.NEXT_PUBLIC_ADMIN_WEB ?? 'http://localhost:3001'

/**
 * Uploads live on the API origin (`/uploads/:name`), seed images in the Next public dir.
 * ponytail: plain <img> everywhere — add next/image + remotePatterns when bandwidth matters.
 */
export const mediaUrl = (url: string | null | undefined): string | null =>
  url && url.startsWith('/uploads/') ? `${API_BASE.replace(/\/api\/v1$/, '')}${url}` : (url ?? null)
