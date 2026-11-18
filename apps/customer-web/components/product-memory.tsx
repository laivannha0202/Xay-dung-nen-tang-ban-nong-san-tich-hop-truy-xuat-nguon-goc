'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@agrimarket/ui'
import { favourites, recentlyViewed } from '@/lib/memory'

/** Heart toggle on the buy box; state is per device, like the rest of the memory. */
export function FavoriteButton({ productId, name }: { productId: string; name: string }) {
  const [on, setOn] = useState(false)
  useEffect(() => setOn(favourites.has(productId)), [productId])
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Bỏ ${name} khỏi yêu thích` : `Lưu ${name} vào yêu thích`}
      onClick={() => setOn(favourites.toggle(productId))}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border transition-colors ${
        on ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-ink-200 text-ink-500 hover:border-rose-200 hover:text-rose-600'
      }`}
    >
      <Icon name="heart" className="h-5 w-5" filled={on} />
    </button>
  )
}

/** Records the visit once the page is on screen; feeds "đã xem gần đây". */
export function RememberView({ productId }: { productId: string }) {
  useEffect(() => {
    recentlyViewed.add(productId)
  }, [productId])
  return null
}
