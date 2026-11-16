import { notFound } from 'next/navigation'
import Link from 'next/link'
import { serverFetch } from '@/lib/api'
import { dateVN, vnd, ORDER_STATUS } from '@/lib/format'
import { mediaUrl } from '@/lib/config'
import { Icon, EmptyState, SectionHeader } from '@agrimarket/ui'
import type { ProductDetail } from '@agrimarket/core'
import { AddToCart } from '@/components/forms'
import { ProductGallery } from '@/components/product-gallery'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await serverFetch<ProductDetail>(`/products/${encodeURIComponent(slug)}`)
  if (!product) notFound()

  const images = product.images.map((i) => mediaUrl(i.url)).filter((u): u is string => !!u)
  const promo = product.public_batches.find((b) => b.discount_percent)
  const bestDiscount = Math.max(0, ...product.public_batches.map((b) => b.discount_percent ?? 0))
  const price = product.base_price_vnd
  const promoPrice = bestDiscount > 0 ? Math.round(price * (1 - bestDiscount / 100)) : null

  return (
    <div className="space-y-10">
      <nav className="text-xs text-ink-500">
        <Link href="/" className="hover:underline">Trang chủ</Link> /{' '}
        <Link href="/san-pham" className="hover:underline">Sản phẩm</Link>
        {product.category_name && product.category_slug && (
          <>
            {' / '}
            <Link href={`/danh-muc/${product.category_slug}`} className="hover:underline">{product.category_name}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-6">
          <ProductGallery images={images} name={product.name} />

          <section className="card-pad">
            <h2 className="text-base font-semibold text-ink-900">Về sản phẩm</h2>
            {product.description && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">{product.description}</p>}
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ['Mã sản phẩm', product.sku],
                ['Đơn vị bán', product.unit],
                ['Xuất xứ', product.origin_note],
                ['Cách bảo quản', product.storage],
                ['Hạn dùng tham khảo', product.shelf_life_days ? `${product.shelf_life_days} ngày` : null],
                ['Danh mục', product.category_name],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs tracking-wide text-ink-500 uppercase">{label}</dt>
                  <dd className="mt-0.5 text-ink-800">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card-pad">
            <SectionHeader
              title="Lô đang bán & tem truy xuất"
              hint="Mua hàng được phân bổ từ đúng lô còn tồn. Mở tem trên bao bì để xem hồ sơ của lô bạn đã nhận."
            />
            {product.public_batches.length === 0 ? (
              <EmptyState
                title="Chưa có lô đủ điều kiện công khai"
                hint="Lô cần phiếu kiểm nghiệm đạt và không thuộc diện thu hồi."
              />
            ) : (
              <ul className="mt-3 divide-y divide-ink-100">
                {product.public_batches.map((b) => (
                  <li key={b.code} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                    <span className="rounded-md bg-ink-50 px-2 py-1 font-mono text-xs text-ink-700">{b.code}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-ink-900">{b.farm_name}</span>
                      <span className="text-xs text-ink-500">{b.province}</span>
                    </span>
                    <span className="text-xs text-ink-500">Thu hoạch {dateVN(b.harvest_date)}</span>
                    <span className="text-xs text-ink-500">HSD {dateVN(b.expiry_date)}</span>
                    {b.discount_percent ? (
                      <span className="badge bg-sand-50 text-sand-700 ring-sand-500/20">-{b.discount_percent}%</span>
                    ) : null}
                    <Link href={`/tim-kiem?batch=${encodeURIComponent(b.code)}`} className="btn-ghost btn-sm">
                      <Icon name="qr" className="h-4 w-4" /> Tem
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card-pad">
            <SectionHeader
              title="Đánh giá từ khách đã nhận hàng"
              hint="Chỉ khách có đơn ở trạng thái Đã giao hoặc Hoàn tất mới đánh giá được."
              action={product.review_count > 0 ? (
                <span className="flex items-center gap-1 text-sm text-sand-700">
                  <Icon name="star" className="h-4 w-4" filled /> {Number(product.rating).toFixed(1)} · {product.review_count} đánh giá
                </span>
              ) : undefined}
            />
            {product.reviews.length === 0 ? (
              <p className="text-sm text-ink-500">Chưa có đánh giá nào.</p>
            ) : (
              <ul className="mt-2 divide-y divide-ink-100">
                {product.reviews.map((r, i) => (
                  <li key={`${r.created_at}-${i}`} className="py-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-ink-900">{r.customer_name}</span>
                      <span className="flex text-sand-600" aria-label={`${r.rating} trên 5 sao`}>
                        {Array.from({ length: 5 }, (_, k) => (
                          <Icon key={k} name="star" className="h-3.5 w-3.5" filled={k < r.rating} />
                        ))}
                      </span>
                      <span className="ml-auto text-xs text-ink-400">{dateVN(r.created_at)}</span>
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-ink-700">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* buy box: sticky on desktop so the price and CTA stay reachable */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="card-pad space-y-4">
            <div>
              {product.category_name && <p className="text-xs tracking-wide text-brand-700 uppercase">{product.category_name}</p>}
              <h1 className="mt-1 text-xl font-semibold leading-snug text-ink-900 sm:text-2xl">{product.name}</h1>
              <p className="mt-1 text-xs text-ink-500">SKU {product.sku}</p>
            </div>

            <div className="flex items-end gap-2">
              <p className="text-2xl font-semibold text-brand-800">{vnd(promoPrice ?? price)}</p>
              <span className="pb-1 text-sm text-ink-500">/{product.unit}</span>
              {promoPrice && <span className="pb-1 text-sm text-ink-400 line-through">{vnd(price)}</span>}
            </div>
            {bestDiscount > 0 && (
              <p className="badge bg-sand-50 text-sand-700 ring-sand-500/20">
                <Icon name="promotion" className="h-3.5 w-3.5" /> Ưu đãi lô cận hạn -{bestDiscount}% (áp dụng khi phân bổ)
              </p>
            )}

            <div className="rounded-lg bg-ink-50/70 p-3 text-sm text-ink-600">
              <p className="flex items-center gap-2">
                <Icon name="truck" className="h-4 w-4 text-brand-700" />
                Miễn phí giao cho đơn từ {vnd(500_000)}
              </p>
              <p className="mt-1 flex items-center gap-2">
                <Icon name="shield" className="h-4 w-4 text-brand-700" />
                Lô có kiểm nghiệm dư lượng thuốc BVTV
              </p>
            </div>

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

            <p className="text-xs text-ink-500">
              Tồn kho hiện tại: {Number(product.available)} {product.unit}.
              {product.available <= 0 && ' Sản phẩm đang tạm hết hàng.'}
            </p>
          </div>

          <div className="card-pad mt-4 space-y-2 text-sm">
            <p className="font-medium text-ink-900">Mua hàng có truy xuất</p>
            {[
              ['Đặt hàng', 'Phân bổ từ lô thật, giữ hàng trong 15 phút'],
              [ORDER_STATUS['SHIPPING']!, 'Theo dõi trạng thái từng bước'],
              ['Sau khi nhận', 'Mở tem QR để đánh giá hoặc báo vấn đề đúng lô'],
            ].map(([t, d]) => (
              <p key={t} className="text-ink-600">
                <span className="mr-1 text-brand-700">•</span>
                <span className="font-medium text-ink-800">{t}:</span> {d}
              </p>
            ))}
          </div>

          {promo && (
            <p className="mt-4 text-xs text-ink-500">
              Lô {promo.code} đang ưu đãi -{promo.discount_percent}% và hết hạn {dateVN(promo.expiry_date)}.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
