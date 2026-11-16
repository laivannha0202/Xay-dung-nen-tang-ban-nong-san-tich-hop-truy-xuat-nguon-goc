import { ApiFailure, extractError } from './api-error'

let baseUrl = 'http://localhost:4000/api/v1'

/** Called once per app so every client shares one fetch layer. */
export function configureApi(options: { baseUrl: string }): void {
  baseUrl = options.baseUrl.replace(/\/$/, '')
}

export const apiBase = (): string => baseUrl

/** Next's fetch understands `next.revalidate`; plain DOM typing does not. */
type NextInit = RequestInit & { next?: { revalidate: number } }

/**
 * Server-side fetch: forwards the session cookie and never caches personal data.
 * `revalidate > 0` is only for public catalogue data.
 */
export async function serverFetch<T>(path: string, cookie?: string, revalidate = 0): Promise<T | null> {
  const init: NextInit = {
    headers: cookie ? { cookie } : undefined,
    cache: revalidate > 0 ? undefined : 'no-store',
  }
  if (revalidate > 0) init.next = { revalidate }
  const res = await fetch(`${baseUrl}${path}`, init)
  if (res.status === 404) return null
  if (!res.ok) throw extractError(res.status, await res.json().catch(() => null))
  return (await res.json()) as T
}

/** Browser fetch: cookies included, CSRF marker attached for mutations. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  // FormData must keep the browser-generated multipart boundary; only JSON gets the header.
  if (init.body && !(init.body instanceof FormData) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  if (method !== 'GET') headers.set('x-agri-csrf', '1')
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers, credentials: 'include' })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw extractError(res.status, body)
  return body as T
}

/** Reads the message the API sent, with a fallback that never leaks a stack trace. */
export function errorMessage(e: unknown, fallback = 'Không thực hiện được.'): string {
  if (e instanceof ApiFailure) {
    const fields = e.payload.field_errors
    return fields ? Object.values(fields).join(' ') : e.payload.message
  }
  return fallback
}
