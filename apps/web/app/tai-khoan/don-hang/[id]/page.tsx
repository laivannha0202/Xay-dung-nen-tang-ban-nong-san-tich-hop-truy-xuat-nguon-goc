import Link from 'next/link'
import { notFound } from 'next/navigation'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty, dateTimeVN, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/format'
import { OrderActions } from '@/components/order-actions'
import { StatusBadge } from '@/components/ui'

export interface OrderDetail {
  id: string
  code: string
  status: string
  payment_status: string
  payment_method: string
  subtotal_vnd: number
  discount_vnd: number
  ship_fee_vnd: number
  total_vnd: number
  placed_at: string
  cancel_reason: string | null
  needs_reallocation: boolean
  recalled_batches: string[]
  address_snapshot: Record<string, string>
  lines: Array<{
    id: string
    product_name: string
    unit: string
    quantity: number
    unit_price_vnd: number
    total_vnd: number
    review: { id: string; rating: number; comment: string } | null
    allocations: Array<{ batch_id: string; batch_code: string; qty?: number; reserved_qty: number; shipped_qty: number; discount_vnd: number; safety_status: string }>
  }>
  shipment: { carrier: string; tracking_code: string; status: string } | null
  refunds: Array<{ amount_vnd: number; status: string; reason: string }>
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await serverFetch<OrderDetail>(`/me/orders/${id}`, await authCookie())
  if (!order) notFound()
  const addr = order.address_snapshot as Record<string, string>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">Đơn {order.code}</h1>
        <StatusBadge map={ORDER_STATUS} value={order.status} />
        <StatusBadge map={PAYMENT_STATUS} value={order.payment_status} />
      </div>
      <p className="text-sm text-leaf-600">Đặt lúc {dateTimeVN(order.placed_at)}</p>

      {order.needs_reallocation && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Lô hàng của một sản phẩm đang bị tạm giữ/thu hồi. Nhân viên sẽ liên hệ đổi lô hoặc hoàn tiền.
        </p>
      )}
      {order.recalled_batches.length > 0 && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          Lô đã giao thuộc diện thu hồi: {order.recalled_batches.join(', ')}. Vui lòng ngừng sử dụng và liên hệ để được hỗ trợ.
        </p>
      )}

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Sản phẩm & lô</h2>
        <ul className="space-y-2">
          {order.lines.map((l) => (
            <li key={l.id} className="rounded-lg bg-leaf-50/60 p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-medium">{l.product_name} · {qty(l.quantity)} {l.unit}</p>
                <p>{vnd(l.total_vnd)}</p>
              </div>
              <ul className="mt-1 space-y-0.5 text-xs text-leaf-700">
                {(l.allocations ?? []).map((a, i) => (
                  <li key={i}>
                    Lô {a.batch_code} · giữ {qty(a.reserved_qty ?? a.qty ?? 0)} · đã xuất {qty(a.shipped_qty)}
                    {a.discount_vnd > 0 && <span className="text-clay-700"> · giảm {vnd(a.discount_vnd)}</span>}
                    {a.safety_status !== 'NORMAL' && <span className="ml-1 text-red-700">({a.safety_status})</span>}
                  </li>
                ))}
              </ul>
              {l.review && <p className="mt-1 text-xs text-amber-700">Bạn đã đánh giá {l.review.rating}★</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="card grid gap-3 p-4 text-sm sm:grid-cols-2">
        <div>
          <h2 className="mb-1 font-semibold">Giao tới</h2>
          <p>{addr.recipient_name} · {addr.phone}</p>
          <p className="text-leaf-700">{addr.street_detail}, {addr.ward}, {addr.district}, {addr.province}</p>
          {order.shipment && (
            <p className="mt-1 text-leaf-700">
              Vận chuyển: {order.shipment.carrier || '—'} {order.shipment.tracking_code && `· ${order.shipment.tracking_code}`}
            </p>
          )}
        </div>
        <dl className="space-y-1">
          <div className="flex justify-between"><dt className="text-leaf-600">Tiền hàng</dt><dd>{vnd(order.subtotal_vnd)}</dd></div>
          {order.discount_vnd > 0 && <div className="flex justify-between"><dt className="text-leaf-600">Giảm giá</dt><dd>−{vnd(order.discount_vnd)}</dd></div>}
          <div className="flex justify-between"><dt className="text-leaf-600">Phí giao</dt><dd>{order.ship_fee_vnd === 0 ? 'Miễn phí' : vnd(order.ship_fee_vnd)}</dd></div>
          <div className="flex justify-between border-t border-leaf-100 pt-1 font-semibold"><dt>Tổng</dt><dd>{vnd(order.total_vnd)}</dd></div>
          {order.refunds.length > 0 && (
            <div className="pt-1 text-xs text-leaf-700">
              Hoàn tiền: {order.refunds.map((r) => `${vnd(r.amount_vnd)} (${r.status})`).join(', ')}
            </div>
          )}
        </dl>
      </section>

      {order.cancel_reason && (
        <p className="text-sm text-leaf-700">Lý do hủy: {order.cancel_reason}</p>
      )}

      <OrderActions
        orderId={order.id}
        status={order.status}
        lines={order.lines.map((l) => ({
          id: l.id,
          product_name: l.product_name,
          reviewed: !!l.review,
          batches: (l.allocations ?? []).map((a) => ({ id: a.batch_id, code: a.batch_code })),
        }))}
        batches={(order.lines.flatMap((l) => l.allocations ?? [])).map((a) => a.batch_code)}
      />

      <Link href="/tai-khoan/don-hang" className="btn-ghost">← Danh sách đơn</Link>
    </div>
  )
}
