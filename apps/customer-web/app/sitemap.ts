import type { MetadataRoute } from 'next'
import { serverFetch } from '@/lib/api'
import type { HomePayload } from '@agrimarket/core'

const SITE = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'

/** Static routes plus every published product and active category; no admin/auth routes. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [home, list] = await Promise.all([
    serverFetch<HomePayload>('/home', undefined, 300),
    serverFetch<{ data: Array<{ slug: string; created_at?: string }> }>('/products?pageSize=100', undefined, 300),
  ])
  const now = new Date()
  return [
    { url: SITE, lastModified: now, priority: 1 },
    { url: `${SITE}/san-pham`, lastModified: now, priority: 0.9 },
    { url: `${SITE}/tim-kiem`, lastModified: now, priority: 0.5 },
    ...['giao-hang', 'doi-tra', 'bao-mat'].map((s) => ({ url: `${SITE}/chinh-sach/${s}`, lastModified: now, priority: 0.3 })),
    ...(home?.categories ?? []).map((c) => ({ url: `${SITE}/danh-muc/${c.slug}`, lastModified: now, priority: 0.8 })),
    ...(list?.data ?? []).map((p) => ({
      url: `${SITE}/san-pham/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : now,
      priority: 0.7,
    })),
  ]
}
