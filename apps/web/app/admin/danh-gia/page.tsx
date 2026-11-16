import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateTimeVN } from '@/lib/format'
import { Act } from '@/components/admin-kit'
import { Empty } from '@/components/ui'

interface Review {
  id: string
  rating: number
  comment: string
  status: string
  created_at: string
  product_name: string
  order_code: string
  customer_name: string | null
  hidden_reason: string | null
}

export default async function AdminReviews() {
  const list = await serverFetch<Review[]>('/admin/reviews', await authCookie())
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Đánh giá</h1>
      {!list || list.length === 0 ? (
        <Empty title="Chưa có đánh giá" />
      ) : (
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r.id} className="card p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{r.product_name}</span>
                <span className="text-amber-700">{'★'.repeat(r.rating)}</span>
                <span className="text-xs text-leaf-600">{r.order_code} · {r.customer_name ?? 'Khách'}</span>
                {r.status === 'HIDDEN' && (
                  <span className="badge bg-slate-100 text-slate-700">Đã ẩn{r.hidden_reason ? `: ${r.hidden_reason}` : ''}</span>
                )}
                <span className="ml-auto text-xs text-leaf-600">{dateTimeVN(r.created_at)}</span>
              </div>
              {r.comment && <p className="mt-1 text-leaf-800">{r.comment}</p>}
              {r.status !== 'HIDDEN' && (
                <div className="mt-2">
                  <Act
                    path={`/admin/reviews/${r.id}/hide`}
                    label="Ẩn đánh giá"
                    className="btn-ghost text-xs text-red-700"
                    promptLabel="Lý do ẩn (tối thiểu 5 ký tự, lưu vết kiểm toán):"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
