import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty, dateVN } from '@/lib/format'

interface Revenue {
  data: Array<{ bucket: string; gross: number; refunded: number; net: number }>
  summary: { gross: number; refunded: number; net: number }
  range: { from: string; to: string }
}

interface Ops {
  ordersByStatus: Array<{ status: string; count: number; total_vnd: number }>
  inventoryByBatch: Array<{ batch_code: string; product_name: string; expiry_date: string; quality_status: string; safety_status: string; on_hand: string; reserved: string; available: string }>
  batchesByState: { active: number; near_expiry: number; expired: number; hold: number; recalled: number }
  labTests: Array<{ overall_result: string; count: number }>
  qrScans: Array<{ batch_code: string; scans: number; last_scan: string | null }>
}

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; group_by?: string }> }) {
  const sp = await searchParams
  const qs = new URLSearchParams()
  if (sp.from) qs.set('from', sp.from)
  if (sp.to) qs.set('to', sp.to)
  if (sp.group_by) qs.set('group_by', sp.group_by)
  const cookie = await authCookie()
  const [rev, ops] = await Promise.all([
    serverFetch<Revenue>(`/admin/reports/revenue?${qs.toString()}`, cookie),
    serverFetch<Ops>('/admin/reports/operations', cookie),
  ])
  const maxNet = Math.max(1, ...(rev?.data ?? []).map((d) => d.net))

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Báo cáo</h1>

      <form action="/admin/bao-cao" className="card flex flex-wrap items-end gap-2 p-3 text-sm">
        <label className="flex flex-col">
          <span className="label">Từ ngày</span>
          <input type="date" name="from" defaultValue={sp.from ?? rev?.range.from ?? ''} className="input" />
        </label>
        <label className="flex flex-col">
          <span className="label">Đến ngày</span>
          <input type="date" name="to" defaultValue={sp.to ?? rev?.range.to ?? ''} className="input" />
        </label>
        <label className="flex flex-col">
          <span className="label">Nhóm theo</span>
          <select name="group_by" defaultValue={sp.group_by ?? 'day'} className="input">
            <option value="day">Ngày</option>
            <option value="month">Tháng</option>
          </select>
        </label>
        <button className="btn-secondary">Xem</button>
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Đã thu', vnd(rev?.summary.gross ?? 0)],
          ['Đã hoàn', vnd(rev?.summary.refunded ?? 0)],
          ['Doanh thu thuần', vnd(rev?.summary.net ?? 0)],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <p className="text-xs text-leaf-600">{k}</p>
            <p className="mt-1 text-lg font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Doanh thu theo kỳ</h2>
        {(rev?.data ?? []).length === 0 ? (
          <p className="text-sm text-leaf-700">Không có dữ liệu trong khoảng này.</p>
        ) : (
          <table className="table-base">
            <thead><tr><th>Kỳ</th><th>Đã thu</th><th>Hoàn</th><th>Thuần</th><th className="w-40">Tỉ lệ</th></tr></thead>
            <tbody>
              {rev!.data.map((d) => (
                <tr key={d.bucket}>
                  <td>{dateVN(d.bucket)}</td>
                  <td>{vnd(d.gross)}</td>
                  <td>{vnd(d.refunded)}</td>
                  <td className="font-medium">{vnd(d.net)}</td>
                  <td>
                    <div className="h-2 rounded bg-leaf-50">
                      <div className="h-2 rounded bg-leaf-500" style={{ width: `${Math.max(2, (d.net / maxNet) * 100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Đơn theo trạng thái</h2>
          <table className="table-base">
            <thead><tr><th>Trạng thái</th><th>Số đơn</th><th>Giá trị</th></tr></thead>
            <tbody>
              {(ops?.ordersByStatus ?? []).map((s) => (
                <tr key={s.status}><td>{s.status}</td><td>{s.count}</td><td>{vnd(s.total_vnd)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Trạng thái lô hàng</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {[
              ['Đang bán', ops?.batchesByState.active ?? 0],
              ['Cận hạn ≤7 ngày', ops?.batchesByState.near_expiry ?? 0],
              ['Hết hạn', ops?.batchesByState.expired ?? 0],
              ['Tạm giữ', ops?.batchesByState.hold ?? 0],
              ['Thu hồi', ops?.batchesByState.recalled ?? 0],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg bg-leaf-50 p-2">
                <dt className="text-xs text-leaf-600">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-3 font-medium text-sm">Phiếu kiểm nghiệm</h3>
          <p className="text-sm text-leaf-800">
            {(ops?.labTests ?? []).map((t) => `${t.overall_result === 'PASS' ? 'Đạt' : 'Không đạt'}: ${t.count}`).join(' · ') || '—'}
          </p>
        </section>
      </div>

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Tồn kho theo lô</h2>
        <table className="table-base">
          <thead><tr><th>Lô</th><th>Sản phẩm</th><th>Hạn dùng</th><th>Tồn</th><th>Giữ</th><th>Khả dụng</th></tr></thead>
          <tbody>
            {(ops?.inventoryByBatch ?? []).map((i) => (
              <tr key={i.batch_code}>
                <td className="font-medium">{i.batch_code}</td>
                <td>{i.product_name}</td>
                <td>{dateVN(i.expiry_date)}</td>
                <td>{qty(i.on_hand)}</td>
                <td>{qty(i.reserved)}</td>
                <td>{qty(i.available)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Lượt quét QR theo lô</h2>
        <table className="table-base">
          <thead><tr><th>Lô</th><th>Lượt quét</th><th>Gần nhất</th></tr></thead>
          <tbody>
            {(ops?.qrScans ?? []).map((q) => (
              <tr key={q.batch_code}><td>{q.batch_code}</td><td>{q.scans}</td><td>{q.last_scan ? dateVN(q.last_scan) : '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export const dynamic = 'force-dynamic'
