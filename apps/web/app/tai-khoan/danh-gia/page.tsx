import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateVN } from '@/lib/format'
import { Empty } from '@/components/ui'

interface Review {
  id: string
  rating: number
  comment: string
  status: string
  created_at: string
  product_name: string
  order_code: string
}

export default async function ReviewsPage() {
  const list = await serverFetch<Review[]>('/me/reviews', await authCookie())
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Đánh giá của tôi</h1>
      {!list || list.length === 0 ? (
        <Empty title="Chưa có đánh giá" hint="Bạn có thể đánh giá sau khi đơn hàng được giao." />
      ) : (
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r.id} className="card p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{r.product_name}</span>
                <span className="text-amber-700">{'★'.repeat(r.rating)}</span>
                {r.status === 'HIDDEN' && <span className="badge bg-slate-100 text-slate-700">Đã ẩn</span>}
                <span className="ml-auto text-xs text-leaf-600">{dateVN(r.created_at)}</span>
              </div>
              {r.comment && <p className="mt-1 text-leaf-800">{r.comment}</p>}
              <p className="mt-1 text-xs text-leaf-600">Đơn {r.order_code}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
