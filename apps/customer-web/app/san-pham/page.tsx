import Link from 'next/link'
import { serverFetch } from '@/lib/api'
import { ProductCard } from '@/components/product-card'
import { vnd } from '@/lib/format'
import { EmptyState, Icon } from '@agrimarket/ui'
import type { Category, ProductList } from '@agrimarket/core'

const SORTS: Array<{ value: string; label: string }> = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'name', label: 'Tên A→Z' },
]

const PAGE_SIZE = 12

type Params = Record<string, string | string[] | undefined>

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams
  const get = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined)
  const page = Number(get('page') ?? 1)
  const sort = get('sort') ?? 'newest'
  const search = get('q') ?? ''
  const categorySlug = get('danh-muc') ?? ''
  const minPrice = get('gia-tu') ?? ''
  const maxPrice = get('gia-den') ?? ''
  const inStock = get('con-hang') === 'true'

  // API query names stay English; the URL keeps Vietnamese segments for the shopper.
  const apiQs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), sort })
  if (search) apiQs.set('search', search)
  if (categorySlug) apiQs.set('category_slug', categorySlug)
  if (minPrice) apiQs.set('min_price', minPrice)
  if (maxPrice) apiQs.set('max_price', maxPrice)
  if (inStock) apiQs.set('in_stock', 'true')

  const [list, categories] = await Promise.all([
    serverFetch<ProductList>(`/products?${apiQs.toString()}`),
    serverFetch<Category[]>('/categories', undefined, 300),
  ])

  const total = list?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  /** Every filter change round-trips through the URL so the page stays shareable. */
  const href = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams()
    const current: Record<string, string> = {
      q: search,
      'danh-muc': categorySlug,
      'gia-tu': minPrice,
      'gia-den': maxPrice,
      sort,
      page: String(page),
      ...(inStock ? { 'con-hang': 'true' } : {}),
    }
    for (const [k, v] of Object.entries({ ...current, ...patch })) {
      if (v !== null && v !== '' && !(k === 'page' && v === '1')) next.set(k, String(v))
    }
    const qs = next.toString()
    return qs ? `/san-pham?${qs}` : '/san-pham'
  }

  const activeFilters = [search, categorySlug, minPrice, maxPrice, inStock ? 'true' : ''].filter(Boolean).length

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <nav className="text-xs text-ink-500">
          <Link href="/" className="hover:underline">Trang chủ</Link> / Sản phẩm
        </nav>
        <h1 className="page-title">
          {categorySlug ? (categories?.find((c) => c.slug === categorySlug)?.name ?? 'Sản phẩm') : 'Tất cả nông sản'}
        </h1>
        <p className="page-sub">{total} sản phẩm đang bán theo lô có tem truy xuất nguồn gốc.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* filters: a real form on desktop, a folded panel on mobile */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <details className="card p-4 lg:open" open>
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-ink-900 lg:pointer-events-none">
              Bộ lọc
              {activeFilters > 0 && <span className="badge bg-brand-50 text-brand-700 ring-brand-200">{activeFilters}</span>}
            </summary>
            <form action="/san-pham" className="mt-4 space-y-4">
              {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
              <div>
                <label className="label" htmlFor="q">Từ khoá</label>
                <input id="q" name="q" defaultValue={search} className="input" placeholder="Tên sản phẩm, mã lô" />
              </div>
              <div>
                <label className="label" htmlFor="danh-muc">Danh mục</label>
                <select id="danh-muc" name="danh-muc" defaultValue={categorySlug} className="select">
                  <option value="">Tất cả danh mục</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <fieldset>
                <legend className="label">Khoảng giá (₫)</legend>
                <div className="flex items-center gap-2">
                  <input name="gia-tu" type="number" min="0" step="5000" defaultValue={minPrice} placeholder="Từ" className="input" aria-label="Giá từ" />
                  <span className="text-ink-400">–</span>
                  <input name="gia-den" type="number" min="0" step="5000" defaultValue={maxPrice} placeholder="Đến" className="input" aria-label="Giá đến" />
                </div>
              </fieldset>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" name="con-hang" value="true" defaultChecked={inStock} className="h-4 w-4 rounded border-ink-300" />
                Chỉ hiện sản phẩm còn hàng
              </label>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Áp dụng</button>
                {activeFilters > 0 && <Link href="/san-pham" className="btn-secondary">Xoá</Link>}
              </div>
            </form>
          </details>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-500">Sắp xếp:</span>
            {SORTS.map((s) => (
              <Link key={s.value} href={href({ sort: s.value, page: 1 })} className={`chip ${sort === s.value ? 'chip-active' : ''}`}>
                {s.label}
              </Link>
            ))}
          </div>

          {activeFilters > 0 && (
            <div className="flex flex-wrap items-center gap-1.5" aria-label="Bộ lọc đang áp dụng">
              {(
                [
                  search ? { label: `“${search}”`, patch: { q: null } } : null,
                  categorySlug ? { label: categories?.find((c) => c.slug === categorySlug)?.name ?? categorySlug, patch: { 'danh-muc': null } } : null,
                  minPrice ? { label: `từ ${vnd(Number(minPrice))}`, patch: { 'gia-tu': null } } : null,
                  maxPrice ? { label: `đến ${vnd(Number(maxPrice))}`, patch: { 'gia-den': null } } : null,
                  inStock ? { label: 'Còn hàng', patch: { 'con-hang': null } } : null,
                ] as Array<{ label: string; patch: Record<string, null> } | null>
              )
                .filter((f): f is { label: string; patch: Record<string, null> } => f !== null)
                .map((f) => (
                  <Link
                    key={f.label}
                    href={href({ ...f.patch, page: 1 })}
                    className="chip border-brand-200 bg-brand-50 text-brand-800"
                    aria-label={`Bỏ lọc ${f.label}`}
                  >
                    {f.label} <Icon name="close" className="h-3 w-3" />
                  </Link>
                ))}
              <Link href="/san-pham" className="text-xs text-ink-500 hover:text-brand-700 hover:underline">
                Xoá tất cả
              </Link>
            </div>
          )}

          {!list || list.data.length === 0 ? (
            <EmptyState
              title="Không tìm thấy sản phẩm phù hợp"
              hint="Thử bỏ bớt điều kiện lọc hoặc tìm với từ khoá khác."
              action={<Link href="/san-pham" className="btn-secondary mt-2">Xoá bộ lọc</Link>}
            />
          ) : (
            <>
              <p className="text-xs text-ink-500">
                Hiển thị {list.data.length} / {total} sản phẩm · tồn kho tính từ lô đã công khai
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {list.data.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {pageCount > 1 && (
                <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-2" aria-label="Phân trang">
                  {page > 1 && (
                    <Link className="btn-secondary btn-sm" href={href({ page: page - 1 })}>
                      <Icon name="chevronRight" className="h-4 w-4 rotate-180" /> Trước
                    </Link>
                  )}
                  {Array.from({ length: pageCount }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === pageCount || Math.abs(n - page) <= 1)
                    .map((n, idx, arr) => (
                      <span key={n} className="flex items-center gap-1.5">
                        {idx > 0 && n - arr[idx - 1]! > 1 && <span className="px-1 text-ink-400">…</span>}
                        <Link
                          href={href({ page: n })}
                          aria-current={n === page ? 'page' : undefined}
                          className={`grid h-8 min-w-8 place-items-center rounded-lg border px-2 text-sm ${
                            n === page ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300'
                          }`}
                        >
                          {n}
                        </Link>
                      </span>
                    ))}
                  {page < pageCount && (
                    <Link className="btn-secondary btn-sm" href={href({ page: page + 1 })}>
                      Sau <Icon name="chevronRight" className="h-4 w-4" />
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
