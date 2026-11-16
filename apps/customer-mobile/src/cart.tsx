import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'
import { useAuth } from './auth'

export interface CartItem {
  product_id: string
  sku: string
  slug: string
  name: string
  image: string | null
  quantity: number
  unit: string
  base_price_vnd: number
  line_total_vnd: number
  available: number
  is_available: boolean
}

export interface Cart {
  items: CartItem[]
  subtotal_vnd: number
  total_estimate_vnd: number
  item_count: number
}

interface CartCtx {
  cart: Cart | null
  count: number
  add: (productId: string, quantity: number) => Promise<void>
  setQty: (productId: string, quantity: number) => Promise<void>
  reload: () => Promise<void>
}

const CartState = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)

  const reload = useCallback(async () => {
    setCart(user ? await api<Cart>('/me/cart') : null)
  }, [user])

  useEffect(() => {
    void reload().catch(() => setCart(null))
  }, [reload])

  const setQty = useCallback(async (productId: string, quantity: number) => {
    setCart(await api<Cart>(`/me/cart/items/${productId}`, { method: 'PUT', body: { quantity } }))
  }, [])

  const add = useCallback(
    async (productId: string, quantity: number) => {
      const current = cart?.items.find((i) => i.product_id === productId)?.quantity ?? 0
      await setQty(productId, current + quantity)
    },
    [cart, setQty],
  )

  const value = useMemo(
    () => ({ cart, count: cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0, add, setQty, reload }),
    [cart, add, setQty, reload],
  )
  return <CartState.Provider value={value}>{children}</CartState.Provider>
}

export function useCart(): CartCtx {
  const ctx = useContext(CartState)
  if (!ctx) throw new Error('useCart needs CartProvider')
  return ctx
}
