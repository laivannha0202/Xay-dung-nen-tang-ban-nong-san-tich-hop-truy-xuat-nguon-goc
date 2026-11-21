import Link from 'next/link'
import { notFound } from 'next/navigation'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty, dateTimeVN, ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, ORDER_TIMELINE, discountSplit } from '@/lib/format'
import { OrderActions } from '@/components/order-actions'
import { BuyAgain } from '@/components/buy-again'
import { Icon, StatusPill, Alert, Badge } from '@agrimarket/ui'

export interface OrderDetail {
  id: string
  code: string
  status: string
  promotion_snapshot: { code?: string; name?: string; discount_vnd?: number } | null
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
    allocations: Array<{
      batch_id: string
      batch_code: string
      qr_token: string | null
      qty?: number
      reserved_qty: number
      shipped_qty: number
      discount_vnd: number
      safety_status: string
    }>
  }>
  updated_at: string
  payment: { paid_vnd: number; is_paid: boolean; paid_at: string | null; method: string | null; reference: string | null } | null
  shipment: { carrier: string; tracking_code: string; status: string; shipped_at: string | null; delivered_at: string | null } | null
  refunds: Array<{ amount_vnd: number; status: string; reason: string }>
}

/** A cancelled or failed order stops the timeline where it broke. */
const STOPPED = new Set(['CANCELLED', 'DELIVERY_FAILED'])

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await serverFetch<OrderDetail>(`/me/orders/${id}`, await authCookie())
  if (!order) notFound()
  const addr = order.address_snapshot as Record<string, string>
  const split = discountSplit(order)
  // Money still owed, from the shared rule: none on a cancelled or failed order, never negative.
  // COD and bank transfer both read the sum of PAID receipts, so a part-paid order is honest.
  const due = STOPPED.has(order.status) ? 0 : Math.max(0, order.total_vnd - (order.payment?.paid_vnd ?? 0))

  const currentIndex = Math.max(0, ORDER_TIMELINE.findIndex((s) => s.key === order.status))

  /** The API stores one row per stage boundary, so each step's clock comes from that row. */
  const stampFor = (key: string): string | null => {
    switch (key) {
      case 'PENDING':
        return order.placed_at
      case 'SHIPPING':
        return order.shipment?.shipped_at ?? null
      case 'DELIVERED':
        return order.shipment?.delivered_at ?? null
      case 'COMPLETED':
        return order.status === 'COMPLETED' ? order.updated_at : null
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <nav className="text-xs text-ink-500">
          <Link href="/tai-khoan/don-hang" className="hover:underline">Đơn hàng</Link> / {order.code}
        </nav>
        <h1 className="w-full text-xl font-semibold text-ink-900 sm:w-auto">Đơn {order.code}</h1>
        <StatusPill value={order.status} label={ORDER_STATUS[order.status] ?? order.status} />
        <StatusPill value={order.payment_status} label={PAYMENT_STATUS[order.payment_status] ?? order.payment_status} />
        <p className="text-sm text-ink-500 sm:ml-auto">Đặt lúc {dateTimeVN(order.placed_at)}</p>
      </div>

      {order.needs_reallocation && (
        <Alert tone="warning">
          Lô của một sản phẩm đang bị tạm giữ hoặc thu hồi. Nhân viên sẽ liên hệ đổi lô hoặc hoàn tiền.
        </Alert>
      )}
      {order.recalled_batches.length > 0 && (
        <Alert tone="danger">
          Lô đã giao thuộc diện thu hồi: {order.recalled_batches.join(', ')}. Vui lòng ngừng sử dụng và liên hệ hỗ trợ.
        </Alert>
      )}
      {order.cancel_reason && <Alert tone="neutral">Lý do huỷ: {order.cancel_reason}</Alert>}

      {!STOPPED.has(order.status) && (
        <section className="card-pad">
          <h2 className="font-semibold text-ink-900">Theo dõi đơn</h2>
          <ol className="mt-4 flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
            {ORDER_TIMELINE.map((step, i) => {
              const done = i <= currentIndex
              const at = i <= currentIndex ? stampFor(step.key) : null
              return (
                <li key={step.key} className="relative flex flex-1 gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
                  <span className="absolute top-6 bottom-0 left-[11px] w-0.5 bg-ink-100 sm:hidden" aria-hidden />
                  {i < ORDER_TIMELINE.length - 1 && (
                    <span className={`absolute top-3 left-6 hidden h-0.5 w-[calc(100%-1.5rem)] sm:block ${done && i < currentIndex ? 'bg-brand-500' : 'bg-ink-100'}`} aria-hidden />
                  )}
                  <span
                    className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                      done ? 'bg-brand-600 text-white' : 'border border-ink-300 bg-white text-ink-600'
                    }`}
                  >
                    {done ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="pb-3 sm:pb-0">
                    <span className={`block text-sm ${done ? 'font-medium text-ink-900' : 'text-ink-500'}`}>{step.label}</span>
                    <span className="block text-[11px] text-ink-500">{at ? dateTimeVN(at) : '—'}</span>
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="card-pad">
          <h2 className="font-semibold text-ink-900">Sản phẩm & lô xuất kho</h2>
          <ul className="mt-3 space-y-2">
            {order.lines.map((l) => (
              <li key={l.id} className="rounded-lg border border-ink-100 p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium text-ink-900">{l.product_name} · {qty(l.quantity)} {l.unit}</p>
                  <p className="font-medium">{vnd(l.total_vnd)}</p>
                </div>
                <ul className="mt-1 space-y-0.5 text-xs text-ink-600">
                  {(l.allocations ?? []).map((a, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-1">
                      {a.qr_token ? (
                        <Link href={`/t/${a.qr_token}`} className="rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] text-brand-700 hover:underline">
                          {a.batch_code}
                        </Link>
                      ) : (
                        <span className="rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[11px]">{a.batch_code}</span>
                      )}
                      giữ {qty(a.reserved_qty ?? a.qty ?? 0)} · đã xuất {qty(a.shipped_qty)}
                      {a.discount_vnd > 0 && <span className="text-sand-700">· giảm {vnd(a.discount_vnd)}</span>}
                      {a.safety_status !== 'NORMAL' && <Badge tone="danger">{a.safety_status}</Badge>}
                    </li>
                  ))}
                </ul>
                {l.review && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-sand-700">
                    <Icon name="star" className="h-3.5 w-3.5" filled /> Bạn đã đánh giá {l.review.rating}★
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="card-pad text-sm">
            <h2 className="font-semibold text-ink-900">Giao tới</h2>
            <p className="mt-1 text-ink-800">{addr.recipient_name} · {addr.phone}</p>
            <p className="text-ink-600">
              {[addr.street_detail, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
            </p>
            <p className="mt-1 text-ink-600">
              Thanh toán: {PAYMENT_METHOD[order.payment_method] ?? order.payment_method}
            </p>
            {order.shipment && (
              <p className="mt-1 text-ink-600">
                Vận chuyển: {order.shipment.carrier || '—'}
                {order.shipment.tracking_code && <span className="font-mono"> · {order.shipment.tracking_code}</span>}
              </p>
            )}
          </section>

          <section className="card-pad">
            <h2 className="font-semibold text-ink-900">Thanh toán</h2>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-600">Tiền hàng (giá gốc)</dt><dd>{vnd(order.subtotal_vnd)}</dd></div>
              {split.lot_vnd > 0 && (
                <div className="flex justify-between text-brand-700"><dt>Giảm giá theo lô</dt><dd>−{vnd(split.lot_vnd)}</dd></div>
              )}
              {split.voucher_vnd > 0 && (
                <div className="flex justify-between text-brand-700"><dt>Voucher {order.promotion_snapshot?.code ?? ''}</dt><dd>−{vnd(split.voucher_vnd)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-ink-600">Phí giao</dt><dd>{order.ship_fee_vnd === 0 ? 'Miễn phí' : vnd(order.ship_fee_vnd)}</dd></div>
              <div className="flex justify-between border-t border-ink-100 pt-1.5 text-base font-semibold">
                <dt>Tổng</dt><dd>{vnd(order.total_vnd)}</dd>
              </div>
              {(order.payment?.paid_vnd ?? 0) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-600">Đã thanh toán</dt><dd>{vnd(order.payment!.paid_vnd)}</dd>
                </div>
              )}
              {due > 0 && (
                <div className="flex justify-between font-medium text-ink-900">
                  <dt>{order.payment_method === 'COD' ? 'Còn trả khi nhận hàng' : 'Còn phải thanh toán'}</dt>
                  <dd>{vnd(due)}</dd>
                </div>
              )}
              {order.refunds.length > 0 && (
                <div className="pt-1 text-xs text-ink-600">
                  Hoàn tiền: {order.refunds.map((r) => `${vnd(r.amount_vnd)} (${r.status})`).join(', ')}
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>

      <BuyAgain orderId={order.id} />

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
