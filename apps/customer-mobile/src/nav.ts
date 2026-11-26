import Constants from 'expo-constants'

export type Route =
  | { name: 'products'; q?: string; category?: string }
  | { name: 'product'; key: string }
  | { name: 'scan' }
  | { name: 'trace'; token: string }
  | { name: 'checkout'; code?: string }
  | { name: 'vouchers' }
  | { name: 'orders' }
  | { name: 'order'; id: string }
  | { name: 'review'; orderLineId: string; productName: string }
  | { name: 'reviews' }
  | { name: 'complaints' }
  | { name: 'complaint'; id: string }
  | { name: 'profile' }
  | { name: 'addresses' }
  | { name: 'security' }
  | { name: 'saved'; kind: 'favourites' | 'viewed' }

/** Tem mẫu printed on the demo packaging / QR card. */
export const DEMO_TRACE_TOKEN = 'demo-ca-chua-lo-0001'

/** Accepts a raw token or a full trace URL and pulls out the token. */
export const extractToken = (raw: string): string => {
  const t = raw.trim()
  const m = t.match(/\/t\/([^/?#\s]+)/)
  return m ? decodeURIComponent(m[1]!) : t
}

export interface Nav {
  push: (r: Route) => void
  pop: () => void
}

/**
 * Dev host: `expo start` serves the bundle from the machine's LAN IP, so a phone that reached
 * Expo can also reach the API and the storefront there. An explicit EXPO_PUBLIC_*_BASE wins.
 * ponytail: no discovery beyond that; set the two vars when the API runs on another box.
 */
const devHost = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost'

export const WEB_BASE =
  process.env.EXPO_PUBLIC_WEB_BASE ??
  (Constants.expoConfig?.extra?.webBase as string | undefined) ??
  `http://${devHost}:3000`

import { API_BASE } from './api'

/**
 * Seed images live in customer-web's public dir; uploaded files are served — and
 * authorized — by the API, so they must not be requested from the storefront host.
 */
export const imgUrl = (p: string | null | undefined) =>
  !p ? null : p.startsWith('http') ? p : p.startsWith('/uploads/') ? `${API_BASE}${p}` : `${WEB_BASE}${p}`
