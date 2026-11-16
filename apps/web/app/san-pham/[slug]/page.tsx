import { notFound } from 'next/navigation'
import Link from 'next/link'
import { serverFetch } from '@/lib/api'
import { vnd, dateVN } from '@/lib/format'
import { AddToCart } from '@/components/forms'

interface ProductDetail {
  id: string
  sku: string
  slug: string
  name: string
  unit: string
  base_price_vnd: number
  description: string
  storage: string
  origin_note: string
  shelf_life_days: number
  available: number
  rating: number
  review_count: number
  category_name: string
  category_slug: string
  images: Array<{ url: string; alt: string }>
  reviews: Array<{ rating: number; comment: string; created_at: string; customer_name: string }>
  public_batches: Array<{
    code: string
    harvest_date: string
    expiry_date: string
    farm_name: string
    province: string
    qr_token: string | null
    discount_percent: number | null
  }>
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await serverFetch<ProductDetail>(`/products/${encodeURIComponent(slug)}`)
  if (!product) notFound()

  const main = product.images[0]
  return (
    <div className="space-y-8">
      <nav className="text-sm text-leaf-600">
        <Link href="/san-pham" className="hover:underline">Sản phẩm</Link>
        {' / '}
        <Link href={`/danh-muc/${product.category_slug}`} className="hover:underline">{product.category_name}</Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="aspect-4/3 bg-leaf-50">
            {main ? (
              <img src={main.url} alt={main.alt || product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-5xl">🌱</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 p-3">
              {product.images.map((img) => (
                <img key={img.url} src={img.url} alt={img.alt} className="h-16 w-16 rounded-md object-cover" />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="mt-1 text-sm text-leaf-600">SKU {product.sku}</p>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-xl font-semibold text-leaf-800">
                {vnd(product.base_price_vnd)}<span className="text-sm font-normal text-leaf-600">/{product.unit}</span>
              </p>
              {product.review_count > 0 && (
                <p className="text-sm text-amber-700">★ {Number(product.rating).toFixed(1)} · {product.review_count} đánh giá</p>
              )}
            </div>
          </div>

          <AddToCart productId={product.id} unit={product.unit} available={Number(product.available)} />

          <dl className="card divide-y divide-leaf-50 text-sm">
            {[
              ['Xuất xứ', product.origin_note],
              ['Bảo quản', product.storage],
              ['Hạn dùng tham khảo', `${product.shelf_life_days} ngày`],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3 px-4 py-2.5">
                <dt className="w-32 shrink-0 text-leaf-600">{label}</dt>
                <dd className="text-leaf-900">{value || '—'}</dd>
              </div>
            ))}
          </dl>

          <div className="prose-sm whitespace-pre-line text-leaf-800">{product.description}</div>
        </div>
      </div>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-3 font-semibold">Lô đang bán & tem truy xuất</h2>
        {product.public_batches.length === 0 ? (
          <p className="text-sm text-leaf-700">Hiện chưa có lô đủ điều kiện công khai.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Mã lô</th>
                  <th>Nông trại</th>
                  <th>Thu hoạch</th>
                  <th>Hạn dùng</th>
                  <th>Ưu đãi lô</th>
                  <th>Tem</th>
                </tr>
              </thead>
              <tbody>
                {product.public_batches.map((b) => (
                  <tr key={b.code}>
                    <td className="font-medium">{b.code}</td>
                    <td>{b.farm_name} <span className="text-leaf-600">· {b.province}</span></td>
                    <td>{dateVN(b.harvest_date)}</td>
                    <td>{dateVN(b.expiry_date)}</td>
                    <td>{b.discount_percent ? <span className="badge bg-clay-100 text-clay-700">-{b.discount_percent}%</span> : '—'}</td>
                    <td>
                      {b.qr_token ? (
                        <Link className="text-leaf-700 underline" href={`/t/${b.qr_token}`}>Xem hồ sơ</Link>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-3 font-semibold">Đánh giá từ khách đã nhận hàng</h2>
        {product.reviews.length === 0 ? (
          <p className="text-sm text-leaf-700">Chưa có đánh giá nào.</p>
        ) : (
          <ul className="space-y-3">
            {product.reviews.map((r, i) => (
              <li key={`${r.created_at}-${i}`} className="rounded-lg bg-leaf-50/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{r.customer_name}</span>
                  <span className="text-amber-700">{'★'.repeat(r.rating)}</span>
                  <span className="ml-auto text-xs text-leaf-600">{dateVN(r.created_at)}</span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-leaf-800">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-leaf-600">
          Đánh giá chỉ mở cho khách đã nhận hàng (trạng thái Đã giao/Hoàn tất).
        </p>
      </section>
    </div>
  )
}
