import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { authCookie, currentCustomer } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty, dateTimeVN, ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } from '@/lib/format'
import { Icon, StatusPill, SectionHeader, Alert } from '@agrimarket/ui'

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
  const user = await currentCustomer()
  if (!user) redirect('/dang-nhap')
  const order = await serverFetch<Order>(`/me/orders/${id}`, await authCookie())
  if (!order) notFound()
  const addr = order.address_snapshot as Record<string, string>

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card-pad text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-700 ring-8 ring-brand-50/50">
          <Icon name="check" className="h-7 w-7" />
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">Đặt hàng thành công</h1>
        <p className="mt-1 text-sm text-ink-500">
          Mã đơn <span className="font-medium text-ink-800">{order.code}</span> · {dateTimeVN(order.placed_at)}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <StatusPill value={order.status} label={ORDER_STATUS[order.status] ?? order.status} />
          <StatusPill value={order.payment_status} label={PAYMENT_STATUS[order.payment_status] ?? order.payment_status} />
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href={`/tai-khoan/don-hang/${order.id}`} className="btn-primary">
            <Icon name="truck" className="h-4 w-4" /> Theo dõi đơn
          </Link>
          <Link href="/san-pham" className="btn-secondary">Mua tiếp</Link>
        </div>
      </div>

      <section className="card-pad">
        <SectionHeader title="Lô hàng đã giữ chỗ" hint={`${order.lines.length} sản phẩm`} />
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th className="text-right">Số lượng</th>
                <th>Lô</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => (
                <tr key={l.id}>
                  <td className="font-medium text-ink-900">{l.product_name}</td>
                  <td className="text-right tabular-nums">{qty(l.quantity)} {l.unit}</td>
                  <td className="text-xs text-ink-600">
                    {(l.allocations ?? []).map((a) => `Lô ${a.batch_code}: ${qty(a.reserved_qty)} ${l.unit}`).join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-sand-50 p-3 text-sm">
            <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">Giao tới</p>
            <p className="mt-1 font-medium text-ink-900">{addr.recipient_name} · {addr.phone}</p>
            <p className="text-ink-700">
              {[addr.street_detail, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
            </p>
          </div>
          <div className="rounded-lg bg-sand-50 p-3 text-sm">
            <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">Thanh toán</p>
            <p className="mt-1 text-ink-700">{PAYMENT_METHOD[order.payment_method] ?? order.payment_method}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-ink-900">{vnd(order.total_vnd)}</p>
          </div>
        </div>

        {order.payment_method === 'BANK_TRANSFER' && order.payment_status === 'UNPAID' && (
          <div className="mt-3">
            <Alert tone="warning">
              Đơn chuyển khoản được xác nhận thủ công. Nội dung chuyển khoản ghi mã đơn {order.code}.
            </Alert>
          </div>
        )}
      </section>

      <div className="card-pad">
        <SectionHeader title="Bước tiếp theo" />
        <ul className="space-y-2 text-sm">
          <li>
            <Link href={`/tai-khoan/don-hang/${order.id}`} className="flex items-center gap-2 text-ink-700 hover:text-brand-700">
              <Icon name="clock" className="h-4 w-4 text-ink-400" /> Theo dõi trạng thái đơn và lịch sử giao hàng
            </Link>
          </li>
          <li>
            <Link href="/tai-khoan/don-hang" className="flex items-center gap-2 text-ink-700 hover:text-brand-700">
              <Icon name="orders" className="h-4 w-4 text-ink-400" /> Xem tất cả đơn hàng của bạn
            </Link>
          </li>
          <li>
            <Link href="/san-pham" className="flex items-center gap-2 text-ink-700 hover:text-brand-700">
              <Icon name="products" className="h-4 w-4 text-ink-400" /> Tiếp tục chọn nông sản
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
