import Link from 'next/link'
import { STATUS_LABEL } from '@agrimarket/core'
import { notFound } from 'next/navigation'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty, dateVN, dateTimeVN, ORDER_STATUS, PAYMENT_STATUS, SAFETY as SAFETY_LABEL, discountSplit } from '@/lib/format'
import { Act, Field, PatchForm } from '@/components/admin-kit'
import { ReallocateForm, RefundForm, ShipForm } from '@/components/admin-order-console'
import { CopyButton, PrintButton } from '@/components/quick-tools'
import { Alert, Badge, EmptyState, Kpi, PageHeader, SectionHeader, StatusPill } from '@agrimarket/ui'

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
  promotion_snapshot: { code?: string; name?: string; discount_vnd?: number } | null
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
  const [o, inv, carriers] = await Promise.all([
    serverFetch<Order>(`/admin/orders/${id}`, cookie),
    serverFetch<Inv[]>('/admin/inventory', cookie),
    serverFetch<Array<{ carrier: string }>>('/admin/orders/carriers', cookie),
  ])
  if (!o) notFound()
  const addr = o.address_snapshot as Record<string, string>
  const sellable = (inv ?? []).filter(
    (i) => i.quality_status === 'PASS' && i.publication_status === 'PUBLISHED' && i.safety_status === 'NORMAL' && !i.is_expired,
  )
  const allAllocations = o.lines.flatMap((l) => (l.allocations ?? []).map((a) => ({ ...a, product_name: l.product_name })))
  const recalled = allAllocations.some((a) => a.safety_status === 'RECALLED')
  const refundedOrPending = o.refunds
    .filter((r) => ['PENDING', 'APPROVED', 'COMPLETED'].includes(r.status))
    .reduce((s, r) => s + r.amount_vnd, 0)
  const maxRefund = Math.max(0, o.total_vnd - refundedOrPending)
  const split = discountSplit(o)
  const promotionHint =
    o.promotion_snapshot?.name ??
    (maxRefund > 0 ? `Còn có thể hoàn ${vnd(maxRefund)}` : 'Đã hoàn đủ')
  const nextActions = NEXT_ACTION[o.status] ?? []

  return (
    <div className="space-y-5 pb-4">
      {/* Printing goes to a print-only document route: the admin shell, filter bars and
          edit forms around this page must never reach paper. */}
      <PageHeader
        title={`Đơn ${o.code}`}
        breadcrumb={
          <Link href="/admin/don-hang" className="hover:text-brand-700 hover:underline">
            ← Đơn hàng
          </Link>
        }
        description={
          <span className="space-y-0.5">
            <span className="block">
              {o.customer_name ?? '—'} · {o.customer_email}
              {o.customer_phone && ` · ${o.customer_phone}`}
            </span>
            <span className="block">Đặt lúc {dateTimeVN(o.placed_at)}</span>
          </span>
        }
        actions={
          <>
            <StatusPill value={o.status} label={ORDER_STATUS[o.status] ?? o.status} />
            <StatusPill value={o.payment_status} label={PAYMENT_STATUS[o.payment_status] ?? o.payment_status} />
            <CopyButton value={o.code} label="Sao chép mã đơn" />
            <PrintButton href={`/admin/in/ban-hang/${o.id}`} label="In phiếu bán" />
            <PrintButton href={`/admin/in/giao-hang/${o.id}`} label="In phiếu giao" />
            <PrintButton href={`/admin/in/dong-goi/${o.id}`} label="In phiếu đóng gói" />
            {o.payment_status === 'PAID' && <PrintButton href={`/admin/in/thanh-toan/${o.id}`} label="In xác nhận thanh toán" />}
          </>
        }
      />

      {o.needs_reallocation && (
        <Alert tone="warning">
          Đơn đang cần đổi lô: phân bổ cũ không còn lô bán được (hết hạn, tạm giữ hoặc thu hồi). Chọn lô mới bên dưới trước khi chuẩn bị hàng.
        </Alert>
      )}
      {recalled && (
        <Alert tone="danger">
          Có lô trong đơn đã bị thu hồi. Liên hệ khách để đổi lô hoặc hoàn tiền; không xuất kho từ lô này.
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Tổng thanh toán" value={vnd(o.total_vnd)} icon="payment" tone="brand" hint={o.payment_method === 'COD' ? 'Thu khi nhận hàng' : 'Chuyển khoản'} />
        <Kpi label="Tiền hàng (giá gốc)" value={vnd(o.subtotal_vnd)} icon="cart" tone="neutral" hint={`${o.lines.length} sản phẩm`} />
        <Kpi label="Phí giao" value={vnd(o.ship_fee_vnd)} icon="truck" tone="info" hint={o.shipment ? `${o.shipment.carrier || 'Chưa rõ ĐVVC'} · ${o.shipment.status}` : 'Chưa tạo vận đơn'} />
        <Kpi label="Giảm giá" value={o.discount_vnd > 0 ? `−${vnd(o.discount_vnd)}` : vnd(0)} icon="promotion" tone={o.discount_vnd > 0 ? 'success' : 'neutral'} hint={promotionHint} />
      </div>

      <section className="card-pad sticky bottom-3 z-20 flex flex-wrap items-center gap-2 shadow-sm">
        {nextActions.map((a) => (
          <Act key={a.path} path={`/admin/orders/${o.id}/${a.path}`} label={a.label} className="btn-primary" />
        ))}
        {o.status === 'PREPARING' && <ShipForm orderId={o.id} carriers={carriers ?? []} />}
        {o.payment_status === 'UNPAID' && (
          <Act
            path={`/admin/orders/${o.id}/payment`}
            label="Xác nhận đã thanh toán"
            className="btn-secondary"
            promptLabel="Mã giao dịch / tham chiếu chuyển khoản (có thể để trống):"
          />
        )}
        {o.shipment && (
          <span className="ml-auto flex items-center gap-1 text-xs text-ink-500">
            Vận đơn: {o.shipment.carrier || '—'} {o.shipment.tracking_code && `· ${o.shipment.tracking_code}`} · {o.shipment.status}
            {o.shipment.tracking_code && <CopyButton value={o.shipment.tracking_code} label="Sao chép mã vận đơn" />}
          </span>
        )}
      </section>

      <section className="card overflow-x-auto">
        <div className="card-pad pb-0">
          <SectionHeader
            title="Sản phẩm & phân bổ lô"
            hint="Mỗi dòng có thể tách từ nhiều lô; số giữ là đã khoá cho đơn, số xuất là đã trừ tồn."
            action={<Badge tone="neutral">{o.lines.length} dòng</Badge>}
          />
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th className="text-right">SL</th>
              <th className="text-right">Đơn giá</th>
              <th className="text-right">Thành tiền</th>
              <th>Lô</th>
            </tr>
          </thead>
          <tbody>
            {o.lines.map((l) => (
              <tr key={l.id}>
                <td className="font-medium text-ink-900">{l.product_name}</td>
                <td className="text-right tabular-nums">
                  {qty(l.quantity)} {l.unit}
                </td>
                <td className="text-right tabular-nums">{vnd(l.unit_price_vnd)}</td>
                <td className="text-right font-medium tabular-nums">{vnd(l.total_vnd)}</td>
                <td className="text-xs">
                  {(l.allocations ?? []).map((a) => (
                    <div key={a.id} className="py-0.5">
                      <Link href={`/admin/lo-hang/${a.batch_id}`} className="font-mono text-brand-700 hover:underline">
                        {a.batch_code}
                      </Link>
                      <span className="text-ink-500">
                        {' · giữ '}
                        {qty(a.reserved_qty)}
                        {' · xuất '}
                        {qty(a.shipped_qty)}
                        {' · HSD '}
                        {dateVN(a.expiry_date)}
                      </span>
                      {a.discount_vnd > 0 && <span className="text-ink-600">{` · giảm ${vnd(a.discount_vnd)}`}</span>}
                      {a.status !== 'ACTIVE' && <span className="text-ink-600">{` · ${STATUS_LABEL[a.status] ?? a.status}`}</span>}
                      {a.safety_status !== 'NORMAL' && (
                        <StatusPill value={a.safety_status} label={SAFETY_LABEL[a.safety_status]} />
                      )}
                    </div>
                  ))}
                  {(l.allocations ?? []).length === 0 && <span className="text-ink-400">Chưa phân bổ lô</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {(o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.needs_reallocation) && (
        <section className="card-pad">
          <ReallocateForm
            orderId={o.id}
            allocations={allAllocations}
            batches={sellable.map((i) => ({ id: i.batch_id, code: i.batch_code, product_name: i.product_name }))}
          />
        </section>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card-pad text-sm">
          <SectionHeader title="Giao hàng" hint="Địa chỉ chốt tại thời điểm đặt, không đổi theo hồ sơ khách." />
          <p className="font-medium text-ink-900">
            {addr.recipient_name} · {addr.phone}
          </p>
          <p className="text-ink-600">
            {[addr.street_detail, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
          </p>
          {o.note && <p className="mt-1 text-ink-600">Ghi chú: {o.note}</p>}
          <div className="mt-3 border-t border-ink-100 pt-3">
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
          </div>
        </section>

        <section className="card-pad text-sm">
          <SectionHeader title="Thanh toán" hint={o.payment_method === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'} />
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt className="text-ink-500">Tiền hàng</dt>
              <dd className="tabular-nums">{vnd(o.subtotal_vnd)}</dd>
            </div>
            {split.lot_vnd > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-500">Giảm giá theo lô</dt>
                <dd className="tabular-nums">−{vnd(split.lot_vnd)}</dd>
              </div>
            )}
            {split.voucher_vnd > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-500">Voucher {o.promotion_snapshot?.code ?? ''}</dt>
                <dd className="tabular-nums">−{vnd(split.voucher_vnd)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-500">Phí giao</dt>
              <dd className="tabular-nums">{vnd(o.ship_fee_vnd)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-1 font-semibold text-ink-900">
              <dt>Tổng</dt>
              <dd className="tabular-nums">{vnd(o.total_vnd)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-ink-600">
            {o.payment_method === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}
            {o.payment?.reference && ` · tham chiếu ${o.payment.reference}`}
            {o.payment?.paid_at && ` · lúc ${dateTimeVN(o.payment.paid_at)}`}
          </p>
          {o.refunds.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-ink-100 pt-3 text-xs">
              {o.refunds.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2">
                  <span className="font-medium tabular-nums">{vnd(r.amount_vnd)}</span>
                  <StatusPill value={r.status} />
                  <span className="text-ink-600">{r.reason}</span>
                  {r.status === 'PENDING' && (
                    <>
                      <Act path={`/admin/refunds/${r.id}/approve`} label="Duyệt" className="btn-ghost btn-sm" />
                      <Act path={`/admin/refunds/${r.id}/reject`} label="Từ chối" className="btn-ghost btn-sm text-rose-700" />
                    </>
                  )}
                  {r.status === 'APPROVED' && <Act path={`/admin/refunds/${r.id}/complete`} label="Đã chuyển tiền" className="btn-ghost btn-sm" />}
                </li>
              ))}
            </ul>
          )}
          {o.payment_status !== 'UNPAID' && maxRefund > 0 && (
            <div className="mt-3 border-t border-ink-100 pt-3">
              <RefundForm orderId={o.id} maxAmount={maxRefund} />
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card-pad text-sm">
          <SectionHeader title="Biến động kho của đơn" hint="Xuất kho trừ tồn theo lô, ghi lại tồn sau mỗi lần." />
          {o.movements.length === 0 ? (
            <EmptyState title="Chưa xuất kho" hint="Đơn chưa phát sinh phiếu xuất nào." icon="warehouse" />
          ) : (
            <ul className="space-y-1">
              {o.movements.map((m) => (
                <li key={m.id} className="text-ink-700">
                  <span className="text-xs text-ink-500">{dateTimeVN(m.occurred_at)}</span> · <span className="font-mono">{m.batch_code}</span> · {m.type}{' '}
                  <span className="tabular-nums">{qty(m.quantity)}</span> → tồn <span className="tabular-nums">{qty(m.on_hand_after)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-pad text-sm">
          <SectionHeader title="Lịch sử thao tác" hint="Ai làm gì, khi nào — phục vụ đối soát." />
          <ul className="space-y-1">
            {o.audit.map((a) => (
              <li key={a.id} className="text-ink-700">
                <span className="text-xs text-ink-500">{dateTimeVN(a.created_at)}</span> {a.action}
                {a.note && ` · ${a.note}`} {a.actor_email && <span className="text-xs text-ink-500">({a.actor_email})</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
