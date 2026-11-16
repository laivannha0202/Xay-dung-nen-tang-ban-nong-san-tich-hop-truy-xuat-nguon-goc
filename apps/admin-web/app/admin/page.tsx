import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateTimeVN } from '@/lib/format'
import { Icon, Kpi, PageHeader, EmptyState, StatusPill } from '@agrimarket/ui'

interface Dashboard {
  revenue: { gross: number; refunded: number; net: number }
  orders: { pending: number; processing: number; shipping: number; delivered: number; total: number }
  batches: { published: number; pending_quality: number; failed: number; on_hold: number; recalled: number; expired: number; near_expiry: number }
  complaints: { new_count: number; open_count: number }
  alerts: Array<{ kind: string; id: string; label: string; detail: string; at: string }>
}

const ALERT_LINK: Record<string, (id: string) => string> = {
  ORDER: (id) => `/admin/don-hang/${id}`,
  LAB_FAIL: (id) => `/admin/lo-hang/${id}`,
  COMPLAINT: (id) => `/admin/khieu-nai/${id}`,
  RECALL: () => '/admin/thu-hoi',
}

const ALERT_ICON: Record<string, 'orders' | 'shield' | 'complaint' | 'recall'> = {
  ORDER: 'orders',
  LAB_FAIL: 'shield',
  COMPLAINT: 'complaint',
  RECALL: 'recall',
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = await searchParams
  const qs = new URLSearchParams()
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  const suffix = qs.size > 0 ? `?${qs}` : ''
  const d = await serverFetch<Dashboard>(`/admin/dashboard${suffix}`, await authCookie())

  if (!d) {
    return <EmptyState title="Không tải được số liệu" hint="Máy chủ không phản hồi." icon="report" />
  }

  const pipeline = [
    { label: 'Chờ xác nhận', value: d.orders.pending, tone: 'warning' as const, href: '/admin/don-hang?status=PENDING' },
    { label: 'Đang xử lý', value: d.orders.processing, tone: 'info' as const, href: '/admin/don-hang?status=PREPARING' },
    { label: 'Đang giao', value: d.orders.shipping, tone: 'info' as const, href: '/admin/don-hang?status=SHIPPING' },
    { label: 'Đã giao', value: d.orders.delivered, tone: 'success' as const, href: '/admin/don-hang?status=DELIVERED' },
  ]
  const pipelineMax = Math.max(1, ...pipeline.map((p) => p.value))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bảng điều khiển"
        description={from || to ? `Số liệu từ ${from || '…'} đến ${to || 'nay'}` : 'Toàn bộ thời gian'}
        actions={
          <form className="flex flex-wrap items-end gap-2" action="/admin" method="get">
            <label className="text-xs text-ink-500">
              Từ
              <input name="from" type="date" className="input mt-0.5 w-36" defaultValue={from ?? ''} />
            </label>
            <label className="text-xs text-ink-500">
              Đến
              <input name="to" type="date" className="input mt-0.5 w-36" defaultValue={to ?? ''} />
            </label>
            <button className="btn-primary btn-sm" type="submit">Áp dụng</button>
            {(from || to) && <Link href="/admin" className="btn-ghost btn-sm">Xoá lọc</Link>}
          </form>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Doanh thu thuần"
          value={vnd(d.revenue.net)}
          hint={`Đã thu ${vnd(d.revenue.gross)} · hoàn ${vnd(d.revenue.refunded)}`}
          icon="payment"
          tone="success"
          href="/admin/bao-cao"
        />
        <Kpi
          label="Đơn chờ xác nhận"
          value={String(d.orders.pending)}
          hint={`Đang xử lý ${d.orders.processing} · đang giao ${d.orders.shipping}`}
          icon="orders"
          tone={d.orders.pending > 0 ? 'warning' : 'neutral'}
          href="/admin/don-hang?status=PENDING"
        />
        <Kpi
          label="Lô đang bán"
          value={String(d.batches.published)}
          hint={`Cận hạn ${d.batches.near_expiry} · hết hạn ${d.batches.expired}`}
          icon="batch"
          tone={d.batches.expired > 0 ? 'danger' : 'success'}
          href="/admin/lo-hang"
        />
        <Kpi
          label="Khiếu nại mới"
          value={String(d.complaints.new_count)}
          hint={`Đang mở ${d.complaints.open_count}`}
          icon="complaint"
          tone={d.complaints.new_count > 0 ? 'warning' : 'neutral'}
          href="/admin/khieu-nai?status=NEW"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* hand-rolled bar chart: no chart library in the dependency tree */}
        <section className="card-pad">
          <h2 className="font-semibold text-ink-900">Dòng đơn hàng</h2>
          <p className="page-sub mt-0.5">Tổng {d.orders.total} đơn trong kỳ đang xem.</p>
          <ul className="mt-4 space-y-3">
            {pipeline.map((p) => (
              <li key={p.label}>
                <Link href={p.href} className="group block">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-ink-700 group-hover:text-brand-700">{p.label}</span>
                    <span className="font-medium text-ink-900">{p.value}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.round((p.value / pipelineMax) * 100)}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-100 pt-3 text-sm sm:grid-cols-4">
            {[
              ['Lô chờ kiểm', d.batches.pending_quality],
              ['Lô không đạt', d.batches.failed],
              ['Đang tạm giữ', d.batches.on_hold],
              ['Đã thu hồi', d.batches.recalled],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-xs text-ink-500">{label}</dt>
                <dd className="text-lg font-semibold text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="card-pad">
          <h2 className="font-semibold text-ink-900">Cần xử lý</h2>
          {d.alerts.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-ink-500">
              <Icon name="check" className="h-4 w-4 text-emerald-600" /> Không có cảnh báo.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-ink-100">
              {d.alerts.map((a) => (
                <li key={`${a.kind}-${a.id}`}>
                  <Link href={ALERT_LINK[a.kind]?.(a.id) ?? '/admin'} className="flex items-start gap-2 py-2.5 hover:bg-brand-50/40">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
                      <Icon name={ALERT_ICON[a.kind] ?? 'alert'} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink-900">{a.label}</span>
                      <span className="block truncate text-xs text-ink-500">{a.detail}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-ink-400">{dateTimeVN(a.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-3">
            <Link href="/admin/kho" className="btn-secondary btn-sm">
              <Icon name="warehouse" className="h-4 w-4" /> Kho & tồn
            </Link>
            <Link href="/admin/ma-qr" className="btn-secondary btn-sm">
              <Icon name="qr" className="h-4 w-4" /> Mã QR
            </Link>
            <Link href="/admin/bao-cao" className="btn-secondary btn-sm">
              <Icon name="report" className="h-4 w-4" /> Báo cáo
            </Link>
          </div>
        </section>
      </div>

      <section className="card-pad">
        <h2 className="font-semibold text-ink-900">Trạng thái lô theo điều kiện bán</h2>
        <p className="page-sub mt-0.5">Lô chỉ được bán khi phiếu kiểm nghiệm đạt và không thuộc diện thu hồi.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusPill value="PUBLISHED" label={`Đang bán · ${d.batches.published}`} />
          <StatusPill value="PENDING" label={`Chờ kiểm · ${d.batches.pending_quality}`} />
          <StatusPill value="FAIL" label={`Không đạt · ${d.batches.failed}`} />
          <StatusPill value="HOLD" label={`Tạm giữ · ${d.batches.on_hold}`} />
          <StatusPill value="RECALLED" label={`Thu hồi · ${d.batches.recalled}`} />
          <StatusPill value="UNPUBLISHED" label={`Hết hạn · ${d.batches.expired}`} />
        </div>
      </section>
    </div>
  )
}
