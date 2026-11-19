import Link from 'next/link'
import { PageHeader, SectionHeader, Kpi, StatusPill, EmptyState, Badge, Icon } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { qty, dateVN, dateTimeVN } from '@/lib/format'
import { CreateForm, Field } from '@/components/admin-kit'
import { Toolbar } from '@/components/toolbar'

interface Inv {
  warehouse_id: string
  warehouse_name: string
  batch_id: string
  batch_code: string
  expiry_date: string
  quality_status: string
  publication_status: string
  safety_status: string
  product_name: string
  unit: string
  on_hand_qty: string
  reserved_qty: string
  available_qty: string
  is_expired: boolean
  near_expiry: boolean
  is_low: boolean
}

interface Movement {
  id: string
  type: string
  quantity: string
  on_hand_after: string
  reason: string
  occurred_at: string
  batch_code: string
  warehouse_name: string
  actor_email: string | null
  order_code: string | null
}

interface Warehouse { id: string; code: string; name: string; address: string; batch_count: number }
interface Batch { id: string; code: string; product_name: string; unit: string }

const QUALITY_LABEL: Record<string, string> = { PASS: 'Đạt', FAIL: 'Không đạt', PENDING: 'Chờ kết luận' }
const SAFETY_LABEL: Record<string, string> = { NORMAL: 'Bình thường', HOLD: 'Tạm giữ', RECALLED: 'Thu hồi' }
const PUBLICATION_LABEL: Record<string, string> = { PUBLISHED: 'Đang bán', UNPUBLISHED: 'Chưa đăng', DRAFT: 'Nháp' }
const MOVEMENT_LABEL: Record<string, string> = { IN: 'Nhập', OUT: 'Xuất', ADJUST: 'Điều chỉnh' }

