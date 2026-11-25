import Constants from 'expo-constants'

const fallback = 'http://localhost:4000/api/v1'

/**
 * API base: app.json `extra.apiBase`, overridable with EXPO_PUBLIC_API_BASE.
 * For a physical device use the machine's LAN IP (http://192.168.x.x:4000/api/v1),
 * because `localhost` resolves to the phone itself.
 */
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? (Constants.expoConfig?.extra?.apiBase as string | undefined) ?? fallback

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message)
  }
}

let token: string | null = null
export const setToken = (v: string | null) => {
  token = v
}
export const getToken = () => token

interface Init extends Omit<RequestInit, 'body'> {
  body?: unknown
}

/** Bearer-authenticated JSON call; the token is held in memory + SecureStore by the caller. */
export async function api<T>(path: string, init: Init = {}): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' }
  if (init.body !== undefined) headers['content-type'] = 'application/json'
  if (token) headers.authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    // Network failure gets its own code: the caller cannot know whether the server acted.
    throw new ApiError(0, 'NETWORK', 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.')
  }
  const data = (await res.json().catch(() => null)) as
    | { error?: { code: string; message: string; field_errors?: Record<string, string> } }
    | null
  if (!res.ok) {
    const e = data?.error
    throw new ApiError(res.status, e?.code ?? 'UNKNOWN', e?.message ?? 'Đã xảy ra lỗi.', e?.field_errors)
  }
  return data as T
}
