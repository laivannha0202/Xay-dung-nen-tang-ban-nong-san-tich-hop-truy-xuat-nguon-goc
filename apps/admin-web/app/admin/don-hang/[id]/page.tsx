import Link from 'next/link'
import { notFound } from 'next/navigation'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty, dateVN, dateTimeVN, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/format'
import { Act, Field, PatchForm } from '@/components/admin-kit'
import { ReallocateForm, RefundForm, ShipForm } from '@/components/admin-order-console'
import { StatusBadge } from '@/components/ui'

interface Allocation {
  id: string
  batch_id: string
  batch_code: string
  expiry_date: string
  reserved_qty: string
  shipped_qty: string
  status: string
  safety_status: string
  quality_status: string
  unit_price_vnd: number
  discount_vnd: number
}

interface Order {
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
  note: string
  cancel_reason: string | null
  needs_reallocation: boolean
  customer_email: string
  customer_name: string | null
  customer_phone: string | null
  address_snapshot: Record<string, string>
  lines: Array<{ id: string; product_name: string; unit: string; quantity: string; unit_price_vnd: number; total_vnd: number; allocations: Allocation[] | null }>
  payment: { method: string; status: string; reference: string; paid_at: string | null } | null
  refunds: Array<{ id: string; amount_vnd: number; status: string; reason: string; created_at: string }>
  shipment: { carrier: string; tracking_code: string; courier_name: string; status: string; delivered_at: string | null } | null
  movements: Array<{ id: string; type: string; quantity: string; on_hand_after: string; batch_code: string; occurred_at: string }>
  audit: Array<{ id: string; action: string; note: string; actor_email: string | null; created_at: string }>
}

interface Inv {
  batch_id: string
  batch_code: string
  product_name: string
  available_qty: string
  quality_status: string
  publication_status: string
  safety_status: string
  is_expired: boolean
  expiry_date: string
}

