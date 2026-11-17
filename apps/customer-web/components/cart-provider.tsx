'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import type { ServiceArea } from '@agrimarket/core'

export interface CartItem {
  product_id: string
  quantity: number
  sku: string
  name: string
  slug: string
  unit: string
  base_price_vnd: number
  status: string
  image: string | null
  available: number
  is_available: boolean
  line_total_vnd: number
}

export interface Cart {
  items: CartItem[]
  subtotal_vnd: number
  ship_fee_estimate_vnd: number
  total_estimate_vnd: number
  free_ship_threshold_vnd?: number
  service_area?: ServiceArea
  item_count: number
}

/** What the browser needs to remember while the shopper is not logged in. */
export interface GuestLine {
  product_id: string
  quantity: number
  sku: string
  name: string
  slug: string
  unit: string
  base_price_vnd: number
  image: string | null
  available: number
}

interface CartState {
  cart: Cart | null
  count: number
  loading: boolean
  authed: boolean
  refresh: () => Promise<void>
  setQuantity: (productId: string, quantity: number) => Promise<void>
  addGuest: (line: GuestLine, quantity: number) => Promise<void>
  clear: () => Promise<void>
}

const STORAGE_KEY = 'agri.guest-cart.v1'
const FREE_SHIP_THRESHOLD = 500_000
const BASE_SHIP_FEE = 20_000

const CartCtx = createContext<CartState | null>(null)

function readGuest(): GuestLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as GuestLine[]) : []
  } catch {
    return []
  }
}

function writeGuest(lines: GuestLine[]) {
  if (lines.length === 0) window.localStorage.removeItem(STORAGE_KEY)
  else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
}

/** A guest cart is only an estimate: prices and stock are re-checked at checkout. */
function toCart(lines: GuestLine[]): Cart {
  const items: CartItem[] = lines.map((l) => ({
    product_id: l.product_id,
    quantity: l.quantity,
    sku: l.sku,
    name: l.name,
    slug: l.slug,
    unit: l.unit,
    base_price_vnd: l.base_price_vnd,
    status: 'ACTIVE',
    image: l.image,
    available: l.available,
    is_available: l.available >= l.quantity,
    line_total_vnd: Math.round(l.quantity * l.base_price_vnd),
  }))
  const subtotal = items.reduce((s, i) => s + i.line_total_vnd, 0)
  const ship = subtotal >= FREE_SHIP_THRESHOLD ? 0 : BASE_SHIP_FEE
  return {
    items,
    subtotal_vnd: subtotal,
    ship_fee_estimate_vnd: ship,
    total_estimate_vnd: subtotal + ship,
    item_count: items.length,
  }
}

export function CartProvider({ authed, children }: { authed: boolean; children: React.ReactNode }) {
  const [server, setServer] = useState<Cart | null>(null)
  const [guest, setGuest] = useState<GuestLine[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!authed) {
      setServer(null)
      return
    }
    setLoading(true)
    try {
      setServer(await api<Cart>('/me/cart'))
    } catch {
      setServer(null)
    } finally {
      setLoading(false)
    }
  }, [authed])

  // CUS-05-04: a guest cart lives in the browser until the shopper logs in.
  useEffect(() => {
    if (!authed) {
      setGuest(readGuest())
      return
    }
    // On login the local cart is pushed to the server, then dropped. The server is
    // authoritative for both quantity and availability after the merge.
    const pending = readGuest()
    void (async () => {
      for (const line of pending) {
        try {
          await api(`/me/cart/items/${line.product_id}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity: line.quantity }),
          })
        } catch {
          // A product that went away must not block the rest of the merge.
        }
      }
      if (pending.length > 0) writeGuest([])
      setGuest([])
      await refresh()
    })()
  }, [authed, refresh])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const persist = useCallback((next: GuestLine[]) => {
    setGuest(next)
    writeGuest(next)
  }, [])

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!authed) {
        persist(guest.map((l) => (l.product_id === productId ? { ...l, quantity } : l)).filter((l) => l.quantity > 0))
        return
      }
      setServer(await api<Cart>(`/me/cart/items/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }))
    },
    [authed, guest, persist],
  )

  const addGuest = useCallback(
    async (line: GuestLine, quantity: number) => {
      const existing = guest.find((l) => l.product_id === line.product_id)
      const next = existing
        ? guest.map((l) => (l.product_id === line.product_id ? { ...l, quantity: l.quantity + quantity } : l))
        : [...guest, { ...line, quantity }]
      persist(next)
    },
    [guest, persist],
  )

  const clear = useCallback(async () => {
    if (!authed) {
      persist([])
      return
    }
    setServer(await api<Cart>('/me/cart', { method: 'DELETE' }))
  }, [authed, persist])

  const cart = authed ? server : toCart(guest)

  const value = useMemo(
    () => ({ cart, count: cart?.item_count ?? 0, loading, authed, refresh, setQuantity, addGuest, clear }),
    [cart, loading, authed, refresh, setQuantity, addGuest, clear],
  )
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export function useCart(): CartState {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart needs CartProvider')
  return ctx
}
