import { cookies } from 'next/headers'
import { API_BASE } from '@/lib/config'

const ALLOWED: Record<string, true> = { orders: true, inventory: true }

/**
 * Streams the API's CSV to the browser. The admin API is on another origin and needs the
 * session cookie, so the download cannot be a plain <a href> to :4000 — this hop adds it
 * and passes the bytes through untouched.
 */
export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params
  if (!ALLOWED[kind]) return new Response('không hỗ trợ', { status: 404 })

  const url = new URL(req.url)
  const qs = new URLSearchParams(url.searchParams)
  qs.set('format', 'csv')
  const jar = await cookies()
  const res = await fetch(`${API_BASE}/admin/${kind}?${qs}`, {
    headers: { cookie: jar.toString() },
    cache: 'no-store',
  })
  if (!res.ok) return new Response('không tải được', { status: res.status })
  return new Response(res.body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': res.headers.get('content-disposition') ?? `attachment; filename="${kind}.csv"`,
      'cache-control': 'no-store',
    },
  })
}
