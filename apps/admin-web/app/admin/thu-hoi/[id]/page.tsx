import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader, Kpi, StatusPill, SectionHeader, EmptyState, Alert, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { qty, vnd, dateTimeVN, RECALL_SEVERITY } from '@/lib/format'
import { Act, Field, PatchForm } from '@/components/admin-kit'
import { PrintButton } from '@/components/quick-tools'

interface Contact {
  id: string
  order_id: string
  order_code: string
  customer_email: string
  customer_name: string | null
  customer_phone: string | null
  stage: string
  affected_qty: string
  contact_status: string
  note: string
  handled_at: string | null
}

interface Recall {
  id: string
  batch_id: string
  batch_code: string
  product_name: string
  reason: string
  severity: string
  status: string
  started_at: string
  closed_at: string | null
  summary: string
  contacts: Contact[]
  pending_orders: Array<{ id: string; code: string; status: string; total_vnd: number; customer_email: string }>
  inventory: Array<{ warehouse_id: string; on_hand_qty: string; reserved_qty: string; available: string }>
}

const CONTACT_STATUS = ['PENDING', 'CONTACTED', 'RESOLVED', 'REFUNDED']

const STATUS_LABEL: Record<string, string> = { OPEN: 'Đang xử lý', CLOSED: 'Đã kết thúc' }

