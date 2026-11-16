import Link from 'next/link'
import { serverFetch } from '@/lib/api'
import { vnd } from '@/lib/format'
import { ProductCard } from '@/components/product-card'

interface HomeData {
  featured: Array<{
    id: string; name: string; slug: string; unit: string; base_price_vnd: number; image: string | null
    rating: number; review_count: number; available: number; has_batch_promo: boolean
  }>
  newest: Array<{ id: string; name: string; slug: string; unit: string; base_price_vnd: number; image: string | null }>
  categories: Array<{ id: string; slug: string; name: string; product_count: number; image: string | null }>
  stats: { products: number; batches: number }
}

export default async function HomePage() {
  const data = await serverFetch<HomeData>('/home', undefined, 60)
  if (!data) return <p className="py-20 text-center text-leaf-700">Chưa có dữ liệu sản phẩm.</p>

  return (
    <div className="space-y-12">
      <section className="card overflow-hidden bg-gradient-to-br from-leaf-50 via-white to-clay-50 p-6 sm:p-10">
        <p className="badge bg-leaf-100 text-leaf-800">Mỗi lô hàng một mã QR</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-leaf-900 sm:text-4xl">
          Nông sản truy xuất được tới tận nông trại và nhật ký canh tác
        </h1>
        <p className="mt-3 max-w-2xl text-leaf-800">
          Quét tem trên bao bì để xem nông trại, mùa vụ, ngày thu hoạch, kết quả kiểm nghiệm dư lượng thuốc bảo vệ
          thực vật và chứng nhận của từng lô.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/san-pham" className="btn-primary">Mua nông sản</Link>
          <Link href="/tim-kiem" className="btn-secondary">Tra cứu tem QR</Link>
        </div>
        <dl className="mt-8 grid max-w-md grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-leaf-700">Sản phẩm đang bán</dt>
            <dd className="text-2xl font-semibold">{data.stats.products}</dd>
          </div>
          <div>
            <dt className="text-leaf-700">Lô đã công khai</dt>
            <dd className="text-2xl font-semibold">{data.stats.batches}</dd>
          </div>
        </dl>
      </section>

      {data.categories.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Danh mục</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.categories.map((c) => (
              <Link
                key={c.id}
                href={`/danh-muc/${c.slug}`}
                className="card flex items-center justify-between p-4 transition-colors hover:border-leaf-300"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-leaf-600">{c.product_count} SP</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Được đánh giá cao</h2>
          <Link href="/san-pham" className="text-sm text-leaf-700 hover:underline">Xem tất cả</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Mới về kho</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.newest.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Vì sao có giá này?</h2>
        <ul className="mt-3 grid gap-3 text-sm text-leaf-800 sm:grid-cols-3">
          <li className="rounded-lg bg-leaf-50 p-4">
            <p className="font-medium">Theo lô thực tế</p>
            <p className="mt-1 text-leaf-700">Đơn hàng được phân bổ từ các lô còn bán, ưu tiên lô nhập trước.</p>
          </li>
          <li className="rounded-lg bg-leaf-50 p-4">
            <p className="font-medium">Cận hạn được giảm giá</p>
            <p className="mt-1 text-leaf-700">Phần số lượng lấy từ lô cận hạn được giảm giá riêng, minh bạch trên từng dòng.</p>
          </li>
          <li className="rounded-lg bg-leaf-50 p-4">
            <p className="font-medium">Thu hồi tức thời</p>
            <p className="mt-1 text-leaf-700">Khi một lô bị thu hồi, tem QR và đơn hàng liên quan được cảnh báo ngay.</p>
          </li>
        </ul>
        <p className="mt-4 text-xs text-leaf-600">Giao hàng miễn phí cho đơn từ {vnd(500000)}.</p>
      </section>
    </div>
  )
}
