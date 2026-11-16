'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'

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
  item_count: number
}

interface CartState {
  cart: Cart | null
  count: number
  loading: boolean
  refresh: () => Promise<void>
  setQuantity: (productId: string, quantity: number) => Promise<void>
  clear: () => Promise<void>
}

const CartCtx = createContext<CartState | null>(null)

export function CartProvider({ authed, children }: { authed: boolean; children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!authed) {
      setCart(null)
      return
    }
    setLoading(true)
    try {
      setCart(await api<Cart>('/me/cart'))
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [authed])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setQuantity = useCallback(async (productId: string, quantity: number) => {
    setCart(await api<Cart>(`/me/cart/items/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }))
  }, [])

  const clear = useCallback(async () => {
    setCart(await api<Cart>('/me/cart', { method: 'DELETE' }))
  }, [])

  const value = useMemo(
    () => ({ cart, count: cart?.item_count ?? 0, loading, refresh, setQuantity, clear }),
    [cart, loading, refresh, setQuantity, clear],
  )
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export function useCart(): CartState {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart needs CartProvider')
  return ctx
}
