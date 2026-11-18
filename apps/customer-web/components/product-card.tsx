import Link from 'next/link'
import { vnd } from '@/lib/format'
import { mediaUrl } from '@/lib/config'
import { Icon } from '@agrimarket/ui'
import type { Product } from '@agrimarket/core'
import { QuickAdd } from '@/components/quick-add'

/**
 * Storefront tile: photo first, price loud, one tap to add. Stock detail (which lots, how many
 * kilos) belongs on the product page — a grid card only needs to answer "what, how much, buy".
 */
export function ProductCard({ product }: { product: Product }) {
  const out = Number(product.available ?? 0) <= 0
  const img = mediaUrl(product.image)
  const discount = product.has_batch_promo && !out ? 'Ưu đãi' : null

  return (
    <article className="group relative flex flex-col rounded-[var(--radius-card)] border border-transparent bg-white transition-shadow duration-150 hover:border-ink-200 hover:shadow-[var(--shadow-card)]">
      <div className="relative aspect-square overflow-hidden rounded-t-[var(--radius-card)] bg-ink-100">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <span className="grid h-full place-items-center text-ink-400"><Icon name="leaf" className="h-8 w-8" /></span>
        )}
        <span className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {discount && <span className="rounded bg-sand-500 px-1.5 py-0.5 text-[11px] font-bold text-white">{discount}</span>}
          {out && <span className="rounded bg-ink-900/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">Hết hàng</span>}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-2.5 pt-2.5 pb-2.5">
        <Link
          href={`/san-pham/${product.slug}`}
          className="line-clamp-2 text-[13.5px] leading-snug font-medium text-ink-900 after:absolute after:inset-0 after:content-[''] group-hover:text-brand-700"
        >
          {product.name}
        </Link>
        <p className="flex flex-wrap items-baseline gap-1">
          <span className="text-[17px] leading-none font-bold text-ink-900 tabular-nums">{vnd(product.base_price_vnd)}</span>
          <span className="text-[11.5px] text-ink-500">/{product.unit}</span>
        </p>
        {product.review_count ? (
          <p className="flex items-center gap-1 text-[11.5px] text-ink-600">
            <span className="flex text-sand-500" aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <Icon key={i} name="star" className="h-3 w-3" filled={i < Math.round(Number(product.rating))} />
              ))}
            </span>
            {Number(product.rating).toFixed(1)} ({product.review_count})
          </p>
        ) : null}
        <p className={`text-[11.5px] ${out ? 'text-rose-700' : 'font-medium text-brand-600'}`}>
          {out ? 'Hết hàng' : 'Còn hàng'}
        </p>
        <div className="relative z-10 mt-auto pt-1.5">
          <QuickAdd
            product={{
              id: product.id,
              sku: product.sku,
              name: product.name,
              slug: product.slug,
              unit: product.unit,
              base_price_vnd: product.base_price_vnd,
              image: product.image,
              available: Number(product.available ?? 0),
            }}
          />
        </div>
      </div>
    </article>
  )
}
