import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader, Kpi, StatusPill, EmptyState, SectionHeader, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateVN, dateTimeVN, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/format'

interface Detail {
  id: string
  email: string
  status: string
  created_at: string
  name: string | null
  phone: string | null
  orders: Array<{ id: string; code: string; status: string; payment_status: string; total_vnd: number; placed_at: string }>
  addresses: Array<{ id: string; recipient_name: string; phone: string; street_detail: string; ward: string; ward_name?: string | null; district: string | null; province: string; is_default: boolean }>
}

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Hoạt động', LOCKED: 'Đã khóa' }

export default async function AdminCustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await serverFetch<Detail>(`/admin/customers/${id}`, await authCookie())
  if (!c) notFound()
  const spent = c.orders
    .filter((o) => o.payment_status !== 'UNPAID')
    .reduce((s, o) => s + o.total_vnd, 0)
  const openOrders = c.orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length

  return (
    <div className="space-y-5">
      <PageHeader
        title={c.name ?? c.email}
        breadcrumb="Bán hàng / Khách hàng / Chi tiết"
        description={
          <>
            {c.email}
            {c.phone && ` · ${c.phone}`} · tham gia {dateVN(c.created_at)}
          </>
        }
        actions={<StatusPill value={c.status} label={STATUS_LABEL[c.status] ?? c.status} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Số đơn" value={c.orders.length} icon="orders" tone="info" hint={openOrders ? `${openOrders} đơn chưa hoàn tất` : 'Không có đơn đang mở'} />
        <Kpi label="Tổng đã thanh toán" value={vnd(spent)} icon="payment" tone="brand" hint="Không tính đơn chưa thanh toán" />
        <Kpi label="Địa chỉ giao hàng" value={c.addresses.length} icon="pin" tone="neutral" />
        <Kpi label="Tham gia" value={dateVN(c.created_at)} icon="customer" tone="neutral" />
      </div>

      <section>
        <SectionHeader title="Đơn hàng" hint={`${c.orders.length} đơn`} />
        {c.orders.length === 0 ? (
          <EmptyState title="Chưa có đơn" hint="Khách chưa đặt đơn nào." icon="orders" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th className="text-right">Tổng</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                  <th>Lúc</th>
                </tr>
              </thead>
              <tbody>
                {c.orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/don-hang/${o.id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline">
                        {o.code}
                      </Link>
                    </td>
                    <td className="text-right tabular-nums">{vnd(o.total_vnd)}</td>
                    <td>
                      <StatusPill value={o.status} label={ORDER_STATUS[o.status]} />
                    </td>
                    <td>
                      <StatusPill value={o.payment_status} label={PAYMENT_STATUS[o.payment_status]} />
                    </td>
                    <td className="text-xs text-ink-600">{dateTimeVN(o.placed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Địa chỉ" hint={`${c.addresses.length} địa chỉ`} />
        {c.addresses.length === 0 ? (
          <EmptyState title="Chưa có địa chỉ" hint="Khách chưa lưu địa chỉ giao hàng." icon="pin" />
        ) : (
          <ul className="card-pad space-y-2 text-sm">
            {c.addresses.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink-900">{a.recipient_name}</span>
                <span className="text-ink-600">{a.phone}</span>
                <span className="text-ink-600">
                  — {[a.street_detail, a.ward_name ?? a.ward, a.district, a.province].filter(Boolean).join(', ')}
                </span>
                {a.is_default && <Badge tone="brand">Mặc định</Badge>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/admin/khach-hang" className="btn-ghost">
        ← Danh sách khách
      </Link>
    </div>
  )
}

export const dynamic = 'force-dynamic'
