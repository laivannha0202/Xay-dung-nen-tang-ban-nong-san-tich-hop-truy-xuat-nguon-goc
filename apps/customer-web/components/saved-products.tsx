'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@agrimarket/ui'
import { api } from '@/lib/api'
import { ProductCard } from '@/components/product-card'
import { favourites, recentlyViewed } from '@/lib/memory'
import type { Product } from '@agrimarket/core'

const GRID = 'grid grid-cols-2 gap-x-2.5 gap-y-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'

/**
 * Products the shopper saved on this device, re-read from the API so price, stock and
 * "hết hàng" are today's facts, not yesterday's snapshot.
 */
export function SavedProducts({ kind }: { kind: 'favourites' | 'viewed' }) {
  const [rows, setRows] = useState<Product[] | null>(null)
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    const ids = kind === 'favourites' ? favourites.read() : recentlyViewed.read()
    if (ids.length === 0) {
      setRows([])
      setEmpty(true)
      return
    }
    void api<{ data: Product[] }>(`/products/by-ids?ids=${ids.join(',')}`)
      .then((r) => {
        // Keep the device's own order: most recent / most wanted first.
        const byId = new Map(r.data.map((p) => [p.id, p]))
        setRows(ids.map((id) => byId.get(id)).filter((p): p is Product => !!p))
      })
      .catch(() => setRows([]))
  }, [kind])

  if (rows === null) {
    return (
      <div className={GRID}>
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton aspect-[3/4]" />)}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-[var(--radius-panel)] border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-600">
        {empty && kind === 'favourites' ? (
          <>
            Chưa có sản phẩm yêu thích. Bấm <Icon name="heart" className="mx-0.5 inline h-4 w-4" /> trên trang sản phẩm để lưu lại.{' '}
            <Link href="/san-pham" className="font-semibold text-brand-700 underline">Xem sản phẩm</Link>
          </>
        ) : (
          'Chưa có sản phẩm nào. Hãy xem vài sản phẩm để chúng hiện lại ở đây.'
        )}
      </p>
    )
  }

  return (
    <div className={GRID}>
      {rows.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}

/** Home-page strip: hides itself entirely until the shopper has viewed something. */
export function RecentlyViewedRow() {
  const [has, setHas] = useState<boolean | null>(null)
  useEffect(() => setHas(recentlyViewed.read().length > 0), [])
  if (!has) return null
  return (
    <section>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink-200 pb-2">
        <h2 className="text-[19px] leading-tight font-bold tracking-tight text-ink-900 sm:text-[21px]">
          Đã xem gần đây
          <span className="ml-2 text-[12.5px] font-medium text-ink-500">Trên thiết bị này</span>
        </h2>
        <Link href="/da-xem" className="inline-flex min-h-9 items-center gap-1 text-[13px] font-semibold text-brand-700 hover:underline">
          Xem tất cả <Icon name="chevronRight" className="h-3.5 w-3.5" />
        </Link>
      </div>
      <SavedProducts kind="viewed" />
    </section>
  )
}
