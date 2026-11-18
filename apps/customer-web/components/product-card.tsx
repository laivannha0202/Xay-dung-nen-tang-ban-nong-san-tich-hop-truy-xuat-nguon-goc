import Link from 'next/link'
import { vnd } from '@/lib/format'
import { mediaUrl } from '@/lib/config'
import { Icon } from '@agrimarket/ui'
import type { Product } from '@agrimarket/core'
import { QuickAdd } from '@/components/quick-add'

/**
 * V5 tile: no border, the 1:1 photo owns the top of the card and sits on an ivory frame so
 * photos from different sources still read as one grid. Three lines of metadata, not five.
 *
 * The whole tile is one hit area (stretched link on the title) and the add button is lifted
 * above it with z-10 — a 19px title alone is not a touch target.
 */
export function ProductCard({ product }: { product: Product }) {
  const out = Number(product.available ?? 0) <= 0
  const img = mediaUrl(product.image)
  const origin = product.origin_note?.replace(/\.$/, '') ?? null

  return (
    <article className="group relative flex flex-col rounded-2xl bg-white transition-shadow duration-200 hover:shadow-[var(--shadow-card)]">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-ivory-100">
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
            <span className="badge border-0 bg-sand-500 font-bold text-white ring-0">Cận hạn</span>
          )}
          {out && <span className="badge border-0 bg-ink-900/85 text-white ring-0">Tạm hết</span>}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1 pt-3 pb-1">
        {/* stretched link: the whole tile is a target, not just the title text */}
        <Link
          href={`/san-pham/${product.slug}`}
          className="line-clamp-2 text-[14px] leading-snug font-semibold text-ink-900 after:absolute after:inset-0 after:content-[''] group-hover:text-brand-700 sm:text-[14.5px]"
        >
          {product.name}
        </Link>
        {origin && (
          <p className="flex items-center gap-1 truncate text-[12px] text-ink-600">
            <Icon name="pin" className="h-3 w-3 shrink-0 text-brand-600" />
            {origin}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-2 pt-2">
          <p className="text-[17px] font-bold tracking-tight text-brand-700">
            {vnd(product.base_price_vnd)}
            <span className="text-[11.5px] font-normal text-ink-600">/{product.unit}</span>
          </p>
          {product.review_count ? (
            <p className="flex items-center gap-0.5 text-[11.5px] text-sand-700">
              <Icon name="star" className="h-3.5 w-3.5" filled />
              {Number(product.rating).toFixed(1)}
              <span className="text-ink-500">({product.review_count})</span>
            </p>
          ) : (
            <p className="text-[11px] text-ink-500">Chưa đánh giá</p>
          )}
        </div>
        <p className={`text-[11.5px] ${out ? 'text-rose-700' : 'text-ink-600'}`}>
          {out ? 'Đang chờ lô mới' : `Còn ${product.available} ${product.unit} từ lô đang bán`}
        </p>
        <div className="relative z-10">
          <QuickAdd product={{ id: product.id, sku: product.sku, name: product.name, slug: product.slug, unit: product.unit, base_price_vnd: product.base_price_vnd, image: product.image, available: Number(product.available ?? 0) }} />
        </div>
      </div>
    </article>
  )
}
