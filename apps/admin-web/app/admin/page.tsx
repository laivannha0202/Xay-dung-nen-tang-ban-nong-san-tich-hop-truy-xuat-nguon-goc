import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateTimeVN, dayVN, ORDER_STATUS } from '@/lib/format'
import { Icon, Kpi, PageHeader, EmptyState, StatusPill, SectionHeader } from '@agrimarket/ui'

interface Dashboard {
  revenue: { gross: number; refunded: number; net: number }
  orders: { pending: number; processing: number; shipping: number; delivered: number; total: number }
  batches: { published: number; pending_quality: number; failed: number; on_hold: number; recalled: number; expired: number; near_expiry: number }
  complaints: { new_count: number; open_count: number }
  alerts: Array<{ kind: string; id: string; label: string; detail: string; at: string }>
  series: Array<{ day: string; orders: number; revenue: number }>
  top_products: Array<{ name: string; qty: number; revenue: number }>
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

interface RecentOrder {
  id: string
  code: string
  status: string
  payment_status: string
  total_vnd: number
  placed_at: string
  customer_name: string | null
  customer_email: string | null
  line_count: number
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
  const cookie = await authCookie()
  const [d, recent] = await Promise.all([
    serverFetch<Dashboard>(`/admin/dashboard${suffix}`, cookie),
    serverFetch<{ data: RecentOrder[]; total: number }>('/admin/orders?page=1&pageSize=6', cookie),
  ])

  if (!d) {
    return <EmptyState title="Không tải được số liệu" hint="Máy chủ không phản hồi." icon="report" />
  }

  const pipeline = [
    { label: 'PENDING', value: d.orders.pending, href: '/admin/don-hang?status=PENDING' },
    { label: 'PREPARING', value: d.orders.processing, href: '/admin/don-hang?status=PREPARING' },
    { label: 'SHIPPING', value: d.orders.shipping, href: '/admin/don-hang?status=SHIPPING' },
    { label: 'DELIVERED', value: d.orders.delivered, href: '/admin/don-hang?status=DELIVERED' },
  ]
  const pipelineMax = Math.max(1, ...pipeline.map((p) => p.value))
  const maxOrders = Math.max(1, ...(d.series ?? []).map((r) => r.orders))
  const ndTotal = (d.series ?? []).reduce((a, b) => a + b.orders, 0)

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

