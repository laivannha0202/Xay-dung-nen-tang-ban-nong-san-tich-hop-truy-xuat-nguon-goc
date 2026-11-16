export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1'

export interface ApiError {
  code: string
  message: string
  field_errors?: Record<string, string>
  [key: string]: unknown
}

export class ApiFailure extends Error {
  constructor(
    public status: number,
    public payload: ApiError,
  ) {
    super(payload.message)
  }
}

function extractError(status: number, body: unknown): ApiFailure {
  const payload = (body as { error?: ApiError } | null)?.error ?? {
    code: 'UNKNOWN',
    message: 'Đã xảy ra lỗi. Vui lòng thử lại.',
  }
  return new ApiFailure(status, payload)
}

/** Server-side fetch: forwards the session cookie and never caches personal data. */
export async function serverFetch<T>(path: string, cookie?: string, revalidate = 0): Promise<T | null> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: cookie ? { cookie } : undefined,
    cache: revalidate > 0 ? undefined : 'no-store',
    next: revalidate > 0 ? { revalidate } : undefined,
  })
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
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw extractError(res.status, body)
  return body as T
}