export default async function AdminInventory({
  searchParams,
}: {
  searchParams: Promise<{ expiring?: string; search?: string; low?: string }>
}) {
  const sp = await searchParams
  const cookie = await authCookie()
  const qs = new URLSearchParams()
  if (sp.search) qs.set('search', sp.search)
  if (sp.expiring) qs.set('expiring_within_days', sp.expiring)
  if (sp.low === '1') qs.set('low_only', 'true')
  const [inv, warehouses, batches, movements] = await Promise.all([
    serverFetch<Inv[]>(`/admin/inventory?${qs.toString()}`, cookie),
    serverFetch<Warehouse[]>('/admin/warehouses', cookie),
    serverFetch<{ data: Batch[] }>('/admin/batches?pageSize=100', cookie),
    serverFetch<{ data: Movement[] }>('/admin/stock/movements?pageSize=20', cookie),
  ])

  const rows = inv ?? []
  const nearExpiry = rows.filter((i) => !i.is_expired && i.near_expiry).length
  const lowCount = rows.filter((i) => i.is_low).length
  const expired = rows.filter((i) => i.is_expired).length
  const movementsRows = movements?.data ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kho & tồn"
        breadcrumb="Kho / Tồn kho"
        description="Tồn theo lô, hạn dùng và khả năng bán. Lô hết hạn hoặc chưa kiểm nghiệm đạt sẽ không bán được dù còn hàng."
        actions={
          <div className="flex flex-wrap items-center gap-2">
          <Toolbar action="/admin/kho" search={{ name: 'search', value: sp.search }} placeholder="Mã lô / sản phẩm">
            <label className="flex items-center gap-1.5 text-xs text-ink-700">
              <input type="checkbox" name="low" value="1" defaultChecked={sp.low === '1'} className="h-4 w-4" />
              Chỉ tồn thấp
            </label>
            <select name="expiring" defaultValue={sp.expiring ?? ''} className="select">
              <option value="">Mọi hạn dùng</option>
              <option value="3">Cận hạn ≤ 3 ngày</option>
              <option value="7">Cận hạn ≤ 7 ngày</option>
              <option value="30">Cận hạn ≤ 30 ngày</option>
            </select>
          </Toolbar>
          <a href={`/api/download/inventory?${qs}`} className="btn-secondary btn-sm" title="Tải tồn kho đang lọc ra CSV">
            <Icon name="download" className="h-3.5 w-3.5" /> CSV
          </a>
          </div>
        }
      />

      {/* Five KPIs: one row at xl, 2–3 in between, so no lone stretched card. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Dòng tồn kho" value={rows.length} icon="warehouse" tone="info" hint={`${warehouses?.length ?? 0} kho đang dùng`} />
        <Kpi label="Lô cận hạn" value={nearExpiry} icon="clock" tone="warning" hint="Trong ngưỡng lọc hiện tại" />
        <Kpi label="Lô hết hạn" value={expired} icon="alert" tone="danger" hint="Không thể bán, cần xử lý" />
        <Kpi label="Tồn thấp" value={lowCount} icon="alert" tone="warning" hint="Dưới ngưỡng cảnh báo ở Cài đặt" />
        <Kpi label="Biến động gần đây" value={movementsRows.length} icon="truck" tone="neutral" hint="20 phiếu nhập / xuất mới nhất" />
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {(warehouses ?? []).map((w) => (
          <Badge key={w.id} tone="neutral">
            {w.code} · {w.name} ({w.batch_count} lô)
          </Badge>
        ))}
      </div>

      <section className="card-pad">
        <SectionHeader title="Ghi nhận kho" hint="Nhập kho cộng tồn; điều chỉnh dùng cho hao hụt hoặc kiểm kê." />
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <CreateForm
            path="/admin/stock/receipts"
            title="Nhập kho"
            submitLabel="Ghi nhận nhập kho"
            fields={
              <>
                <Field label="Kho" name="warehouse_id" required options={(warehouses ?? []).map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }))} />
                <Field
                  label="Lô hàng"
                  name="batch_id"
                  required
                  options={(batches?.data ?? []).map((b) => ({ value: b.id, label: `${b.code} — ${b.product_name}` }))}
                />
                <Field label="Số lượng" name="quantity" type="number" step="0.001" required />
                <Field label="Lý do / ghi chú" name="reason" defaultValue="Nhập kho" />
              </>
            }
          />
          <CreateForm
            path="/admin/stock/adjustments"
            title="Điều chỉnh tồn"
            submitLabel="Ghi nhận điều chỉnh"
            fields={
              <>
                <Field label="Kho" name="warehouse_id" required options={(warehouses ?? []).map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }))} />
                <Field
                  label="Lô hàng"
                  name="batch_id"
                  required
                  options={(batches?.data ?? []).map((b) => ({ value: b.id, label: `${b.code} — ${b.product_name}` }))}
                />
                <Field label="Chênh lệch (+/−)" name="quantity_delta" type="number" step="0.001" required />
                <Field label="Lý do (bắt buộc)" name="reason" required placeholder="VD: hao hụt bảo quản" />
              </>
            }
          />
        </div>
      </section>

      <section>
        <SectionHeader title="Tồn theo lô" hint={`${rows.length} dòng tồn kho`} />
        {rows.length === 0 ? (
          <EmptyState
            title={sp.search || sp.expiring ? 'Không có lô phù hợp' : 'Kho chưa có hàng'}
            hint={sp.search || sp.expiring ? 'Thử bỏ bộ lọc hoặc mở rộng ngưỡng cận hạn.' : 'Ghi nhận phiếu nhập kho để bắt đầu theo dõi tồn.'}
            icon="warehouse"
          />
        ) : (
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Lô</th>
                  <th>Kho</th>
                  <th>Hạn dùng</th>
                  <th>Kiểm nghiệm</th>
                  <th>An toàn</th>
                  <th className="text-right">Tồn</th>
                  <th className="text-right">Giữ chỗ</th>
                  <th className="text-right">Khả dụng</th>
                  <th>Bán được?</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const sellable = i.quality_status === 'PASS' && i.publication_status === 'PUBLISHED' &&
                    i.safety_status === 'NORMAL' && !i.is_expired
                  return (
                    <tr key={`${i.warehouse_id}-${i.batch_id}`}>
                      <td>
                        <Link href={`/admin/lo-hang/${i.batch_id}`} className="font-medium text-ink-900 hover:underline">{i.batch_code}</Link>
                        <p className="text-xs text-ink-500">{i.product_name}</p>
                        {i.is_low && <Badge tone="warning">Tồn thấp</Badge>}
                      </td>
                      <td className="text-ink-600">{i.warehouse_name}</td>
                      <td className={i.is_expired ? 'text-rose-700' : i.near_expiry ? 'text-sand-700' : 'text-ink-600'}>
                        {dateVN(i.expiry_date)}{i.is_expired && ' (hết hạn)'}{!i.is_expired && i.near_expiry && ' (cận hạn)'}
                      </td>
                      <td>
                        <StatusPill value={i.quality_status} label={QUALITY_LABEL[i.quality_status]} />
                      </td>
                      <td>
                        <StatusPill value={i.safety_status} label={SAFETY_LABEL[i.safety_status]} />
                      </td>
                      <td className="text-right tabular-nums">
                        {qty(i.on_hand_qty)} <span className="text-xs text-ink-500">{i.unit}</span>
                      </td>
                      <td className="text-right tabular-nums text-ink-500">{qty(i.reserved_qty)}</td>
                      <td className="text-right font-medium tabular-nums text-ink-900">{qty(i.available_qty)}</td>
                      <td>
                        <Badge tone={sellable ? 'success' : 'neutral'}>{sellable ? 'Có' : 'Không'}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Biến động kho gần đây" hint="Ai làm gì, lúc nào, trên lô nào." />
        {movementsRows.length === 0 ? (
          <EmptyState title="Chưa có biến động" hint="Phiếu nhập, xuất và điều chỉnh sẽ hiện ở đây." icon="truck" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Thời điểm</th>
                  <th>Lô</th>
                  <th>Kho</th>
                  <th>Loại</th>
                  <th className="text-right">Số lượng</th>
                  <th className="text-right">Tồn sau</th>
                  <th>Lý do</th>
                  <th className="w-px" />
                </tr>
              </thead>
              <tbody>
                {movementsRows.map((m) => (
                  <tr key={m.id}>
                    <td className="text-xs text-ink-500">{dateTimeVN(m.occurred_at)}</td>
                    <td className="font-medium text-ink-900">{m.batch_code}</td>
                    <td className="text-ink-600">{m.warehouse_name}</td>
                    <td>
                      <Badge tone={m.type === 'IN' ? 'success' : m.type === 'OUT' ? 'info' : 'warning'}>
                        {MOVEMENT_LABEL[m.type] ?? m.type}
                      </Badge>
                    </td>
                    <td className="text-right tabular-nums">{qty(m.quantity)}</td>
                    <td className="text-right tabular-nums text-ink-500">{qty(m.on_hand_after)}</td>
                    <td className="text-xs text-ink-500">{m.order_code ? `Đơn ${m.order_code}` : m.reason}</td>
                    {/* One link, not three: the movement type decides which phiếu opens. */}
                    <td>
                      <Link
                        href={`/admin/in/${m.type === 'IN' ? 'nhap-kho' : m.type === 'OUT' ? 'xuat-kho' : 'dieu-chinh'}/${m.id}`}
                        target="_blank"
                        className="btn-ghost btn-sm"
                        title="In phiếu kho"
                        aria-label="In phiếu kho"
                      >
                        <Icon name="print" className="h-3.5 w-3.5" />
                      </Link>
                    </td>
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
