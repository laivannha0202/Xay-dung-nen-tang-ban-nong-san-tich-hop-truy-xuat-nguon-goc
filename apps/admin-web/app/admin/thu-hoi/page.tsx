import Link from 'next/link'
import { PageHeader, Kpi, StatusPill, EmptyState, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateTimeVN, RECALL_SEVERITY } from '@/lib/format'

interface Recall {
  id: string
  reason: string
  severity: string
  status: string
  started_at: string
  closed_at: string | null
  batch_code: string
  product_name: string
  affected_count: number
}

const STATUS_LABEL: Record<string, string> = { OPEN: 'Đang xử lý', CLOSED: 'Đã kết thúc' }

export default async function AdminRecalls() {
  const list = await serverFetch<Recall[]>('/admin/recalls', await authCookie())
  const rows = list ?? []
  const open = rows.filter((r) => r.status === 'OPEN').length
  const severe = rows.filter((r) => r.severity === 'HIGH').length
  const affected = rows.reduce((sum, r) => sum + Number(r.affected_count ?? 0), 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Thu hồi lô hàng"
        breadcrumb="Hàng hoá / Thu hồi"
        description="Tạo đợt thu hồi từ trang chi tiết lô hàng. Hệ thống tự chặn bán, giải phóng đơn chưa xuất và lập danh sách khách đã nhận lô."
        actions={
          <div className="flex gap-2">
            <Badge tone="neutral">{rows.length} đợt</Badge>
            {open > 0 && <Badge tone="danger">{open} đang xử lý</Badge>}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Tổng đợt thu hồi" value={rows.length} icon="recall" tone="info" />
        <Kpi label="Đang xử lý" value={open} icon="alert" tone={open ? 'danger' : 'neutral'} hint="Chưa có biên bản kết thúc" />
        <Kpi label="Mức nghiêm trọng" value={severe} icon="shield" tone={severe ? 'danger' : 'neutral'} hint="Phân loại HIGH" />
        <Kpi label="Khách ảnh hưởng" value={affected} icon="customer" tone="warning" hint="Tổng trên trang hiện tại" />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Chưa có đợt thu hồi" hint="Mọi đợt thu hồi đều được lưu vết tại đây." icon="recall" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Lô</th>
                <th>Lý do</th>
                <th>Mức độ</th>
                <th className="text-right">Khách ảnh hưởng</th>
                <th>Bắt đầu</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/thu-hoi/${r.id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline">
                      {r.batch_code}
                    </Link>
                    <p className="text-xs text-ink-500">{r.product_name}</p>
                  </td>
                  <td className="max-w-64 truncate text-ink-600">{r.reason}</td>
                  <td><StatusPill value={r.severity} label={RECALL_SEVERITY[r.severity]} /></td>
                  <td className="text-right tabular-nums">{r.affected_count}</td>
                  <td className="text-xs text-ink-600">{dateTimeVN(r.started_at)}</td>
                  <td><StatusPill value={r.status} label={STATUS_LABEL[r.status]} /></td>
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
