import Link from 'next/link'
import { vnd, qty } from '@/lib/format'

export interface ProductSummary {
  id: string
  name: string
  slug: string
  unit: string
  base_price_vnd: number
  image: string | null
  rating?: number
  review_count?: number
  available?: number
  has_batch_promo?: boolean
  category_name?: string
}

export function ProductCard({ product }: { product: ProductSummary }) {
  const out = (product.available ?? 0) <= 0
  return (
    <Link
      href={`/san-pham/${product.slug}`}
      className="card group flex flex-col overflow-hidden transition-colors hover:border-leaf-300"
    >
      <div className="relative aspect-4/3 bg-leaf-50">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-3xl">🌱</div>
        )}
        {product.has_batch_promo && (
          <span className="badge absolute left-2 top-2 bg-clay-500 text-white">Lô cận hạn giảm giá</span>
        )}
        {out && (
          <span className="badge absolute left-2 top-2 bg-slate-800/85 text-white">Tạm hết hàng</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-leaf-900">{product.name}</p>
        <p className="text-xs text-leaf-600">{product.category_name ?? ''}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="font-semibold text-leaf-800">
            {vnd(product.base_price_vnd)}
            <span className="text-xs font-normal text-leaf-600">/{product.unit}</span>
          </p>
          {product.review_count ? (
            <p className="text-xs text-amber-700">
              ★ {Number(product.rating).toFixed(1)} ({product.review_count})
            </p>
          ) : null}
        </div>
        {product.available !== undefined && (
          <p className="text-xs text-leaf-600">Còn {qty(product.available)} {product.unit}</p>
        )}
      </div>
    </Link>
  )
}
