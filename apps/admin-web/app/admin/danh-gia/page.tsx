import { PageHeader, Kpi, StatusPill, EmptyState } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateTimeVN } from '@/lib/format'
import { Act, DemoTag } from '@/components/admin-kit'

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
  is_demo: boolean
}

const REVIEW_STATUS: Record<string, string> = { VISIBLE: 'Đang hiển thị', HIDDEN: 'Đã ẩn' }

export default async function AdminReviews() {
  const list = await serverFetch<Review[]>('/admin/reviews', await authCookie())
  const rows = list ?? []
  const hidden = rows.filter((r) => r.status === 'HIDDEN').length
  const average = rows.length > 0 ? rows.reduce((sum, r) => sum + Number(r.rating ?? 0), 0) / rows.length : 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="Đánh giá"
        breadcrumb="Bán hàng / Đánh giá"
        description="Đánh giá của khách sau khi nhận hàng. Ẩn đánh giá cần ghi lý do để lưu vết kiểm toán."
      />

      {rows.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi label="Tổng đánh giá" value={rows.length} icon="star" tone="brand" />
          <Kpi label="Điểm trung bình" value={`${average.toFixed(1)} ★`} hint="Trên toàn bộ đánh giá" icon="star" tone="warning" />
          <Kpi label="Đang ẩn" value={hidden} hint="Không hiển thị ở cửa hàng" icon="shield" tone="neutral" />
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState title="Chưa có đánh giá" hint="Đánh giá xuất hiện sau khi khách nhận hàng và chấm điểm." icon="review" />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="card-pad space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink-900">{r.product_name}</span>
                <span className="text-amber-600" aria-label={`${r.rating} trên 5`}>
                  {'★'.repeat(r.rating)}
                  <span className="text-ink-300">{'★'.repeat(Math.max(0, 5 - r.rating))}</span>
                </span>
                <StatusPill value={r.status} label={REVIEW_STATUS[r.status]} />
                {r.is_demo && <DemoTag />}
                <span className="ml-auto text-xs text-ink-500">{dateTimeVN(r.created_at)}</span>
              </div>
              <p className="text-xs text-ink-500">
                {r.order_code} · {r.customer_name ?? 'Khách'}
                {r.hidden_reason ? ` · Lý do ẩn: ${r.hidden_reason}` : ''}
              </p>
              {r.comment && <p className="text-ink-700">{r.comment}</p>}
              {r.status !== 'HIDDEN' && (
                <Act
                  path={`/admin/reviews/${r.id}/hide`}
                  label="Ẩn đánh giá"
                  className="btn-danger btn-sm"
                  promptLabel="Lý do ẩn (tối thiểu 5 ký tự, lưu vết kiểm toán):"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
