'use client'

import { useState } from 'react'
import { Icon } from '@agrimarket/ui'
import { useCart } from '@/components/cart-provider'

/** Yellow "add to cart" affordance shared by grid cards and the buy box. */
export function QuickAdd({ product }: { product: { id: string; sku: string; name: string; slug: string; unit: string; base_price_vnd: number; image: string | null; available: number } }) {
  const { authed, setQuantity, addGuest, cart } = useCart()
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const out = product.available <= 0

  async function add() {
    setState('busy')
    try {
      const current = cart?.items.find((i) => i.product_id === product.id)?.quantity ?? 0
      if (authed) await setQuantity(product.id, Math.min(current + 1, product.available))
      else await addGuest({ product_id: product.id, quantity: 0, sku: product.sku, name: product.name, slug: product.slug, unit: product.unit, base_price_vnd: product.base_price_vnd, image: product.image, available: product.available }, 1)
      setState('done')
      setTimeout(() => setState('idle'), 1600)
    } catch {
      setState('error')
    }
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={out || state === 'busy'}
      aria-label={out ? `${product.name} hết hàng` : `Thêm ${product.name} vào giỏ`}
      className={`flex min-h-9 w-full items-center justify-center gap-1 rounded-md text-[12.5px] font-semibold transition-colors ${
        out
          ? 'cursor-not-allowed bg-ink-100 text-ink-500'
          : state === 'done'
            ? 'bg-brand-500 text-white'
            : 'bg-buy-500 text-ink-900 hover:bg-buy-600'
      }`}
    >
      <Icon name={state === 'done' ? 'check' : 'plus'} className="h-4 w-4" />
      {out ? 'Hết hàng' : state === 'done' ? 'Đã thêm' : state === 'error' ? 'Thử lại' : 'Thêm vào giỏ'}
    </button>
  )
}
