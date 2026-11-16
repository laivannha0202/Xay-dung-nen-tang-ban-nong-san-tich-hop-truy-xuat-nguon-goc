import Link from 'next/link'
import { serverFetch } from '@/lib/api'
import { ProductCard, type ProductSummary } from '@/components/product-card'
import { Empty } from '@/components/ui'

interface ListData {
  data: ProductSummary[]
  page: number
  pageSize: number
  total: number
}

interface Category {
  id: string
  slug: string
  name: string
  product_count: number
}

const SORTS: Array<{ value: string; label: string }> = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'name', label: 'Tên A→Z' },
]

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const get = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined)
  const page = Number(get('page') ?? 1)
  const sort = get('sort') ?? 'newest'
  const search = get('q') ?? ''
  const categorySlug = get('danh-muc') ?? ''
  const minPrice = get('gia-tu') ?? ''
  const maxPrice = get('gia-den') ?? ''
  const inStock = get('con-hang') ?? ''

  const qs = new URLSearchParams({ page: String(page), pageSize: '12', sort })
  if (search) qs.set('search', search)
  if (categorySlug) qs.set('category_slug', categorySlug)
  if (minPrice) qs.set('min_price', minPrice)
  if (maxPrice) qs.set('max_price', maxPrice)
  if (inStock) qs.set('in_stock', inStock)

  const [list, categories] = await Promise.all([
    serverFetch<ListData>(`/products?${qs.toString()}`),
    serverFetch<Category[]>('/categories', undefined, 300),
  ])

  const pageCount = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1
  const link = (patch: Record<string, string | number>) => {
    const next = new URLSearchParams(qs)
    next.set('pageSize', '12')
    for (const [k, v] of Object.entries(patch)) next.set(k, String(v))
    return `/san-pham?${next.toString()}`
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Sản phẩm</h1>
        <p className="text-sm text-leaf-700">Tất cả đều bán theo lô có mã truy xuất nguồn gốc.</p>
      </header>

      <form action="/san-pham" className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-40 flex-1">
          <label className="label" htmlFor="q">Tìm theo tên hoặc mã</label>
          <input id="q" name="q" defaultValue={search} className="input" placeholder="Ví dụ: cà chua" />
        </div>
        <div>
          <label className="label" htmlFor="danh-muc">Danh mục</label>
          <select id="danh-muc" name="danh-muc" defaultValue={categorySlug} className="input">
            <option value="">Tất cả</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sort">Sắp xếp</label>
          <select id="sort" name="sort" defaultValue={sort} className="input">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="gia-tu">Giá từ (₫)</label>
          <input id="gia-tu" name="gia-tu" type="number" min="0" step="1000" defaultValue={minPrice} className="input w-32" />
        </div>
        <div>
          <label className="label" htmlFor="gia-den">Đến (₫)</label>
          <input id="gia-den" name="gia-den" type="number" min="0" step="1000" defaultValue={maxPrice} className="input w-32" />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="con-hang" value="true" defaultChecked={inStock === 'true'} />
          Chỉ còn hàng
        </label>
        <button className="btn-primary" type="submit">Lọc</button>
      </form>

      {!list || list.data.length === 0 ? (
        <Empty title="Không tìm thấy sản phẩm" hint="Thử bỏ bớt điều kiện lọc." />
      ) : (
        <>
          <p className="text-sm text-leaf-700">Tìm thấy {list.total} sản phẩm</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {list.data.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {pageCount > 1 && (
            <nav className="flex items-center justify-center gap-2 pt-2">
              {page > 1 && <Link className="btn-secondary" href={link({ page: page - 1 })}>Trước</Link>}
              <span className="text-sm text-leaf-700">Trang {page}/{pageCount}</span>
              {page < pageCount && <Link className="btn-secondary" href={link({ page: page + 1 })}>Sau</Link>}
            </nav>
          )}
        </>
      )}
    </div>
  )
}
