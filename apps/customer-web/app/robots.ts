import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'

/** Private account pages and the token index stay out of search engines. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/tai-khoan', '/gio-hang', '/thanh-toan', '/doi-mat-khau', '/dat-hang-thanh-cong'] }],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
