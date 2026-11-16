import Link from 'next/link'
import { notFound } from 'next/navigation'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateVN, dateTimeVN, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/format'
import { StatusBadge } from '@/components/ui'

interface Detail {
  id: string
  email: string
  status: string
  created_at: string
  name: string | null
  phone: string | null
  orders: Array<{ id: string; code: string; status: string; payment_status: string; total_vnd: number; placed_at: string }>
  addresses: Array<{ id: string; recipient_name: string; phone: string; street_detail: string; ward: string; district: string; province: string; is_default: boolean }>
}

export default async function AdminCustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await serverFetch<Detail>(`/admin/customers/${id}`, await authCookie())
  if (!c) notFound()
  const spent = c.orders
    .filter((o) => o.payment_status !== 'UNPAID')
    .reduce((s, o) => s + o.total_vnd, 0)

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">{c.name ?? c.email}</h1>
        <p className="text-sm text-leaf-700">{c.email}{c.phone && ` · ${c.phone}`} · tham gia {dateVN(c.created_at)}</p>
        <span className={`badge mt-1 ${c.status === 'ACTIVE' ? 'bg-leaf-100 text-leaf-800' : 'bg-red-100 text-red-800'}`}>
          {c.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
        </span>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-3"><p className="text-xs text-leaf-600">Số đơn</p><p className="font-semibold">{c.orders.length}</p></div>
        <div className="card p-3"><p className="text-xs text-leaf-600">Tổng đã thanh toán</p><p className="font-semibold">{vnd(spent)}</p></div>
        <div className="card p-3"><p className="text-xs text-leaf-600">Địa chỉ</p><p className="font-semibold">{c.addresses.length}</p></div>
      </div>

      <section className="card overflow-x-auto p-4">
        <h2 className="mb-2 font-semibold">Đơn hàng</h2>
        {c.orders.length === 0 ? (
          <p className="text-sm text-leaf-700">Chưa có đơn.</p>
        ) : (
          <table className="table-base">
            <thead><tr><th>Mã</th><th>Tổng</th><th>Trạng thái</th><th>Thanh toán</th><th>Lúc</th></tr></thead>
            <tbody>
              {c.orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/don-hang/${o.id}`} className="font-medium hover:underline">{o.code}</Link></td>
                  <td>{vnd(o.total_vnd)}</td>
                  <td><StatusBadge map={ORDER_STATUS} value={o.status} /></td>
                  <td><StatusBadge map={PAYMENT_STATUS} value={o.payment_status} /></td>
                  <td className="text-xs">{dateTimeVN(o.placed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card p-4 text-sm">
        <h2 className="mb-2 font-semibold">Địa chỉ</h2>
        <ul className="space-y-1">
          {c.addresses.map((a) => (
            <li key={a.id}>
              {a.recipient_name} · {a.phone} — {a.street_detail}, {a.ward}, {a.district}, {a.province}
              {a.is_default && <span className="badge ml-2 bg-leaf-100 text-leaf-700">Mặc định</span>}
            </li>
          ))}
        </ul>
      </section>

      <Link href="/admin/khach-hang" className="btn-ghost">← Danh sách khách</Link>
    </div>
  )
}

export const dynamic = 'force-dynamic'
