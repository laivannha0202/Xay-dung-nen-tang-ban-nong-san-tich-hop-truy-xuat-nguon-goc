import Link from 'next/link'
import { PageHeader, Kpi, StatusPill, EmptyState, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateVN } from '@/lib/format'
import { Act } from '@/components/admin-kit'
import { Toolbar } from '@/components/toolbar'

interface Row {
  id: string
  email: string
  status: string
  created_at: string
  name: string | null
  phone: string | null
  order_count: number
  spent_vnd: number
}

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Hoạt động', LOCKED: 'Đã khóa' }

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const sp = await searchParams
  const qs = sp.search ? `?search=${encodeURIComponent(sp.search)}` : ''
  const list = await serverFetch<{ data: Row[]; total: number }>(`/admin/customers${qs}`, await authCookie())
  const rows = list?.data ?? []
  const locked = rows.filter((c) => c.status !== 'ACTIVE').length
  const spent = rows.reduce((sum, c) => sum + Number(c.spent_vnd ?? 0), 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Khách hàng"
        breadcrumb="Bán hàng / Khách hàng"
        description="Hồ sơ khách, chi tiêu tích luỹ và trạng thái tài khoản. Khoá tài khoản thu hồi phiên đăng nhập ngay lập tức."
        actions={
          <Toolbar action="/admin/khach-hang" search={{ name: 'search', value: sp.search }} placeholder="Email hoặc tên" submitLabel="Tìm" />
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Tổng khách" value={list?.total ?? rows.length} icon="customer" tone="info" />
        <Kpi label="Đang hoạt động" value={rows.length - locked} icon="check" tone="success" hint={locked ? `${locked} tài khoản đang bị khoá` : 'Không có tài khoản bị khoá'} />
        <Kpi label="Chi tiêu tích luỹ" value={vnd(spent)} icon="payment" tone="brand" hint="Trong trang hiện tại" />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={sp.search ? 'Không tìm thấy khách phù hợp' : 'Chưa có khách hàng'}
          hint={sp.search ? `Không có kết quả cho “${sp.search}”.` : 'Khách đăng ký tài khoản sẽ xuất hiện ở đây.'}
          icon="customer"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Khách</th>
                <th className="text-right">Đơn</th>
                <th className="text-right">Đã chi</th>
                <th>Tham gia</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/khach-hang/${c.id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline">
                      {c.name ?? c.email}
                    </Link>
                    <p className="text-xs text-ink-500">
                      {c.email}
                      {c.phone && ` · ${c.phone}`}
                    </p>
                  </td>
                  <td className="text-right tabular-nums">{c.order_count}</td>
                  <td className="text-right tabular-nums">{vnd(c.spent_vnd)}</td>
                  <td className="text-xs text-ink-600">{dateVN(c.created_at)}</td>
                  <td>
                    <StatusPill value={c.status} label={STATUS_LABEL[c.status]} />
                  </td>
                  <td className="text-right">
                    <Act
                      path={`/admin/customers/${c.id}/status`}
                      body={{ status: c.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' }}
                      label={c.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                      className="btn-ghost btn-sm"
                      promptLabel={c.status === 'ACTIVE' ? 'Lý do khóa tài khoản:' : 'Lý do mở khóa:'}
                      confirmText="Phiên đăng nhập hiện tại của khách sẽ bị thu hồi ngay."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-ink-500">{list?.total ?? 0} khách hàng</p>
    </div>
  )
}

export const dynamic = 'force-dynamic'
