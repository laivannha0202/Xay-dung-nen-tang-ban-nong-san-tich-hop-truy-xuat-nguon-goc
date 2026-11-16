import { PageHeader, Kpi, StatusPill, EmptyState, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateVN } from '@/lib/format'
import { CreateForm, Field, Act } from '@/components/admin-kit'

interface Promotion {
  id: string
  code: string
  name: string
  type: string
  value: number
  start_at: string
  end_at: string
  usage_limit: number | null
  used_count: number
  min_subtotal_vnd: number
  status: string
}

const PROMO_STATUS: Record<string, string> = { ACTIVE: 'Đang chạy', INACTIVE: 'Tạm dừng' }

export default async function AdminPromotions() {
  const list = await serverFetch<Promotion[]>('/admin/promotions', await authCookie())
  const rows = list ?? []
  const running = rows.filter((p) => p.status === 'ACTIVE').length
  const used = rows.reduce((sum, p) => sum + Number(p.used_count ?? 0), 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Khuyến mãi"
        breadcrumb="Bán hàng / Khuyến mãi"
        description="Mã giảm giá áp trên tiền hàng trước giảm giá. Mã hết hạn hoặc hết lượt sẽ bị từ chối khi đặt hàng."
        actions={
          <div className="flex gap-2">
            <Badge tone="neutral">{rows.length} mã</Badge>
            <Badge tone="success">{running} đang chạy</Badge>
          </div>
        }
      />

      {rows.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Tổng mã" value={rows.length} icon="promotion" tone="brand" />
          <Kpi label="Đang chạy" value={running} hint="Khách dùng được ngay" icon="check" tone="success" />
          <Kpi label="Tạm dừng" value={rows.length - running} hint="Bị từ chối khi đặt hàng" icon="clock" tone="warning" />
          <Kpi label="Lượt đã dùng" value={used} hint="Tích luỹ toàn bộ mã" icon="cart" tone="info" />
        </div>
      )}

      <CreateForm
        path="/admin/promotions"
        title="Thêm mã khuyến mãi"
        fields={
          <>
            <Field label="Mã" name="code" required placeholder="VD: MUAHE20" />
            <Field label="Tên chương trình" name="name" required />
            <Field label="Loại" name="type" required options={[{ value: 'PERCENT', label: 'Giảm theo %' }, { value: 'AMOUNT', label: 'Giảm số tiền' }]} />
            <Field label="Giá trị" name="value" type="number" required placeholder="20 (%) hoặc 50000 (VNĐ)" />
            <Field label="Bắt đầu" name="start_at" type="date" required />
            <Field label="Kết thúc" name="end_at" type="date" required />
            <Field label="Giới hạn lượt dùng" name="usage_limit" type="number" />
            <Field label="Đơn tối thiểu (VNĐ)" name="min_subtotal_vnd" type="number" defaultValue={0} />
          </>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="Chưa có mã khuyến mãi" hint="Tạo mã đầu tiên để chạy chương trình giảm giá." icon="promotion" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Chương trình</th>
                <th className="text-right">Giá trị</th>
                <th>Thời gian</th>
                <th className="text-right">Lượt dùng</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono font-medium text-ink-900">{p.code}</td>
                  <td>
                    <span className="font-medium text-ink-900">{p.name}</span>
                    <p className="text-xs text-ink-500">Đơn tối thiểu {vnd(p.min_subtotal_vnd)}</p>
                  </td>
                  <td className="text-right tabular-nums">
                    {p.type === 'PERCENT' ? `−${p.value}%` : `−${vnd(p.value)}`}
                  </td>
                  <td className="text-xs text-ink-500">
                    {dateVN(p.start_at)} → {dateVN(p.end_at)}
                  </td>
                  <td className="text-right tabular-nums">
                    {p.used_count}
                    {p.usage_limit ? <span className="text-ink-500"> / {p.usage_limit}</span> : ''}
                  </td>
                  <td>
                    <StatusPill value={p.status} label={PROMO_STATUS[p.status]} />
                  </td>
                  <td className="text-right">
                    <Act
                      path={`/admin/promotions/${p.id}`}
                      method="PATCH"
                      body={{ status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }}
                      label={p.status === 'ACTIVE' ? 'Tạm dừng' : 'Bật lại'}
                      className="btn-ghost btn-sm"
                    />
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
