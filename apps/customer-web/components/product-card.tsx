import Link from 'next/link'
import { vnd } from '@/lib/format'
import { mediaUrl } from '@/lib/config'
import { Icon } from '@agrimarket/ui'
import type { Product } from '@agrimarket/core'
import { QuickAdd } from '@/components/quick-add'

/**
 * Storefront product card: 4:3 photo, category tag, origin line, price with unit,
 * rating, stock line and a one-tap add. Server component — only QuickAdd is client.
 */
export function ProductCard({ product }: { product: Product }) {
  const out = Number(product.available ?? 0) <= 0
  const img = mediaUrl(product.image)
  const origin = product.origin_note?.replace(/\.$/, '') ?? null
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white transition-shadow duration-200 hover:border-brand-200 hover:shadow-[var(--shadow-card)]">
      <Link href={`/san-pham/${product.slug}`} className="relative block aspect-4/3 overflow-hidden bg-brand-50">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <span className="grid h-full place-items-center text-brand-300"><Icon name="leaf" className="h-8 w-8" /></span>
        )}
        <span className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
          {product.has_batch_promo && !out && (
            <span className="badge border-0 bg-sand-500 text-white ring-0">Lô cận hạn</span>
          )}
          {out && <span className="badge border-0 bg-ink-900/85 text-white ring-0">Tạm hết hàng</span>}
        </span>
        {product.category_name && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-ink-700 shadow-sm">
            {product.category_name}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col px-3 pt-3 pb-3">
        <Link href={`/san-pham/${product.slug}`} className="line-clamp-2 text-[13.5px] leading-snug font-semibold text-ink-900 group-hover:text-brand-700">
          {product.name}
        </Link>
        {origin && (
          <p className="mt-1 flex items-center gap-1 truncate text-[11.5px] text-ink-500">
            <Icon name="pin" className="h-3 w-3 shrink-0 text-brand-600" /> {origin}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-2 pt-2.5">
          <p className="text-lg font-bold tracking-tight text-brand-800">
            {vnd(product.base_price_vnd)}
            <span className="text-[11.5px] font-normal text-ink-500">/{product.unit}</span>
          </p>
          {product.review_count ? (
            <p className="flex items-center gap-0.5 text-[11.5px] text-sand-700">
              <Icon name="star" className="h-3.5 w-3.5" filled />
              {Number(product.rating).toFixed(1)}
              <span className="text-ink-400">({product.review_count})</span>
            </p>
          ) : (
            <p className="text-[11px] text-ink-400">Chưa đánh giá</p>
          )}
        </div>
        <p className={`mt-1 text-[11.5px] ${out ? 'text-rose-700' : 'text-ink-500'}`}>
          {out ? 'Đang chờ lô mới' : `Còn ${product.available} ${product.unit} từ lô đang bán`}
        </p>
        <QuickAdd product={{ id: product.id, sku: product.sku, name: product.name, slug: product.slug, unit: product.unit, base_price_vnd: product.base_price_vnd, image: product.image, available: Number(product.available ?? 0) }} />
      </div>
    </article>
  )
}
