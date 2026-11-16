import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateTimeVN } from '@/lib/format'

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

export default async function AdminDashboard() {
  const d = await serverFetch<Dashboard>('/admin/dashboard', await authCookie())
  if (!d) return <p className="text-leaf-700">Không tải được số liệu.</p>
  const cards = [
    { label: 'Doanh thu thuần', value: vnd(d.revenue.net), hint: `Đã thu ${vnd(d.revenue.gross)} · hoàn ${vnd(d.revenue.refunded)}` },
    { label: 'Đơn chờ xác nhận', value: String(d.orders.pending), hint: `Đang xử lý ${d.orders.processing} · đang giao ${d.orders.shipping}` },
    { label: 'Lô đang bán', value: String(d.batches.published), hint: `Cận hạn ${d.batches.near_expiry} · hết hạn ${d.batches.expired}` },
    { label: 'Khiếu nại mới', value: String(d.complaints.new_count), hint: `Đang mở ${d.complaints.open_count}` },
  ]

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold">Bảng điều khiển</h1>
        <p className="text-sm text-leaf-700">Tình hình bán hàng và chất lượng lô hàng.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-leaf-600">{c.label}</p>
            <p className="mt-1 text-xl font-semibold">{c.value}</p>
            <p className="mt-1 text-xs text-leaf-600">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="font-semibold">Cảnh báo cần xử lý</h2>
          {d.alerts.length === 0 ? (
            <p className="mt-2 text-sm text-leaf-700">Không có cảnh báo.</p>
          ) : (
            <ul className="mt-2 divide-y divide-leaf-50">
              {d.alerts.map((a) => (
                <li key={`${a.kind}-${a.id}`} className="flex items-center gap-2 py-2 text-sm">
                  <span className={`badge ${a.kind === 'RECALL' || a.kind === 'LAB_FAIL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                    {a.kind}
                  </span>
                  <Link href={ALERT_LINK[a.kind]?.(a.id) ?? '/admin'} className="font-medium hover:underline">{a.label}</Link>
                  <span className="text-leaf-700">{a.detail}</span>
                  <span className="ml-auto text-xs text-leaf-600">{dateTimeVN(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4">
          <h2 className="font-semibold">Chất lượng lô hàng</h2>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {[
              ['Chờ kiểm nghiệm', d.batches.pending_quality],
              ['Không đạt', d.batches.failed],
              ['Đang tạm giữ', d.batches.on_hold],
              ['Đã thu hồi', d.batches.recalled],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg bg-leaf-50 p-3">
                <dt className="text-xs text-leaf-600">{k}</dt>
                <dd className="text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/admin/lo-hang" className="btn-secondary">Duyệt lô hàng</Link>
            <Link href="/admin/kho" className="btn-secondary">Nhập kho</Link>
            <Link href="/admin/don-hang?status=PENDING" className="btn-primary">Xử lý đơn mới</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
