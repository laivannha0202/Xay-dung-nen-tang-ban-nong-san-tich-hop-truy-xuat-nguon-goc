import Link from 'next/link'
import { serverFetch } from '@/lib/api'
import { vnd } from '@/lib/format'
import type { Category, HomePayload, Product, ProductList } from '@agrimarket/core'
import { EmptyState, Icon } from '@agrimarket/ui'
import { ProductCard } from '@/components/product-card'
import { CategoryTile } from '@/components/category-tile'
import { HomeHero } from '@/components/home-hero'
import { PromoBanners } from '@/components/promo-banners'
import { RecentlyViewedRow } from '@/components/saved-products'

interface ServiceArea {
  province: { name: string }
  free_ship_threshold_vnd: number
}

/** Aisles in the order a shopper walks the store; any other category follows. */
const AISLE_ORDER = ['trai-cay', 'rau-cu', 'nam', 'gao-ngu-coc', 'ngu-coc', 'cac-loai-dau', 'dac-san']
const ROW_SIZE = 5

const GRID = 'grid grid-cols-2 gap-x-2.5 gap-y-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'

function SeeAll({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex min-h-9 items-center gap-1 text-[13px] font-semibold text-brand-700 hover:underline">
      Xem tất cả <Icon name="chevronRight" className="h-3.5 w-3.5" />
    </Link>
  )
}

function Row({ title, hint, href, children }: { title: string; hint?: string; href: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink-200 pb-2">
        <h2 className="text-[19px] leading-tight font-bold tracking-tight text-ink-900 sm:text-[21px]">
          {title}
          {hint && <span className="ml-2 text-[12.5px] font-medium text-ink-500">{hint}</span>}
        </h2>
        <SeeAll href={href} />
      </div>
      {children}
    </section>
  )
}

export default async function HomePage() {
  const [data, area, catalog] = await Promise.all([
    serverFetch<HomePayload>('/home', undefined, 60),
    serverFetch<ServiceArea>('/locations/service-area', undefined, 300),
    serverFetch<ProductList>('/products?pageSize=100&sort=rating', undefined, 60),
  ])
  const categories: Category[] = data?.categories ?? []
  if (!data || categories.length === 0) {
    return <EmptyState title="Chưa có sản phẩm" hint="Cửa hàng đang cập nhật danh mục." icon="products" />
  }

  // One product, one card: rows claim as they walk the list, so a repeat inside the same
  // payload (or one already shown above) can never produce a duplicate React key.
  const shown = new Set<string>()
  const claim = (list: readonly Product[], n: number) => {
    const picked: Product[] = []
    for (const p of list) {
      if (picked.length === n) break
      if (shown.has(p.id)) continue
      shown.add(p.id)
      picked.push(p)
    }
    return picked
  }

  const products = catalog?.data ?? []
  const deals = claim([...data.featured, ...data.newest].filter((p) => p.has_batch_promo), 4)
  const featured = claim(data.featured, 5)
  const aisles = [...AISLE_ORDER, ...categories.map((c) => c.slug).filter((s) => !AISLE_ORDER.includes(s))]
    .map((slug) => ({ category: categories.find((c) => c.slug === slug), items: [] as Product[] }))
    .filter((a) => a.category)
  for (const aisle of aisles) {
    aisle.items = claim(products.filter((p) => p.category_slug === aisle.category!.slug), ROW_SIZE)
  }
  // A row with a single card reads as a rendering bug; those products wait for the new-arrivals row.
  const fullAisles = aisles.filter((a) => a.items.length > 1)
  const newest = claim([...data.newest, ...products], ROW_SIZE)
  const freeShip = area?.free_ship_threshold_vnd ?? 500_000

  return (
    <div className="space-y-8 sm:space-y-10">
      <HomeHero freeShipLabel={`Miễn phí giao đơn từ ${vnd(freeShip)} · ${area?.province.name ?? 'Hưng Yên'}`} />

      <section aria-label="Danh mục sản phẩm" className="rounded-[var(--radius-card)] bg-ink-100 px-2 py-3 sm:px-4">
        {/* Columns follow the real category count, so four departments fill the bar instead of half of it. */}
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
          {categories.slice(0, 8).map((c) => (
            <CategoryTile key={c.id} href={`/danh-muc/${c.slug}`} name={c.name} image={c.image} count={c.product_count} />
          ))}
        </div>
      </section>
      <PromoBanners categories={categories} />

      <RecentlyViewedRow />

      {deals.length > 0 && (
        <section id="uu-dai" className="scroll-mt-32 overflow-hidden rounded-[var(--radius-panel)] bg-sand-50 ring-1 ring-sand-200">
          <div className="flex flex-wrap items-center gap-3 border-b border-sand-200 px-4 py-3">
            <p className="text-[17px] font-bold tracking-tight text-sand-700">
              <Icon name="promotion" className="mr-1.5 inline h-4.5 w-4.5" /> Ưu đãi hôm nay
            </p>
            <p className="text-[12.5px] text-ink-700">Giá tốt cho lô sắp hết hạn dùng — số lượng có hạn.</p>
            <Link href="/san-pham?con-hang=true&sort=price_asc" className="ml-auto text-[13px] font-semibold text-sand-700 hover:underline">
              Xem thêm ưu đãi
            </Link>
          </div>
          <div className={`${GRID} px-2 py-3`}>
            {deals.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <Row title="Khách đánh giá cao" hint="Theo điểm đánh giá thật" href="/san-pham?sort=rating">
          <div className={GRID}>{featured.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Row>
      )}

      {fullAisles.map((a) => (
        <Row key={a.category!.id} title={a.category!.name} href={`/danh-muc/${a.category!.slug}`}>
          <div className={GRID}>{a.items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Row>
      ))}

      {newest.length > 0 && (
        <Row title="Mới về cửa hàng" href="/san-pham?sort=newest">
          <div className={GRID}>{newest.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Row>
      )}
    </div>
  )
}
