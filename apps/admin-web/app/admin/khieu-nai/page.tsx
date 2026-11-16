import Link from 'next/link'
import { PageHeader, Kpi, StatusPill, EmptyState, Alert } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateTimeVN, COMPLAINT_STATUS, COMPLAINT_TYPE } from '@/lib/format'

interface Row {
  id: string
  code: string
  type: string
  status: string
  description: string
  created_at: string
  customer_email: string
  customer_name: string | null
  batch_code: string | null
  order_code: string | null
}

export default async function AdminComplaints({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams
  const list = await serverFetch<Row[]>(`/admin/complaints${sp.status ? `?status=${sp.status}` : ''}`, await authCookie())
  const rows = list ?? []
  const tabs = ['', 'NEW', 'PROCESSING', 'RESOLVED', 'CLOSED']
  const open = rows.filter((c) => c.status === 'NEW' || c.status === 'PROCESSING').length
  const oldestOpen = rows
    .filter((c) => c.status === 'NEW')
    .map((c) => c.created_at)
    .sort()[0]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Khiếu nại"
        breadcrumb="Hậu mãi / Khiếu nại"
        description="Phản ánh của khách về chất lượng nông sản. Mỗi khiếu nại gắn với lô hàng và đơn gốc để truy xuất ngược."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Tổng khiếu nại" value={rows.length} icon="complaint" tone="info" />
        <Kpi label="Cần xử lý" value={open} icon="alert" tone={open ? 'warning' : 'success'} hint={open ? 'Mới hoặc đang xử lý' : 'Đã xử lý hết'} />
        <Kpi
          label="Mới nhất chờ tiếp nhận"
          value={oldestOpen ? dateTimeVN(oldestOpen) : '—'}
          icon="clock"
          tone="neutral"
          hint={oldestOpen ? 'Khiếu nại mới lâu nhất' : 'Không có khiếu nại mới'}
        />
      </div>

      {open > 0 && sp.status !== 'RESOLVED' && sp.status !== 'CLOSED' && (
        <Alert tone="warning">
          {open} khiếu nại chưa giải quyết. Khách nhận thông báo qua email mỗi lần bạn trả lời trong hội thoại.
        </Alert>
      )}

      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t || 'all'}
            href={t ? `/admin/khieu-nai?status=${t}` : '/admin/khieu-nai'}
            className={`btn-sm whitespace-nowrap ${(sp.status ?? '') === t ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t ? COMPLAINT_STATUS[t] ?? t : 'Tất cả'}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Không có khiếu nại"
          hint={sp.status ? 'Không có khiếu nại ở trạng thái này.' : 'Khi khách gửi phản ánh, hồ sơ sẽ xuất hiện ở đây.'}
          icon="complaint"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Khách</th>
                <th>Loại</th>
                <th>Lô / Đơn</th>
                <th>Trạng thái</th>
                <th>Lúc</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/khieu-nai/${c.id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline">
                      {c.code}
                    </Link>
                    <p className="max-w-64 truncate text-xs text-ink-500">{c.description}</p>
                  </td>
                  <td>
                    {c.customer_name ?? '—'}
                    <p className="text-xs text-ink-500">{c.customer_email}</p>
                  </td>
                  <td>{COMPLAINT_TYPE[c.type] ?? c.type}</td>
                  <td className="text-xs text-ink-600">{c.batch_code ?? '—'}{c.order_code && ` · ${c.order_code}`}</td>
                  <td>
                    <StatusPill value={c.status} label={COMPLAINT_STATUS[c.status]} />
                  </td>
                  <td className="text-xs text-ink-600">{dateTimeVN(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
