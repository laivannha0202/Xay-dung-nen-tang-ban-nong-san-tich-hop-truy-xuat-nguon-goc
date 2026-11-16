export type Route =
  | { name: 'product'; key: string }
  | { name: 'trace'; token: string }
  | { name: 'checkout' }
  | { name: 'orders' }
  | { name: 'order'; id: string }

export interface Nav {
  push: (r: Route) => void
  pop: () => void
}

/** API base host for product images (the web app serves /public). */
export const WEB_BASE = process.env.EXPO_PUBLIC_WEB_BASE ?? 'http://localhost:3000'

export const imgUrl = (p: string | null | undefined) =>
  p ? (p.startsWith('http') ? p : `${WEB_BASE}${p}`) : null
