import { notFound } from 'next/navigation'
import { serverFetch } from '@/lib/api'
import { Empty } from '@/components/ui'
import { ProductCard, type ProductSummary } from '@/components/product-card'

interface CategoryList {
  data: ProductSummary[]
  total: number
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const categories = await serverFetch<Array<{ slug: string; name: string; description: string | null }>>('/categories', undefined, 300)
  const category = categories?.find((c) => c.slug === slug)
  if (!category) notFound()
  const list = await serverFetch<CategoryList>(`/products?category_slug=${encodeURIComponent(slug)}&pageSize=24`)

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-leaf-600">Danh mục</p>
        <h1 className="text-2xl font-semibold">{category.name}</h1>
        {category.description && <p className="mt-1 text-sm text-leaf-700">{category.description}</p>}
      </header>
      {!list || list.data.length === 0 ? (
        <Empty title="Danh mục chưa có sản phẩm" hint="Vui lòng quay lại sau." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.data.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
