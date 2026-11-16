import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverFetch } from '@/lib/api'
import { ProductCard } from '@/components/product-card'
import { EmptyState, Icon } from '@agrimarket/ui'
import type { Category, ProductList } from '@agrimarket/core'

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [categories, list, all] = await Promise.all([
    serverFetch<Category[]>('/categories', undefined, 300),
    serverFetch<ProductList>(`/products?category_slug=${encodeURIComponent(slug)}&pageSize=24&sort=newest`),
    serverFetch<ProductList>(`/products?category_slug=${encodeURIComponent(slug)}&pageSize=4&sort=price_asc`),
  ])
  const category = categories?.find((c) => c.slug === slug)
  if (!category) notFound()

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <nav className="text-xs text-ink-500">
          <Link href="/" className="hover:underline">Trang chủ</Link> /{' '}
          <Link href="/san-pham" className="hover:underline">Sản phẩm</Link> / {category.name}
        </nav>
        <h1 className="page-title">{category.name}</h1>
        <p className="page-sub">{list?.total ?? 0} sản phẩm · bán theo lô có tem truy xuất</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/san-pham" className="chip">Tất cả</Link>
        {(categories ?? []).map((c) => (
          <Link key={c.id} href={`/danh-muc/${c.slug}`} className={`chip ${c.slug === slug ? 'chip-active' : ''}`}>
            {c.name}
          </Link>
        ))}
        <Link href={`/san-pham?danh-muc=${encodeURIComponent(slug)}&sort=rating`} className="btn-ghost btn-sm ml-auto">
          Xem đánh giá cao <Icon name="chevronRight" className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!list || list.data.length === 0 ? (
        <EmptyState
          title="Danh mục chưa có sản phẩm đang bán"
          hint="Các lô trong danh mục này đang chờ kiểm nghiệm hoặc đã hết hàng."
          action={<Link href="/san-pham" className="btn-secondary mt-2">Xem tất cả sản phẩm</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {list.data.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {(all?.data.length ?? 0) > 0 && (
        <section className="rounded-[var(--radius-card)] border border-ink-100 bg-white p-4">
          <h2 className="text-sm font-semibold text-ink-900">Giá tốt nhất trong {category.name}</h2>
          <ul className="mt-2 divide-y divide-ink-100 text-sm">
            {all!.data.map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-2">
                <Link href={`/san-pham/${p.slug}`} className="min-w-0 flex-1 truncate hover:underline">{p.name}</Link>
                <span className="text-xs text-ink-500">còn {p.available} {p.unit}</span>
                <Link href={`/san-pham/${p.slug}`} className="btn-ghost btn-sm">Xem</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
