import Link from 'next/link'
import { serverFetch } from '@/lib/api'
import { ProductCard } from '@/components/product-card'
import { vnd } from '@/lib/format'
import { EmptyState, Icon } from '@agrimarket/ui'
import type { Category, ProductList } from '@agrimarket/core'

const SORTS: Array<{ value: string; label: string }> = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'name', label: 'Tên A→Z' },
]

const PAGE_SIZE = 24
const GRID = 'grid grid-cols-2 gap-x-2.5 gap-y-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'

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
  const heading = categorySlug ? (categories?.find((c) => c.slug === categorySlug)?.name ?? 'Sản phẩm') : search ? `Kết quả cho “${search}”` : 'Tất cả nông sản'

  return (
    <div className="space-y-5">
      <nav className="text-[12.5px] text-ink-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-700 hover:underline">Trang chủ</Link>
        {' / '}
        <Link href="/san-pham" className="hover:text-brand-700 hover:underline">Sản phẩm</Link>
        {categorySlug && <> / <span className="text-ink-700">{categories?.find((c) => c.slug === categorySlug)?.name ?? 'Danh mục'}</span></>}
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] leading-tight font-bold tracking-tight text-ink-900 sm:text-[28px]">{heading}</h1>
          <p className="mt-0.5 text-[13px] text-ink-500">{total} sản phẩm</p>
        </div>
        <form action="/san-pham" className="flex items-center gap-2">
          {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
          {categorySlug && <input type="hidden" name="danh-muc" value={categorySlug} />}
          <label htmlFor="sort" className="text-[12.5px] font-medium text-ink-600">Sắp xếp</label>
          <select id="sort" name="sort" defaultValue={sort} className="h-9 rounded-lg border border-ink-200 bg-white px-2 text-[13px] text-ink-800">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <noscript><button type="submit" className="btn-secondary btn-sm">Áp dụng</button></noscript>
        </form>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <Link href={href({ 'danh-muc': null, page: 1 })} className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium ${categorySlug ? 'bg-ink-100 text-ink-700 hover:bg-ink-200' : 'bg-brand-500 text-white'}`}>
          Tất cả
        </Link>
        {(categories ?? []).map((c) => (
          <Link
            key={c.id}
            href={href({ 'danh-muc': c.slug, page: 1 })}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium whitespace-nowrap ${c.slug === categorySlug ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <form action="/san-pham" className="space-y-4 rounded-[var(--radius-panel)] border border-ink-200 bg-white p-4">
            {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
            <p className="text-[13px] font-bold text-ink-900">Bộ lọc</p>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-ink-600" htmlFor="q">Từ khoá</label>
              <input id="q" name="q" defaultValue={search} className="h-9 w-full rounded-lg border border-ink-200 px-2.5 text-[13px] outline-none focus:border-brand-500" placeholder="Tên sản phẩm" />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-ink-600" htmlFor="danh-muc">Danh mục</label>
              <select id="danh-muc" name="danh-muc" defaultValue={categorySlug} className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2 text-[13px]">
                <option value="">Tất cả danh mục</option>
                {(categories ?? []).map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <fieldset>
              <legend className="mb-1 text-[12px] font-medium text-ink-600">Khoảng giá (₫)</legend>
              <div className="flex items-center gap-1.5">
                <input name="gia-tu" type="number" min="0" step="5000" defaultValue={minPrice} placeholder="Từ" className="h-9 w-full rounded-lg border border-ink-200 px-2 text-[13px]" aria-label="Giá từ" />
                <span className="text-ink-400">–</span>
                <input name="gia-den" type="number" min="0" step="5000" defaultValue={maxPrice} placeholder="Đến" className="h-9 w-full rounded-lg border border-ink-200 px-2 text-[13px]" aria-label="Giá đến" />
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-[13px] text-ink-700">
              <input type="checkbox" name="con-hang" value="true" defaultChecked={inStock} className="h-4 w-4 rounded border-ink-300 accent-brand-500" />
              Chỉ còn hàng
            </label>
            <div className="flex gap-2">
              <button type="submit" className="btn-buy btn-sm flex-1">Áp dụng</button>
              {activeFilters > 0 && <Link href="/san-pham" className="btn-secondary btn-sm">Xoá</Link>}
            </div>
          </form>
        </aside>

        <div className="min-w-0 space-y-4">
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
                  <Link key={f.label} href={href({ ...f.patch, page: 1 })} className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-[12px] font-medium text-ink-700 hover:bg-ink-200" aria-label={`Bỏ lọc ${f.label}`}>
                    {f.label} <Icon name="close" className="h-3 w-3" />
                  </Link>
                ))}
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
              <div className={GRID}>{list.data.map((p) => <ProductCard key={p.id} product={p} />)}</div>
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
                          className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-[13px] ${
                            n === page ? 'border-brand-500 bg-brand-500 font-semibold text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300'
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