      {/* Two real data sources — daily sales and the queues that need a human. */}
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <section className="surface p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-semibold text-ink-900">Đơn đặt 14 ngày gần nhất</h2>
              <p className="page-sub mt-0.5">
                {ndTotal} đơn · doanh thu đã thu {vnd(d.series.reduce((a, b) => a + b.revenue, 0))}
              </p>
            </div>
            <Link href="/admin/bao-cao" className="btn-ghost btn-sm">
              Báo cáo chi tiết <Icon name="chevronRight" className="h-3.5 w-3.5" />
            </Link>
          </div>
          {/* Track is h-40; each bar is absolutely anchored to its bottom, so the % height
              resolves against the 160px track instead of a content-sized flex item. */}
          <div
            className="mt-4 flex h-40 items-end gap-1.5"
            role="img"
            aria-label={`Biểu đồ số đơn theo ngày trong 14 ngày gần nhất, cao nhất ${maxOrders} đơn`}
          >
            {d.series.map((row) => {
              const h = Math.round((row.orders / maxOrders) * 100)
              return (
                <div key={row.day} className="group relative h-full flex-1">
                  <div
                    data-testid="orders-bar"
                    data-orders={row.orders}
                    className="absolute inset-x-0 bottom-0 rounded-t bg-brand-500/85 transition-colors group-hover:bg-brand-600"
                    style={{ height: `${Math.max(h, 2)}%` }}
                    title={`${dayVN(row.day)}: ${row.orders} đơn · ${vnd(row.revenue)}`}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-1.5 flex justify-between text-[10.5px] text-ink-500 tabular-nums">
            <span>{dayVN(d.series[0]?.day ?? '')}</span>
            <span>{dayVN(d.series[d.series.length - 1]?.day ?? '')}</span>
          </div>
        </section>

        <section className="surface flex flex-col p-5">
          <h2 className="font-semibold text-ink-900">Cần xử lý</h2>
          <p className="page-sub mt-0.5">{d.alerts.length} việc đang chờ</p>
          {d.alerts.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-500">
              <Icon name="check" className="h-4 w-4 text-brand-600" /> Không có cảnh báo.
            </p>
          ) : (
            <ul className="-mx-1 mt-2 max-h-56 flex-1 divide-y divide-ink-100 overflow-y-auto">
              {d.alerts.map((a) => (
                <li key={`${a.kind}-${a.id}`}>
                  <Link
                    href={ALERT_LINK[a.kind]?.(a.id) ?? '/admin'}
                    className="flex items-start gap-2 rounded-lg px-1 py-2 transition-colors hover:bg-brand-50/60"
                  >
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-sand-50 text-sand-700">
                      <Icon name={ALERT_ICON[a.kind] ?? 'alert'} className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink-900">{a.label}</span>
                      <span className="block truncate text-[11.5px] text-ink-500">{a.detail}</span>
                    </span>
                    <span className="shrink-0 text-[10.5px] text-ink-500 tabular-nums">{dateTimeVN(a.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink-100 pt-3">
            <Link href="/admin/kho" className="btn-secondary btn-sm">Kho &amp; tồn</Link>
            <Link href="/admin/ma-qr" className="btn-secondary btn-sm">Mã QR</Link>
            <Link href="/admin/bao-cao" className="btn-secondary btn-sm">Báo cáo</Link>
          </div>
        </section>
      </div>

      {/* Pipeline + batch states share one row so the page has no dead space at 1440px. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-pad">
          <h2 className="font-semibold text-ink-900">Dòng đơn hàng</h2>
          <p className="page-sub mt-0.5">Tổng {d.orders.total} đơn trong kỳ đang xem.</p>
          <ul className="mt-3.5 space-y-2.5">
            {pipeline.map((row) => (
              <li key={row.label}>
                <Link href={row.href} className="group block">
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="text-ink-700 group-hover:text-brand-700">{ORDER_STATUS[row.label] ?? row.label}</span>
                    <span className="font-semibold text-ink-900 tabular-nums">{row.value}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.round((row.value / pipelineMax) * 100)}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-pad">
          <h2 className="font-semibold text-ink-900">Trạng thái lô</h2>
          <p className="page-sub mt-0.5">Lô chỉ được bán khi phiếu kiểm nghiệm đạt và không thuộc diện thu hồi.</p>
          <dl className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {[
              ['Đang bán', d.batches.published, 'PUBLISHED'],
              ['Chờ kiểm', d.batches.pending_quality, 'PENDING'],
              ['Không đạt', d.batches.failed, 'FAIL'],
              ['Tạm giữ', d.batches.on_hold, 'HOLD'],
              ['Thu hồi', d.batches.recalled, 'RECALLED'],
              ['Đã hết hạn', d.batches.expired, 'UNPUBLISHED'],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2.5">
                <dt className="text-[11px] text-ink-500">{label}</dt>
                <dd className="mt-0.5 text-lg font-bold text-ink-900 tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Link href="/admin/lo-hang" className="btn-secondary btn-sm">Danh sách lô</Link>
            <Link href="/admin/thu-hoi" className="btn-secondary btn-sm">Thu hồi</Link>
          </div>
        </section>
      </div>

      <section className="card-pad">
        <SectionHeader
          title="Sản phẩm bán chạy"
          hint="Xếp theo doanh thu, không tính đơn huỷ hoặc giao thất bại."
          action={
            <Link href="/admin/bao-cao" className="btn-secondary btn-sm">
              Xem báo cáo <Icon name="chevronRight" className="h-4 w-4" />
            </Link>
          }
        />
        {d.top_products.length === 0 ? (
          <EmptyState title="Chưa có dữ liệu bán hàng" hint="Số liệu xuất hiện sau đơn đầu tiên." icon="report" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th className="text-right">Số lượng bán</th>
                  <th className="text-right">Doanh thu</th>
                  <th className="w-[38%]">Tỉ trọng</th>
                </tr>
              </thead>
              <tbody>
                {d.top_products.map((p) => (
                  <tr key={p.name}>
                    <td className="font-medium text-ink-900">{p.name}</td>
                    <td className="text-right tabular-nums">{p.qty.toLocaleString('vi-VN')}</td>
                    <td className="text-right tabular-nums">{vnd(p.revenue)}</td>
                    <td>
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${Math.round((p.revenue / (d.top_products[0]?.revenue || 1)) * 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title="Đơn hàng gần đây"
          hint={`6 đơn mới nhất trong ${recent?.total ?? 0} đơn toàn hệ thống.`}
          action={
            <Link href="/admin/don-hang" className="btn-secondary btn-sm">
              Xem tất cả <Icon name="chevronRight" className="h-4 w-4" />
            </Link>
          }
        />
        {!recent?.data.length ? (
          <EmptyState title="Chưa có đơn hàng" hint="Đơn mới sẽ hiện ở đây ngay khi khách đặt." icon="orders" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách</th>
                  <th className="text-right">Mặt hàng</th>
                  <th className="text-right">Giá trị</th>
                  <th>Đặt lúc</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {recent.data.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/don-hang/${o.id}`} className="font-mono font-medium text-ink-900 hover:text-brand-700 hover:underline">
                        {o.code}
                      </Link>
                    </td>
                    <td>
                      <span className="block text-sm text-ink-800">{o.customer_name ?? '—'}</span>
                      <span className="block text-xs text-ink-500">{o.customer_email ?? ''}</span>
                    </td>
                    <td className="text-right tabular-nums">{o.line_count}</td>
                    <td className="text-right tabular-nums">{vnd(o.total_vnd)}</td>
                    <td className="text-xs text-ink-600">{dateTimeVN(o.placed_at)}</td>
                    <td>
                      <StatusPill value={o.status} label={ORDER_STATUS[o.status]} />
                    </td>
                    <td>
                      <StatusPill value={o.payment_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