export default async function AdminRecallDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await serverFetch<Recall>(`/admin/recalls/${id}`, await authCookie())
  if (!r) notFound()

  const affectedQty = r.contacts.reduce((s, c) => s + Number(c.affected_qty), 0)
  const done = r.contacts.filter((c) => c.contact_status === 'RESOLVED' || c.contact_status === 'REFUNDED').length
  const pendingContact = r.contacts.filter((c) => c.contact_status === 'PENDING').length

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Thu hồi lô ${r.batch_code}`}
        breadcrumb="Hàng hoá / Thu hồi / Chi tiết"
        description={`${r.product_name} · bắt đầu ${dateTimeVN(r.started_at)}`}
        actions={
          <>
            <StatusPill value={r.status} label={STATUS_LABEL[r.status]} />
            <PrintButton href={`/admin/in/thu-hoi/${r.id}`} label="In biên bản" />
          </>
        }
      />

      <Alert tone="danger">
        <p className="font-medium">Lý do thu hồi: {r.reason}</p>
        <p className="mt-0.5 text-xs">
          Mức độ: {RECALL_SEVERITY[r.severity] ?? r.severity} · {r.contacts.length} khách đã nhận lô · lô đang bị chặn bán
        </p>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Khách đã nhận" value={r.contacts.length} icon="customer" tone="info" />
        <Kpi label="Tổng lượng ảnh hưởng" value={qty(affectedQty)} icon="products" tone="danger" />
        <Kpi label="Đã xử lý" value={done} icon="check" tone="success" hint="Đã xử lý hoặc hoàn tiền" />
        <Kpi label="Chờ liên hệ" value={pendingContact} icon="phone" tone={pendingContact ? 'warning' : 'neutral'} hint={`${r.pending_orders.length} đơn cần đổi lô`} />
      </div>

      <section className="card-pad">
        <SectionHeader title="Khách đã nhận lô" hint="Bấm trạng thái để chuyển sang bước kế tiếp." action={<Badge tone="neutral">{r.contacts.length} khách</Badge>} />
        {r.contacts.length === 0 ? (
          <EmptyState title="Không có khách nào đã nhận lô này" hint="Chỉ đơn đã giao hoặc đang giao mới xuất hiện ở đây." icon="customer" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Đơn</th>
                  <th>Khách</th>
                  <th>Giai đoạn</th>
                  <th className="text-right">Số lượng</th>
                  <th>Trạng thái liên hệ</th>
                  <th>Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {r.contacts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/don-hang/${c.order_id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline">
                        {c.order_code}
                      </Link>
                    </td>
                    <td>
                      <p className="font-medium text-ink-900">{c.customer_name ?? '—'}</p>
                      <p className="text-xs text-ink-500">
                        {c.customer_email}
                        {c.customer_phone && ` · ${c.customer_phone}`}
                      </p>
                    </td>
                    <td className="text-xs text-ink-600">{c.stage === 'SHIPPING' ? 'Đang giao' : 'Đã giao'}</td>
                    <td className="text-right tabular-nums">{qty(c.affected_qty)}</td>
                    <td>
                      {r.status === 'OPEN' ? (
                        <Act
                          path={`/admin/recalls/${r.id}/contacts/${c.id}`}
                          body={{ contact_status: nextContactStatus(c.contact_status) }}
                          label={labelOf(c.contact_status)}
                          className="btn-ghost btn-sm"
                          confirmText={`Chuyển sang "${labelOf(nextContactStatus(c.contact_status))}"?`}
                        />
                      ) : (
                        <StatusPill value={c.contact_status} label={labelOf(c.contact_status)} />
                      )}
                    </td>
                    <td className="text-xs text-ink-600">{c.handled_at ? dateTimeVN(c.handled_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-pad">
        <SectionHeader title="Đơn chưa xuất cần đổi lô" hint="Hệ thống đã giải phóng lô này khỏi các đơn dưới đây." action={<Badge tone="warning">{r.pending_orders.length} đơn</Badge>} />
        {r.pending_orders.length === 0 ? (
          <EmptyState title="Không có đơn cần đổi lô" hint="Mọi đơn liên quan đã xuất kho hoặc đã xử lý xong." icon="orders" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Đơn</th>
                  <th>Khách</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {r.pending_orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/don-hang/${o.id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline">
                        {o.code}
                      </Link>
                    </td>
                    <td className="text-xs text-ink-500">{o.customer_email}</td>
                    <td><Badge tone="neutral">{o.status}</Badge></td>
                    <td className="text-right tabular-nums">{vnd(o.total_vnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-pad">
        <SectionHeader title="Tồn kho lô" hint="Số lượng đang bị khoá bán trên từng kho." />
        {r.inventory.length === 0 ? (
          <EmptyState title="Không còn tồn kho" hint="Lô đã xuất hết hoặc chưa nhập kho." icon="warehouse" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Kho</th>
                  <th className="text-right">Tồn</th>
                  <th className="text-right">Đang giữ</th>
                  <th className="text-right">Khả dụng</th>
                </tr>
              </thead>
              <tbody>
                {r.inventory.map((i) => (
                  <tr key={i.warehouse_id}>
                    <td className="font-medium text-ink-900">Kho {i.warehouse_id.slice(0, 8)}</td>
                    <td className="text-right tabular-nums">{qty(i.on_hand_qty)}</td>
                    <td className="text-right tabular-nums">{qty(i.reserved_qty)}</td>
                    <td className="text-right tabular-nums text-ink-500">{qty(i.available)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {r.status === 'OPEN' ? (
        <section className="card-pad">
          <PatchForm
            path={`/admin/recalls/${r.id}/close`}
            method="POST"
            title="Kết thúc đợt thu hồi"
            submitLabel="Kết thúc & lưu biên bản"
            fields={<Field label="Biên bản kết thúc" name="summary" rows={4} required placeholder="Tóm tắt số khách đã liên hệ, xử lý hoàn tiền…" />}
          />
        </section>
      ) : (
        <section className="card-pad">
          <SectionHeader title="Biên bản kết thúc" hint={`Kết thúc ${dateTimeVN(r.closed_at)}. Lô vẫn bị khóa bán.`} />
          <p className="text-sm text-ink-700">{r.summary || '—'}</p>
        </section>
      )}

      <Link href="/admin/thu-hoi" className="btn-ghost btn-sm">← Danh sách thu hồi</Link>
    </div>
  )
}

function labelOf(status: string): string {
  return { PENDING: 'Chờ liên hệ', CONTACTED: 'Đã liên hệ', RESOLVED: 'Đã xử lý', REFUNDED: 'Đã hoàn tiền' }[status] ?? status
}

function nextContactStatus(current: string): string {
  const i = CONTACT_STATUS.indexOf(current)
  return CONTACT_STATUS[Math.min(i + 1, CONTACT_STATUS.length - 1)]!
}

export const dynamic = 'force-dynamic'
