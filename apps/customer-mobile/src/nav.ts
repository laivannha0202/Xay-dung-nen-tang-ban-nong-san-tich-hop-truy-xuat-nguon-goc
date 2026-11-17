import Constants from 'expo-constants'

export type Route =
  | { name: 'product'; key: string }
  | { name: 'trace'; token: string }
  | { name: 'checkout' }
  | { name: 'orders' }
  | { name: 'order'; id: string }
  | { name: 'review'; orderLineId: string; productName: string }
  | { name: 'reviews' }
  | { name: 'complaints' }
  | { name: 'profile' }

export interface Nav {
  push: (r: Route) => void
  pop: () => void
}

/**
 * Web base for storefront images. On a real phone `localhost` is the phone itself,
 * so pass EXPO_PUBLIC_WEB_BASE=http://<LAN-IP>:3000 (see .env.example).
 */
export const WEB_BASE =
  process.env.EXPO_PUBLIC_WEB_BASE ??
  (Constants.expoConfig?.extra?.webBase as string | undefined) ??
  'http://localhost:3000'

import { API_BASE } from './api'

/**
 * Seed images live in customer-web's public dir; uploaded files are served — and
 * authorized — by the API, so they must not be requested from the storefront host.
 */
export const imgUrl = (p: string | null | undefined) =>
  !p ? null : p.startsWith('http') ? p : p.startsWith('/uploads/') ? `${API_BASE}${p}` : `${WEB_BASE}${p}`