const NEXT_ACTION: Record<string, { path: string; label: string }[]> = {
  PENDING: [{ path: 'confirm', label: 'Xác nhận đơn' }],
  CONFIRMED: [{ path: 'prepare', label: 'Bắt đầu chuẩn bị' }],
  PREPARING: [],
  SHIPPING: [
    { path: 'deliver', label: 'Xác nhận đã giao' },
    { path: 'delivery_failed', label: 'Giao thất bại' },
  ],
  DELIVERED: [{ path: 'complete', label: 'Hoàn tất đơn' }],
}

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookie = await authCookie()
  const [o, inv] = await Promise.all([
    serverFetch<Order>(`/admin/orders/${id}`, cookie),
    serverFetch<Inv[]>('/admin/inventory', cookie),
  ])
  if (!o) notFound()
  const addr = o.address_snapshot as Record<string, string>
  const sellable = (inv ?? []).filter(
    (i) => i.quality_status === 'PASS' && i.publication_status === 'PUBLISHED' && i.safety_status === 'NORMAL' && !i.is_expired,
  )
  const allAllocations = o.lines.flatMap((l) => (l.allocations ?? []).map((a) => ({ ...a, product_name: l.product_name })))
  const refundedOrPending = o.refunds
    .filter((r) => ['PENDING', 'APPROVED', 'COMPLETED'].includes(r.status))
    .reduce((s, r) => s + r.amount_vnd, 0)
  const maxRefund = Math.max(0, o.total_vnd - refundedOrPending)

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">Đơn {o.code}</h1>
          <StatusBadge map={ORDER_STATUS} value={o.status} />
          <StatusBadge map={PAYMENT_STATUS} value={o.payment_status} />
          {o.needs_reallocation && <span className="badge bg-red-100 text-red-800">Cần đổi lô</span>}
        </div>
        <p className="text-sm text-leaf-700">
          {o.customer_name ?? '—'} · {o.customer_email} {o.customer_phone && `· ${o.customer_phone}`}
        </p>
        <p className="text-sm text-leaf-600">Đặt lúc {dateTimeVN(o.placed_at)}</p>
      </header>

      <section className="card flex flex-wrap items-center gap-2 p-4">
        {(NEXT_ACTION[o.status] ?? []).map((a) => (
          <Act key={a.path} path={`/admin/orders/${o.id}/${a.path}`} label={a.label} className="btn-primary" />
        ))}
        {o.status === 'PREPARING' && <ShipForm orderId={o.id} />}
        {o.payment_status === 'UNPAID' && (
          <Act
            path={`/admin/orders/${o.id}/payment`}
            label="Xác nhận đã thanh toán"
            className="btn-secondary"
            promptLabel="Mã giao dịch / tham chiếu chuyển khoản (có thể để trống):"
          />
        )}
        {o.shipment && (
          <span className="text-xs text-leaf-600">
            Vận đơn: {o.shipment.carrier || '—'} {o.shipment.tracking_code && `· ${o.shipment.tracking_code}`} · {o.shipment.status}
          </span>
        )}
      </section>

      <section className="card overflow-x-auto p-4">
        <h2 className="mb-2 font-semibold">Sản phẩm & phân bổ lô</h2>
        <table className="table-base">
          <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th>Lô</th></tr></thead>
          <tbody>
            {o.lines.map((l) => (
              <tr key={l.id}>
                <td className="font-medium">{l.product_name}</td>
                <td>{qty(l.quantity)} {l.unit}</td>
                <td>{vnd(l.unit_price_vnd)}</td>
                <td>{vnd(l.total_vnd)}</td>
                <td className="text-xs">
                  {(l.allocations ?? []).map((a) => (
                    <div key={a.id}>
                      <Link href={`/admin/lo-hang/${a.batch_id}`} className="underline">{a.batch_code}</Link>
                      {' · giữ '}{qty(a.reserved_qty)}{' · xuất '}{qty(a.shipped_qty)}
                      {' · HSD '}{dateVN(a.expiry_date)}
                      {a.discount_vnd > 0 && ` · giảm ${vnd(a.discount_vnd)}`}
                      {a.status !== 'ACTIVE' && ` · ${a.status}`}
                      {a.safety_status !== 'NORMAL' && <span className="text-red-700"> · {a.safety_status}</span>}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {(o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.needs_reallocation) && (
        <section className="card p-4">
          <ReallocateForm
            orderId={o.id}
            allocations={allAllocations}
            batches={sellable.map((i) => ({ id: i.batch_id, code: i.batch_code, product_name: i.product_name }))}
          />
        </section>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card p-4 text-sm">
          <h2 className="mb-2 font-semibold">Giao hàng</h2>
          <p>{addr.recipient_name} · {addr.phone}</p>
          <p className="text-leaf-700">{addr.street_detail}, {addr.ward}, {addr.district}, {addr.province}</p>
          {o.note && <p className="mt-1 text-leaf-700">Ghi chú: {o.note}</p>}
          <PatchForm
            path={`/admin/orders/${o.id}/shipment`}
            title="Thông tin vận chuyển"
            fields={
              <>
                <Field label="Đơn vị vận chuyển" name="carrier" defaultValue={o.shipment?.carrier ?? ''} />
                <Field label="Mã vận đơn" name="tracking_code" defaultValue={o.shipment?.tracking_code ?? ''} />
                <Field label="Người giao" name="courier_name" defaultValue={o.shipment?.courier_name ?? ''} />
                <Field label="Ghi chú" name="note" />
              </>
            }
          />
        </section>

        <section className="card p-4 text-sm">
          <h2 className="mb-2 font-semibold">Thanh toán</h2>
          <dl className="space-y-1">
            <div className="flex justify-between"><dt className="text-leaf-600">Tiền hàng</dt><dd>{vnd(o.subtotal_vnd)}</dd></div>
            {o.discount_vnd > 0 && <div className="flex justify-between"><dt className="text-leaf-600">Giảm giá</dt><dd>−{vnd(o.discount_vnd)}</dd></div>}
            <div className="flex justify-between"><dt className="text-leaf-600">Phí giao</dt><dd>{vnd(o.ship_fee_vnd)}</dd></div>
            <div className="flex justify-between border-t border-leaf-100 pt-1 font-semibold"><dt>Tổng</dt><dd>{vnd(o.total_vnd)}</dd></div>
          </dl>
          <p className="mt-2 text-leaf-700">
            {o.payment_method === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}
            {o.payment?.reference && ` · tham chiếu ${o.payment.reference}`}
            {o.payment?.paid_at && ` · lúc ${dateTimeVN(o.payment.paid_at)}`}
          </p>
          {o.refunds.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {o.refunds.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2">
                  <span>{vnd(r.amount_vnd)}</span>
                  <span className="badge bg-slate-100 text-slate-700">{r.status}</span>
                  <span className="text-leaf-700">{r.reason}</span>
                  {r.status === 'PENDING' && (
                    <>
                      <Act path={`/admin/refunds/${r.id}/approve`} label="Duyệt" className="btn-ghost text-xs" />
                      <Act path={`/admin/refunds/${r.id}/reject`} label="Từ chối" className="btn-ghost text-xs text-red-700" />
                    </>
                  )}
                  {r.status === 'APPROVED' && (
                    <Act path={`/admin/refunds/${r.id}/complete`} label="Đã chuyển tiền" className="btn-ghost text-xs" />
                  )}
                </li>
              ))}
            </ul>
          )}
          {o.payment_status !== 'UNPAID' && maxRefund > 0 && (
            <div className="mt-2"><RefundForm orderId={o.id} maxAmount={maxRefund} /></div>
          )}
        </section>
      </div>

      <section className="card p-4 text-sm">
        <h2 className="mb-2 font-semibold">Biến động kho của đơn</h2>
        {o.movements.length === 0 ? (
          <p className="text-leaf-700">Chưa xuất kho.</p>
        ) : (
          <ul className="space-y-1">
            {o.movements.map((m) => (
              <li key={m.id}>
                {dateTimeVN(m.occurred_at)} · {m.batch_code} · {m.type} {qty(m.quantity)} → tồn {qty(m.on_hand_after)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4 text-sm">
        <h2 className="mb-2 font-semibold">Lịch sử thao tác</h2>
        <ul className="space-y-1">
          {o.audit.map((a) => (
            <li key={a.id}>
              <span className="text-xs text-leaf-600">{dateTimeVN(a.created_at)}</span> {a.action}
              {a.note && ` · ${a.note}`} {a.actor_email && <span className="text-leaf-600">({a.actor_email})</span>}
            </li>
          ))}
        </ul>
      </section>

      <Link href="/admin/don-hang" className="btn-ghost">← Danh sách đơn</Link>
    </div>
  )
}

export const dynamic = 'force-dynamic'
