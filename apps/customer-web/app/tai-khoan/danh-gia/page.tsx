import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateVN } from '@/lib/format'
import { PageHeader, EmptyState, Badge, Icon } from '@agrimarket/ui'

interface Review {
  id: string
  rating: number
  comment: string
  status: string
  created_at: string
  product_name: string
  order_code: string
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-amber-500" aria-label={`${rating} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" className="h-3.5 w-3.5" filled={n <= rating} />
      ))}
    </span>
  )
}

export default async function ReviewsPage() {
  const list = await serverFetch<Review[]>('/me/reviews', await authCookie())
  return (
    <div className="space-y-4">
      <PageHeader
        title="Đánh giá của tôi"
        description="Chia sẻ cảm nhận về sản phẩm bạn đã nhận để người mua sau yên tâm hơn."
        breadcrumb={<Link href="/tai-khoan" className="hover:underline">Tài khoản</Link>}
        actions={
          <Link href="/tai-khoan/don-hang" className="btn-secondary btn-sm">
            <Icon name="orders" className="h-4 w-4" /> Đơn hàng
          </Link>
        }
      />
      {!list || list.length === 0 ? (
        <EmptyState
          icon="review"
          title="Chưa có đánh giá"
          hint="Bạn có thể đánh giá sau khi đơn hàng được giao."
          action={
            <Link href="/tai-khoan/don-hang" className="btn-primary btn-sm">
              Xem đơn hàng
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r.id} className="card-pad space-y-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink-900">{r.product_name}</span>
                <Stars rating={r.rating} />
                {r.status === 'HIDDEN' && <Badge tone="neutral">Đã ẩn</Badge>}
                <span className="ml-auto text-xs text-ink-500 tabular-nums">{dateVN(r.created_at)}</span>
              </div>
              {r.comment && <p className="text-ink-700 whitespace-pre-line">{r.comment}</p>}
              <p className="text-xs text-ink-500">Đơn {r.order_code}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
