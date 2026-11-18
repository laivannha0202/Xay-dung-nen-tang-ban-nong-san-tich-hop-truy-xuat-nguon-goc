import { notFound } from 'next/navigation'
import Link from 'next/link'
import { serverFetch } from '@/lib/api'
import { dateVN, vnd } from '@/lib/format'
import { mediaUrl } from '@/lib/config'
import { Icon, EmptyState } from '@agrimarket/ui'
import type { Product, ProductDetail } from '@agrimarket/core'
import { AddToCart } from '@/components/forms'
import { ProductGallery } from '@/components/product-gallery'
import { ProductCard } from '@/components/product-card'

const SITE = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'
const GRID = 'grid grid-cols-2 gap-x-2.5 gap-y-3 sm:grid-cols-3 md:grid-cols-4'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await serverFetch<ProductDetail>(`/products/${encodeURIComponent(slug)}`)
  if (!p) return { title: 'Sản phẩm không tồn tại' }
  const image = mediaUrl(p.images[0]?.url ?? p.image)
  return {
    title: p.name,
    description: p.description?.slice(0, 160) ?? `${p.name} — nông sản tươi giao trong tỉnh Hưng Yên.`,
    alternates: { canonical: `${SITE}/san-pham/${p.slug}` },
    openGraph: {
      title: p.name,
      type: 'website',
      url: `${SITE}/san-pham/${p.slug}`,
      images: image ? [{ url: image }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [product, relatedList] = await Promise.all([
    serverFetch<ProductDetail>(`/products/${encodeURIComponent(slug)}`),
    // Fetched without knowing the category yet; narrowed below once the product is known.
    serverFetch<{ data: Product[] }>('/products?pageSize=24&sort=rating', undefined, 60),
  ])
  if (!product) notFound()
  const related = (relatedList?.data ?? [])
    .filter((p) => p.id !== product.id && p.category_slug === product.category_slug && p.in_stock)
    .slice(0, 4)

  const images = product.images.map((i) => mediaUrl(i.url)).filter((u): u is string => !!u)
  const bestDiscount = Math.max(0, ...product.public_batches.map((b) => b.discount_percent ?? 0))
  const price = product.base_price_vnd
  const promoPrice = bestDiscount > 0 ? Math.round(price * (1 - bestDiscount / 100)) : null
  const out = Number(product.available) <= 0

  return (
    <div className="space-y-8">
      <nav className="text-[12.5px] text-ink-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-700 hover:underline">Trang chủ</Link> /{' '}
        <Link href="/san-pham" className="hover:text-brand-700 hover:underline">Sản phẩm</Link>
        {product.category_name && product.category_slug && (
          <> / <Link href={`/danh-muc/${product.category_slug}`} className="hover:text-brand-700 hover:underline">{product.category_name}</Link></>
        )}
        {' / '}
        <span className="text-ink-700">{product.name}</span>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:gap-8">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <ProductGallery images={images} name={product.name} />

            {/* buy box: on mobile the price sits under the photo, on desktop beside it */}
            <div className="space-y-3.5">
              <h1 className="text-[22px] leading-tight font-bold tracking-tight text-ink-900 sm:text-[26px]">{product.name}</h1>
              {product.review_count > 0 && (
                <p className="flex items-center gap-1.5 text-[13px] text-ink-600">
                  <span className="flex text-sand-500" aria-hidden>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Icon key={i} name="star" className="h-3.5 w-3.5" filled={i < Math.round(Number(product.rating))} />
                    ))}
                  </span>
                  {Number(product.rating).toFixed(1)} · {product.review_count} đánh giá
                </p>
              )}

              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-y border-ink-200 py-3">
                <span className="text-[30px] leading-none font-bold text-ink-900 tabular-nums">{vnd(promoPrice ?? price)}</span>
                <span className="text-[13px] text-ink-500">/{product.unit}</span>
                {promoPrice && <span className="text-[13px] text-ink-500 line-through">{vnd(price)}</span>}
                {bestDiscount > 0 && (
                  <span className="rounded bg-sand-500 px-1.5 py-0.5 text-[11.5px] font-bold text-white">-{bestDiscount}%</span>
                )}
              </div>

              <p className={`text-[13px] font-medium ${out ? 'text-rose-700' : 'text-brand-600'}`}>
                {out ? 'Hết hàng — đang chờ lô mới' : 'Còn hàng'}
              </p>

              <AddToCart
                productId={product.id}
                unit={product.unit}
                available={Number(product.available)}
                sku={product.sku}
                name={product.name}
                slug={product.slug}
                basePrice={product.base_price_vnd}
                image={images[0] ?? null}
              />

              <ul className="space-y-1.5 border-t border-ink-200 pt-3 text-[12.5px] text-ink-600">
                <li className="flex items-center gap-2"><Icon name="truck" className="h-4 w-4 shrink-0 text-brand-600" /> Giao trong tỉnh Hưng Yên, miễn phí đơn từ {vnd(500_000)}</li>
                <li className="flex items-center gap-2"><Icon name="pin" className="h-4 w-4 shrink-0 text-brand-600" /> {product.origin_note ?? 'Nông sản Việt Nam'}</li>
                <li className="flex items-center gap-2"><Icon name="shield" className="h-4 w-4 shrink-0 text-brand-600" /> Đổi trả trong 24 giờ nếu giao lỗi</li>
              </ul>
            </div>
          </div>

          {product.description && (
            <section className="rounded-[var(--radius-panel)] border border-ink-200 bg-white p-5">
              <h2 className="text-[16px] font-bold text-ink-900">Mô tả sản phẩm</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed whitespace-pre-line text-ink-700">{product.description}</p>
              <dl className="mt-4 grid gap-x-6 gap-y-2.5 text-[13px] sm:grid-cols-2">
                {[
                  ['Đơn vị bán', product.unit],
                  ['Xuất xứ', product.origin_note],
                  ['Bảo quản', product.storage],
                  ['Hạn dùng tham khảo', product.shelf_life_days ? `${product.shelf_life_days} ngày` : null],
                  ['Danh mục', product.category_name],
                  ['Mã sản phẩm', product.sku],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between gap-3 border-b border-ink-100 py-1">
                    <dt className="text-ink-500">{label}</dt>
                    <dd className="text-right font-medium text-ink-900">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Origin dossier stays available, collapsed: shoppers open it when they want it. */}
          <details className="group rounded-[var(--radius-panel)] border border-ink-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center gap-2 p-5 text-[16px] font-bold text-ink-900">
              <Icon name="qr" className="h-4.5 w-4.5 text-brand-600" /> Thông tin nguồn gốc
              <Icon name="chevronRight" className="ml-auto h-4 w-4 transition-transform group-open:rotate-90" />
            </summary>
            <div className="space-y-4 border-t border-ink-200 px-5 pt-4 pb-5">
              <p className="text-[13px] text-ink-600">
                Tem trên bao bì mang mã riêng của lô hàng. Mở mã đó để xem nông trại, mùa vụ, nhật ký canh tác và
                kết quả kiểm nghiệm của đúng lô bạn nhận.
              </p>
              {product.public_batches.length === 0 ? (
                <EmptyState title="Chưa có lô đang bán" hint="Sản phẩm đang chờ lô đủ điều kiện bán." />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {product.public_batches.map((b) => (
                    <li key={b.code} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[13px]">
                      <span className="font-mono text-[12px] text-ink-700">{b.code}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-ink-900">{b.farm_name}</span>
                        <span className="text-[12px] text-ink-500">{b.province}</span>
                      </span>
                      <span className="text-[12px] text-ink-500">Thu hoạch {dateVN(b.harvest_date)}</span>
                      <span className="text-[12px] text-ink-500">HSD {dateVN(b.expiry_date)}</span>
                      {b.qr_token && (
                        <Link href={`/t/${b.qr_token}`} className="btn-secondary btn-sm">
                          <Icon name="qr" className="h-3.5 w-3.5" /> Xem hồ sơ
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/tim-kiem" className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:underline">
                Tra cứu bằng mã tem khác <Icon name="chevronRight" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </details>

          <section className="rounded-[var(--radius-panel)] border border-ink-200 bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[16px] font-bold text-ink-900">Đánh giá từ người mua</h2>
              {product.review_count > 0 && (
                <span className="flex items-center gap-1 text-[13px] text-ink-600">
                  <Icon name="star" className="h-4 w-4 text-sand-500" filled /> {Number(product.rating).toFixed(1)} · {product.review_count}
                </span>
              )}
            </div>
            {product.reviews.length === 0 ? (
              <p className="mt-2 text-[13.5px] text-ink-500">Chưa có đánh giá. Chỉ người đã nhận hàng mới đánh giá được.</p>
            ) : (
              <ul className="mt-2 divide-y divide-ink-100">
                {product.reviews.map((r, i) => (
                  <li key={`${r.created_at}-${i}`} className="py-3">
                    <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
                      <span className="font-semibold text-ink-900">{r.customer_name}</span>
                      <span className="flex text-sand-500" aria-label={`${r.rating} trên 5 sao`}>
                        {Array.from({ length: 5 }, (_, k) => (
                          <Icon key={k} name="star" className="h-3.5 w-3.5" filled={k < r.rating} />
                        ))}
                      </span>
                      <span className="ml-auto text-[12px] text-ink-500">{dateVN(r.created_at)}</span>
                    </div>
                    {r.comment && <p className="mt-1 text-[13.5px] text-ink-700">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <div className="mb-2.5 flex items-baseline justify-between border-b border-ink-200 pb-2">
            <h2 className="text-[19px] font-bold tracking-tight text-ink-900">Cùng danh mục</h2>
            {product.category_slug && (
              <Link href={`/danh-muc/${product.category_slug}`} className="text-[13px] font-semibold text-brand-700 hover:underline">
                Xem tất cả
              </Link>
            )}
          </div>
          <div className={GRID}>{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}

      {/* Product rich result: only fields the store actually owns (price, stock, reviews). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            sku: product.sku,
            image: images.length > 0 ? images : undefined,
            description: product.description ?? undefined,
            category: product.category_name ?? undefined,
            offers: {
              '@type': 'Offer',
              price: price,
              priceCurrency: 'VND',
              availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: `${SITE}/san-pham/${product.slug}`,
            },
            ...(product.review_count > 0
              ? {
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: Number(product.rating),
                    reviewCount: product.review_count,
                  },
                }
              : {}),
          }).replace(/</g, '\\u003c'),
        }}
      />
    </div>
  )
}
