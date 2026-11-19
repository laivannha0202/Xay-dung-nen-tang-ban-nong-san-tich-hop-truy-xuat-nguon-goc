import { PageHeader, SectionHeader, Kpi, StatusPill, EmptyState, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty, dateVN } from '@/lib/format'
import { PrintButton } from '@/components/quick-tools'
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

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã huỷ',
  DELIVERY_FAILED: 'Giao thất bại',
}
const QUALITY_LABEL: Record<string, string> = { PASS: 'Đạt', FAIL: 'Không đạt', PENDING: 'Chờ kết luận' }
const SAFETY_LABEL: Record<string, string> = { NORMAL: 'Bình thường', HOLD: 'Tạm giữ', RECALLED: 'Thu hồi' }

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
  const periods = rev?.data ?? []
  const state = ops?.batchesByState

  return (
    <div className="space-y-5">
      <PageHeader
        title="Báo cáo"
        breadcrumb="Báo cáo / Tổng hợp"
        description="Doanh thu theo kỳ cùng tình hình vận hành: đơn hàng, tồn kho, kiểm nghiệm và lượt quét QR truy xuất."
        actions={
          <>
            <Badge tone="neutral">
              {dateVN(rev?.range.from ?? '')} → {dateVN(rev?.range.to ?? '')}
            </Badge>
            <PrintButton href={`/admin/in/doanh-thu/bao-cao?${qs.toString()}`} label="In doanh thu" />
            <PrintButton href="/admin/in/ton-kho/bao-cao" label="In tồn kho" />
          </>
        }
      />

      <section className="card-pad">
        <SectionHeader title="Khoảng thời gian" hint="Doanh thu tính theo ngày ghi nhận thanh toán; hoàn tiền trừ vào kỳ phát sinh." />
        <form action="/admin/bao-cao" className="flex flex-wrap items-end gap-2 text-sm">
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
          <button className="btn-primary">Xem</button>
        </form>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Đã thu" value={vnd(rev?.summary.gross ?? 0)} icon="payment" tone="success" hint="Tổng tiền khách đã trả trong kỳ" />
        <Kpi label="Đã hoàn" value={vnd(rev?.summary.refunded ?? 0)} icon="recall" tone="warning" hint="Tiền đã trả lại khách" />
        <Kpi label="Doanh thu thuần" value={vnd(rev?.summary.net ?? 0)} icon="report" tone="info" hint="Đã thu trừ hoàn tiền" />
      </div>

      <section className="card-pad">
        <SectionHeader title="Doanh thu theo kỳ" hint={`${periods.length} kỳ · tỉ lệ tính theo kỳ cao nhất`} />
        {periods.length === 0 ? (
          <EmptyState title="Không có dữ liệu trong khoảng này" hint="Chọn khoảng ngày rộng hơn hoặc kiểm tra lại đơn đã thanh toán." icon="report" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Kỳ</th>
                  <th className="text-right">Đã thu</th>
                  <th className="text-right">Hoàn</th>
                  <th className="text-right">Thuần</th>
                  <th className="w-40">Tỉ lệ</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((d) => (
                  <tr key={d.bucket}>
                    <td className="font-medium text-ink-900">{dateVN(d.bucket)}</td>
                    <td className="text-right tabular-nums">{vnd(d.gross)}</td>
                    <td className="text-right tabular-nums text-ink-500">{vnd(d.refunded)}</td>
                    <td className="text-right font-medium tabular-nums text-ink-900">{vnd(d.net)}</td>
                    <td>
                      <div className="h-2 rounded-full bg-brand-50">
                        <div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.max(2, (d.net / maxNet) * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card-pad">
          <SectionHeader title="Đơn theo trạng thái" hint="Giá trị là tổng tiền hàng của các đơn trong từng trạng thái." />
          {(ops?.ordersByStatus ?? []).length === 0 ? (
            <EmptyState title="Chưa có đơn nào" hint="Đơn phát sinh sẽ được nhóm theo trạng thái ở đây." icon="orders" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Trạng thái</th>
                    <th className="text-right">Số đơn</th>
                    <th className="text-right">Giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  {(ops?.ordersByStatus ?? []).map((s) => (
                    <tr key={s.status}>
                      <td>
                        <StatusPill value={s.status} label={ORDER_STATUS_LABEL[s.status]} />
                      </td>
                      <td className="text-right tabular-nums">{s.count}</td>
                      <td className="text-right tabular-nums text-ink-500">{vnd(s.total_vnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card-pad">
          <SectionHeader title="Trạng thái lô hàng" hint="Đếm toàn bộ lô đang có trong hệ thống." />
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {[
              ['Đang bán', state?.active ?? 0],
              ['Cận hạn ≤7 ngày', state?.near_expiry ?? 0],
              ['Hết hạn', state?.expired ?? 0],
              ['Tạm giữ', state?.hold ?? 0],
              ['Thu hồi', state?.recalled ?? 0],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg border border-ink-200 bg-ink-100 p-2">
                <dt className="text-xs text-ink-500">{k}</dt>
                <dd className="font-semibold tabular-nums text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <SectionHeader title="Phiếu kiểm nghiệm" hint="Số phiếu theo kết luận chung." />
            {(ops?.labTests ?? []).length === 0 ? (
              <p className="text-sm text-ink-500">Chưa có phiếu kiểm nghiệm.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(ops?.labTests ?? []).map((t) => (
                  <StatusPill key={t.overall_result} value={t.overall_result} label={`${QUALITY_LABEL[t.overall_result] ?? t.overall_result}: ${t.count}`} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="card-pad">
        <SectionHeader title="Tồn kho theo lô" hint="Chỉ hiển thị lô còn tồn hoặc đang giữ chỗ." />
        {(ops?.inventoryByBatch ?? []).length === 0 ? (
          <EmptyState title="Kho đang trống" hint="Nhập hàng vào kho để thấy tồn theo lô tại đây." icon="warehouse" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Lô</th>
                  <th>Sản phẩm</th>
                  <th>Hạn dùng</th>
                  <th>Chất lượng / An toàn</th>
                  <th className="text-right">Tồn</th>
                  <th className="text-right">Giữ</th>
                  <th className="text-right">Khả dụng</th>
                </tr>
              </thead>
              <tbody>
                {(ops?.inventoryByBatch ?? []).map((i) => (
                  <tr key={i.batch_code}>
                    <td className="font-medium text-ink-900">{i.batch_code}</td>
                    <td className="text-ink-600">{i.product_name}</td>
                    <td className="text-ink-600">{dateVN(i.expiry_date)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <StatusPill value={i.quality_status} label={QUALITY_LABEL[i.quality_status]} />
                        <StatusPill value={i.safety_status} label={SAFETY_LABEL[i.safety_status]} />
                      </div>
                    </td>
                    <td className="text-right tabular-nums">{qty(i.on_hand)}</td>
                    <td className="text-right tabular-nums text-ink-500">{qty(i.reserved)}</td>
                    <td className="text-right font-medium tabular-nums text-ink-900">{qty(i.available)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-pad">
        <SectionHeader title="Lượt quét QR theo lô" hint="Khách quét mã trên bao bì để xem nguồn gốc." />
        {(ops?.qrScans ?? []).length === 0 ? (
          <EmptyState title="Chưa có lượt quét" hint="Mã QR in trên nhãn lô sẽ được đếm khi khách quét." icon="qr" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Lô</th>
                  <th className="text-right">Lượt quét</th>
                  <th className="text-right">Gần nhất</th>
                </tr>
              </thead>
              <tbody>
                {(ops?.qrScans ?? []).map((q) => (
                  <tr key={q.batch_code}>
                    <td className="font-medium text-ink-900">{q.batch_code}</td>
                    <td className="text-right tabular-nums">{q.scans}</td>
                    <td className="text-right text-ink-500">{q.last_scan ? dateVN(q.last_scan) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export const dynamic = 'force-dynamic'
