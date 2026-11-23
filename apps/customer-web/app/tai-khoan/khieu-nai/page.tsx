import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateVN, COMPLAINT_STATUS, COMPLAINT_TYPE } from '@/lib/format'
import { PageHeader, StatusPill, EmptyState, Icon } from '@agrimarket/ui'
import { AccountBreadcrumb } from '@/components/account-nav'

interface Row {
  id: string
  code: string
  type: string
  status: string
  created_at: string
  batch_code: string | null
  order_code: string | null
  message_count: number
}

export default async function ComplaintsPage() {
  const list = await serverFetch<Row[]>('/me/complaints', await authCookie())
  return (
    <div className="space-y-4">
      <PageHeader
        title="Khiếu nại"
        description="Bạn có thể khiếu nại từ đơn hàng hoặc trực tiếp từ trang tra cứu tem QR."
        breadcrumb={<AccountBreadcrumb />}
        actions={
          <Link href="/tai-khoan/don-hang" className="btn-secondary btn-sm">
            <Icon name="orders" className="h-4 w-4" /> Đơn hàng
          </Link>
        }
      />
      {!list || list.length === 0 ? (
        <EmptyState
          icon="complaint"
          title="Chưa có khiếu nại"
          hint="Mọi phản hồi đều được lưu vết và trả lời trong mục này."
        />
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.id}>
              <Link
                href={`/tai-khoan/khieu-nai/${c.id}`}
                className="card-pad card-hover flex flex-wrap items-center gap-2 text-sm"
              >
                <span className="font-medium text-ink-900">{c.code}</span>
                <StatusPill value={c.status} label={COMPLAINT_STATUS[c.status] ?? c.status} />
                <span className="text-ink-600">{COMPLAINT_TYPE[c.type] ?? c.type}</span>
                {c.batch_code && <span className="text-xs text-ink-500">Lô {c.batch_code}</span>}
                {c.order_code && <span className="text-xs text-ink-500">Đơn {c.order_code}</span>}
                <span className="ml-auto text-xs text-ink-500 tabular-nums">
                  {dateVN(c.created_at)} · {c.message_count} tin nhắn
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
