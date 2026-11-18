'use client'

import { useState } from 'react'
import { Icon } from '@agrimarket/ui'
import { useCart } from '@/components/cart-provider'

/** One-tap add from a grid card. Guests keep the local cart, so no login wall here. */
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
      aria-label={out ? `${product.name} tạm hết hàng` : `Thêm ${product.name} vào giỏ`}
      className={`mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border text-[13px] font-semibold transition-colors ${
        out
          ? 'border-ink-200 bg-ink-50 text-ink-600'
          : state === 'done'
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-600 hover:bg-brand-600 hover:text-white'
      }`}
    >
      <Icon name={state === 'done' ? 'check' : 'plus'} className="h-4 w-4" />
      {out ? 'Tạm hết hàng' : state === 'done' ? 'Đã thêm' : state === 'error' ? 'Thử lại' : 'Thêm vào giỏ'}
    </button>
  )
}
