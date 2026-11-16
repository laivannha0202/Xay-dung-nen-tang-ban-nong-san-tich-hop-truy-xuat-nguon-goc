import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateTimeVN, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/format'
import { StatusBadge, Empty } from '@/components/ui'

interface Row {
  id: string
  code: string
  status: string
  payment_status: string
  total_vnd: number
  placed_at: string
  line_count: number
  items: Array<{ name: string; image: string | null }>
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>
}) {
  const sp = await searchParams
  const status = sp.status ?? ''
  const from = sp.from ?? ''
  const to = sp.to ?? ''
  const qs = new URLSearchParams()
  if (status) qs.set('status', status)
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  const list = await serverFetch<{ data: Row[]; total: number }>(
    `/me/orders${qs.size > 0 ? `?${qs.toString()}` : ''}`,
    await authCookie(),
  )
  const tabs = [
    { v: '', label: 'Tất cả' },
    { v: 'PENDING', label: 'Chờ xác nhận' },
    { v: 'SHIPPING', label: 'Đang giao' },
    { v: 'DELIVERED', label: 'Đã giao' },
  ]

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Đơn hàng của tôi</h1>
      <div className="flex gap-1 overflow-x-auto text-sm">
        {tabs.map((t) => (
          <Link
            key={t.v}
            href={t.v ? `/tai-khoan/don-hang?status=${t.v}` : '/tai-khoan/don-hang'}
            className={`badge whitespace-nowrap px-3 py-1.5 ${status === t.v ? 'bg-leaf-600 text-white' : 'bg-leaf-50 text-leaf-800'}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <form action="/tai-khoan/don-hang" className="card flex flex-wrap items-end gap-3 p-3 text-sm">
        {status && <input type="hidden" name="status" value={status} />}
        <div>
          <label className="label" htmlFor="from">Từ ngày</label>
          <input id="from" name="from" type="date" defaultValue={from} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="to">Đến ngày</label>
          <input id="to" name="to" type="date" defaultValue={to} className="input" />
        </div>
        <button className="btn-primary" type="submit">Lọc</button>
        {(from || to) && (
          <Link href={status ? `/tai-khoan/don-hang?status=${status}` : '/tai-khoan/don-hang'} className="btn-ghost">Xóa lọc</Link>
        )}
      </form>

      {!list || list.data.length === 0 ? (
        <Empty title="Chưa có đơn hàng" hint="Đơn hàng bạn đặt trên Website hoặc Ứng dụng đều hiển thị ở đây." action={<Link href="/san-pham" className="btn-primary mt-2">Mua nông sản</Link>} />
      ) : (
        <ul className="space-y-2">
          {list.data.map((o) => (
            <li key={o.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/tai-khoan/don-hang/${o.id}`} className="font-medium hover:underline">{o.code}</Link>
                <StatusBadge map={ORDER_STATUS} value={o.status} />
                <StatusBadge map={PAYMENT_STATUS} value={o.payment_status} />
                <span className="ml-auto text-sm font-semibold">{vnd(o.total_vnd)}</span>
              </div>
              <p className="mt-1 text-xs text-leaf-600">{dateTimeVN(o.placed_at)} · {o.line_count} sản phẩm</p>
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {(o.items ?? []).map((it, i) => (
                  <img key={i} src={it.image ?? ''} alt={it.name} className="h-12 w-12 rounded bg-leaf-50 object-cover" />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
