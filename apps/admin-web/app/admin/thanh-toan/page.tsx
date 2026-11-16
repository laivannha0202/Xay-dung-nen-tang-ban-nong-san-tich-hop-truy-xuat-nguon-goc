import Link from 'next/link'
import { PageHeader, Kpi, StatusPill, EmptyState, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateTimeVN } from '@/lib/format'
import { Act } from '@/components/admin-kit'

interface Refund {
  id: string
  order_id: string
  order_code: string
  customer_email: string
  amount_vnd: number
  reason: string
  status: string
  note: string
  created_at: string
  completed_at: string | null
}

const REFUND_STATUS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  COMPLETED: 'Đã hoàn tất',
  REJECTED: 'Từ chối',
}

export default async function AdminPayments() {
  const refunds = await serverFetch<Refund[]>('/admin/refunds', await authCookie())
  const rows = refunds ?? []
  const pending = rows.filter((r) => r.status === 'PENDING')
  const approved = rows.filter((r) => r.status === 'APPROVED')
  const completed = rows.filter((r) => r.status === 'COMPLETED')
  const pendingTotal = pending.reduce((s, r) => s + Number(r.amount_vnd ?? 0), 0)
  const completedTotal = completed.reduce((s, r) => s + Number(r.amount_vnd ?? 0), 0)
  const requestedTotal = rows.reduce((s, r) => s + Number(r.amount_vnd ?? 0), 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Thanh toán & hoàn tiền"
        breadcrumb="Bán hàng / Thanh toán"
        description="Xác nhận thanh toán chuyển khoản tại trang chi tiết đơn hàng. Yêu cầu hoàn tiền tạo tại đây hoặc từ trang đơn."
        actions={<Badge tone="neutral">{rows.length} yêu cầu</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Chờ duyệt" value={pending.length} icon="clock" tone="warning" hint={pending.length ? `${vnd(pendingTotal)} đang chờ` : 'Không có yêu cầu mới'} />
        <Kpi label="Đã duyệt" value={approved.length} icon="check" tone="info" hint="Chờ chuyển tiền cho khách" />
        <Kpi label="Đã hoàn tất" value={completed.length} icon="payment" tone="success" hint={`Đã hoàn ${vnd(completedTotal)}`} />
        <Kpi label="Tổng đề nghị hoàn" value={vnd(requestedTotal)} icon="report" tone="brand" />
      </div>

      {pending.length > 0 && (
        <p className="text-sm text-ink-600">
          {pending.length} yêu cầu đang chờ duyệt — duyệt xong mới chuyển tiền được.
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="Chưa có yêu cầu hoàn tiền"
          hint="Mọi yêu cầu hoàn tiền đều được lưu vết kiểm toán."
          icon="payment"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Đơn</th>
                <th>Khách</th>
                <th className="text-right">Số tiền</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Tạo lúc</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/don-hang/${r.order_id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline">
                      {r.order_code}
                    </Link>
                  </td>
                  <td className="text-xs text-ink-500">{r.customer_email}</td>
                  <td className="text-right tabular-nums">{vnd(r.amount_vnd)}</td>
                  <td className="max-w-56 truncate text-xs text-ink-600">{r.reason}</td>
                  <td>
                    <StatusPill value={r.status} label={REFUND_STATUS[r.status] ?? r.status} />
                  </td>
                  <td className="text-xs text-ink-600">{dateTimeVN(r.created_at)}</td>
                  <td className="text-right">
                    {r.status === 'PENDING' && (
                      <div className="flex justify-end gap-1">
                        <Act path={`/admin/refunds/${r.id}/approve`} label="Duyệt" className="btn-primary btn-sm" />
                        <Act path={`/admin/refunds/${r.id}/reject`} label="Từ chối" className="btn-ghost btn-sm" />
                      </div>
                    )}
                    {r.status === 'APPROVED' && (
                      <Act path={`/admin/refunds/${r.id}/complete`} label="Đã chuyển tiền" className="btn-secondary btn-sm" />
                    )}
                  </td>
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
