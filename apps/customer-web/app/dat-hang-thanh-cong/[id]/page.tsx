import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { authCookie, currentUser } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty, dateTimeVN, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/format'
import { Icon, StatusPill } from '@agrimarket/ui'

interface Order {
  id: string
  code: string
  status: string
  payment_status: string
  payment_method: string
  total_vnd: number
  placed_at: string
  address_snapshot: Record<string, string>
  lines: Array<{
    id: string
    product_name: string
    unit: string
    quantity: number
    unit_price_vnd: number
    allocations: Array<{ batch_code: string; reserved_qty: number; shipped_qty: number }>
  }>
}

export default async function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await currentUser()
  if (!user) redirect('/dang-nhap')
  const order = await serverFetch<Order>(`/me/orders/${id}`, await authCookie())
  if (!order) notFound()
  const addr = order.address_snapshot as Record<string, string>

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700"><Icon name="check" className="h-6 w-6" /></span>
        <h1 className="mt-3 text-xl font-semibold text-ink-900">Đặt hàng thành công</h1>
        <p className="mt-1 text-sm text-leaf-700">
          Mã đơn <span className="font-medium">{order.code}</span> · {dateTimeVN(order.placed_at)}
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <StatusPill value={order.status} label={ORDER_STATUS[order.status] ?? order.status} />
          <StatusPill value={order.payment_status} label={PAYMENT_STATUS[order.payment_status] ?? order.payment_status} />
        </div>
      </div>

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Lô hàng đã giữ chỗ</h2>
        <ul className="space-y-2 text-sm">
          {order.lines.map((l) => (
            <li key={l.id} className="rounded-lg bg-leaf-50/70 p-3">
              <p className="font-medium">{l.product_name} · {qty(l.quantity)} {l.unit}</p>
              <p className="text-xs text-leaf-700">
                {(l.allocations ?? []).map((a) => `Lô ${a.batch_code}: ${qty(a.reserved_qty)} ${l.unit}`).join(' · ')}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm"><span className="text-leaf-600">Giao tới: </span>{addr.recipient_name} · {addr.phone}</p>
        <p className="text-sm text-leaf-700">{addr.street_detail}, {addr.ward}, {addr.district}, {addr.province}</p>
        <p className="mt-2 text-base font-semibold">Tổng: {vnd(order.total_vnd)}</p>
        {order.payment_method === 'BANK_TRANSFER' && order.payment_status === 'UNPAID' && (
          <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            Đơn chuyển khoản được xác nhận thủ công. Nội dung chuyển khoản ghi mã đơn {order.code}.
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href={`/tai-khoan/don-hang/${order.id}`} className="btn-primary">Theo dõi đơn</Link>
        <Link href="/san-pham" className="btn-secondary">Mua tiếp</Link>
      </div>
    </div>
  )
}
