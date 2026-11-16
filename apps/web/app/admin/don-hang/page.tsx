import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateTimeVN, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/format'
import { StatusBadge } from '@/components/ui'

interface Row {
  id: string
  code: string
  status: string
  payment_status: string
  payment_method: string
  total_vnd: number
  placed_at: string
  customer_email: string
  customer_name: string | null
  line_count: number
  needs_reallocation: boolean
}

const STATUS_TABS = [
  { v: '', label: 'Tất cả' },
  { v: 'PENDING', label: 'Chờ xác nhận' },
  { v: 'CONFIRMED', label: 'Đã xác nhận' },
  { v: 'PREPARING', label: 'Chuẩn bị' },
  { v: 'SHIPPING', label: 'Đang giao' },
  { v: 'DELIVERED', label: 'Đã giao' },
  { v: 'COMPLETED', label: 'Hoàn tất' },
  { v: 'CANCELLED', label: 'Đã hủy' },
]

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; search?: string }> }) {
  const sp = await searchParams
  const qs = new URLSearchParams()
  if (sp.status) qs.set('status', sp.status)
  if (sp.search) qs.set('search', sp.search)
  const list = await serverFetch<{ data: Row[]; total: number }>(`/admin/orders?${qs.toString()}`, await authCookie())

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">Đơn hàng</h1>
        <form className="ml-auto flex gap-2" action="/admin/don-hang">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input name="search" defaultValue={sp.search ?? ''} className="input" placeholder="Mã đơn hoặc email" />
          <button className="btn-secondary">Tìm</button>
        </form>
      </div>

      <div className="flex gap-1 overflow-x-auto text-sm">
        {STATUS_TABS.map((t) => {
          const params = new URLSearchParams()
          if (t.v) params.set('status', t.v)
          if (sp.search) params.set('search', sp.search)
          return (
            <Link
              key={t.v}
              href={`/admin/don-hang${params.size ? `?${params}` : ''}`}
              className={`badge whitespace-nowrap px-3 py-1.5 ${(sp.status ?? '') === t.v ? 'bg-leaf-600 text-white' : 'bg-leaf-50 text-leaf-800'}`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>Đơn</th><th>Khách</th><th>Tổng</th><th>Thanh toán</th><th>Trạng thái</th><th>Đặt lúc</th></tr>
          </thead>
          <tbody>
            {(list?.data ?? []).map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/admin/don-hang/${o.id}`} className="font-medium hover:underline">{o.code}</Link>
                  <p className="text-xs text-leaf-600">{o.line_count} sản phẩm{o.needs_reallocation && ' · cần đổi lô'}</p>
                </td>
                <td className="text-xs">
                  {o.customer_name ?? '—'}<br />
                  <span className="text-leaf-700">{o.customer_email}</span>
                </td>
                <td>{vnd(o.total_vnd)}</td>
                <td>
                  <StatusBadge map={PAYMENT_STATUS} value={o.payment_status} />
                  <p className="text-xs text-leaf-600">{o.payment_method === 'COD' ? 'COD' : 'Chuyển khoản'}</p>
                </td>
                <td><StatusBadge map={ORDER_STATUS} value={o.status} /></td>
                <td className="text-xs">{dateTimeVN(o.placed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-leaf-600">{list?.total ?? 0} đơn</p>
    </div>
  )
}

export const dynamic = 'force-dynamic'
