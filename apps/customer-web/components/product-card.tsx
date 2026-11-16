import Link from 'next/link'
import { vnd, qty } from '@/lib/format'
import { mediaUrl } from '@/lib/config'
import { Icon } from '@agrimarket/ui'
import type { Product } from '@agrimarket/core'

export function ProductCard({ product }: { product: Product }) {
  const out = Number(product.available ?? 0) <= 0
  const img = mediaUrl(product.image)
  return (
    <Link
      href={`/san-pham/${product.slug}`}
      className="card group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[var(--shadow-card)]"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-brand-50/60">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="grid h-full place-items-center text-brand-300">
            <Icon name="leaf" className="h-8 w-8" />
          </span>
        )}
        {product.has_batch_promo && !out && (
          <span className="badge absolute top-2 left-2 bg-sand-500 text-white ring-transparent">Lô cận hạn</span>
        )}
        {out && <span className="badge absolute top-2 left-2 bg-ink-800/85 text-white ring-transparent">Tạm hết hàng</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-ink-900">{product.name}</p>
        {product.category_name && <p className="text-xs text-ink-500">{product.category_name}</p>}
        <div className="mt-auto flex items-baseline justify-between gap-2 pt-2">
          <p className="font-semibold text-brand-800">
            {vnd(product.base_price_vnd)}
            <span className="text-xs font-normal text-ink-500">/{product.unit}</span>
          </p>
          {product.review_count ? (
            <p className="flex items-center gap-0.5 text-xs text-sand-700">
              <Icon name="star" className="h-3.5 w-3.5" filled />
              {Number(product.rating).toFixed(1)}
              <span className="text-ink-400">({product.review_count})</span>
            </p>
          ) : null}
        </div>
        {!out && (
          <p className="text-xs text-ink-500">
            Còn {qty(product.available)} {product.unit}
          </p>
        )}
      </div>
    </Link>
  )
}
