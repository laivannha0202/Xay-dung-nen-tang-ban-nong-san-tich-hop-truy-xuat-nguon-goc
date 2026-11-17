import Link from 'next/link'
import { PageHeader, Kpi, StatusPill, EmptyState, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch, API_BASE } from '@/lib/api'
import { CUSTOMER_WEB } from '@/lib/config'
import { dateTimeVN, PUBLICATION, SAFETY } from '@/lib/format'
import { Act } from '@/components/admin-kit'

interface Qr {
  id: string
  token: string
  status: string
  created_at: string
  batch_id: string
  batch_code: string
  publication_status: string
  safety_status: string
  product_name: string
  scan_count: number
  last_scan: string | null
}

export default async function AdminQrCodes() {
  const list = await serverFetch<Qr[]>('/admin/qr-codes', await authCookie())
  const rows = list ?? []
  const scans = rows.reduce((sum, qr) => sum + Number(qr.scan_count ?? 0), 0)
  const published = rows.filter((qr) => qr.publication_status === 'PUBLISHED').length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mã QR truy xuất"
        breadcrumb="Truy xuất / Mã QR"
        description="Mỗi lô đã công khai có một tem QR. Tạo lại token sẽ làm tem cũ ngừng hoạt động — chỉ dùng khi tem bị lộ."
        actions={<Badge tone="neutral">{rows.length} tem</Badge>}
      />

      {rows.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi label="Tem QR" value={rows.length} hint="Tổng số token đã phát" icon="qr" tone="brand" />
          <Kpi label="Đã công khai" value={published} hint="Tem khách tra cứu được" icon="shield" tone="success" />
          <Kpi label="Lượt quét" value={scans} hint="Tích luỹ toàn hệ thống" icon="report" tone="info" />
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="Chưa có tem QR"
          hint="Công khai một lô hàng để hệ thống sinh tem truy xuất."
          icon="qr"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Lô</th>
                <th>Token</th>
                <th className="text-right">Lượt quét</th>
                <th>Quét gần nhất</th>
                <th>Công khai</th>
                <th>An toàn</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((qr) => (
                <tr key={qr.id}>
                  <td>
                    <Link href={`/admin/lo-hang/${qr.batch_id}`} className="font-medium text-ink-900 hover:underline">
                      {qr.batch_code}
                    </Link>
                    <p className="text-xs text-ink-500">{qr.product_name}</p>
                  </td>
                  <td className="max-w-40 truncate font-mono text-xs text-ink-500">{qr.token}</td>
                  <td className="text-right tabular-nums">{qr.scan_count}</td>
                  <td className="text-xs text-ink-500">{qr.last_scan ? dateTimeVN(qr.last_scan) : '—'}</td>
                  <td>
                    <StatusPill value={qr.publication_status} label={PUBLICATION[qr.publication_status]} />
                  </td>
                  <td>
                    <StatusPill value={qr.safety_status} label={SAFETY[qr.safety_status]} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <a href={`${CUSTOMER_WEB}/t/${qr.token}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                        Mở
                      </a>
                      <a href={`${API_BASE}/admin/batches/${qr.batch_id}/label.pdf`} className="btn-secondary btn-sm" download target="_blank">
                        PNG
                      </a>
                      <Act
                        path={`/admin/qr-codes/${qr.id}/regenerate`}
                        label="Tạo lại"
                        className="btn-ghost btn-sm"
                        confirmText="Tạo lại token? Tem cũ sẽ không còn truy xuất được."
                      />
                    </div>
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
