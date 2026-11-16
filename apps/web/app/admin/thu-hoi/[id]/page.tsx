import Link from 'next/link'
import { notFound } from 'next/navigation'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { qty, dateTimeVN } from '@/lib/format'
import { Act, Field, PatchForm } from '@/components/admin-kit'

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

export default async function AdminRecallDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await serverFetch<Recall>(`/admin/recalls/${id}`, await authCookie())
  if (!r) notFound()

  return (
    <div className="space-y-4">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">Thu hồi lô {r.batch_code}</h1>
          <span className={`badge ${r.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
            {r.status === 'OPEN' ? 'Đang xử lý' : 'Đã kết thúc'}
          </span>
        </div>
        <p className="text-sm text-leaf-700">{r.product_name} · bắt đầu {dateTimeVN(r.started_at)}</p>
        <p className="mt-1 rounded-lg bg-red-50 p-3 text-sm text-red-900">Lý do: {r.reason}</p>
      </header>

      <section className="card overflow-x-auto p-4">
        <h2 className="mb-2 font-semibold">Khách đã nhận lô ({r.contacts.length})</h2>
        {r.contacts.length === 0 ? (
          <p className="text-sm text-leaf-700">Không có khách nào đã nhận lô này.</p>
        ) : (
          <table className="table-base">
            <thead><tr><th>Đơn</th><th>Khách</th><th>Giai đoạn</th><th>Số lượng</th><th>Trạng thái liên hệ</th><th>Cập nhật</th></tr></thead>
            <tbody>
              {r.contacts.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/admin/don-hang/${c.order_id}`} className="font-medium hover:underline">{c.order_code}</Link></td>
                  <td className="text-xs">
                    {c.customer_name ?? '—'}<br />
                    <span className="text-leaf-700">{c.customer_email}</span>
                    {c.customer_phone && <><br /><span className="text-leaf-700">{c.customer_phone}</span></>}
                  </td>
                  <td>{c.stage === 'SHIPPING' ? 'Đang giao' : 'Đã giao'}</td>
                  <td>{qty(c.affected_qty)}</td>
                  <td>
                    {r.status === 'OPEN' ? (
                      <Act
                        path={`/admin/recalls/${r.id}/contacts/${c.id}`}
                        body={{ contact_status: nextContactStatus(c.contact_status) }}
                        label={labelOf(c.contact_status)}
                        className="btn-ghost text-xs"
                        confirmText={`Chuyển sang "${labelOf(nextContactStatus(c.contact_status))}"?`}
                      />
                    ) : (
                      labelOf(c.contact_status)
                    )}
                  </td>
                  <td className="text-xs">{c.handled_at ? dateTimeVN(c.handled_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card overflow-x-auto p-4">
        <h2 className="mb-2 font-semibold">Đơn chưa xuất cần đổi lô ({r.pending_orders.length})</h2>
        {r.pending_orders.length === 0 ? (
          <p className="text-sm text-leaf-700">Không có đơn cần đổi lô.</p>
        ) : (
          <table className="table-base">
            <thead><tr><th>Đơn</th><th>Khách</th><th>Trạng thái</th><th>Tổng</th></tr></thead>
            <tbody>
              {r.pending_orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/don-hang/${o.id}`} className="font-medium hover:underline">{o.code}</Link></td>
                  <td className="text-xs text-leaf-700">{o.customer_email}</td>
                  <td>{o.status}</td>
                  <td>{o.total_vnd.toLocaleString('vi-VN')}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card p-4 text-sm">
        <h2 className="mb-2 font-semibold">Tồn kho lô (bị khóa bán)</h2>
        <ul className="text-leaf-800">
          {r.inventory.map((i) => (
            <li key={i.warehouse_id}>
              Kho {i.warehouse_id.slice(0, 8)} · tồn {qty(i.on_hand_qty)} · giữ {qty(i.reserved_qty)} · khả dụng {qty(i.available)}
            </li>
          ))}
        </ul>
      </section>

      <section className="card grid gap-3 p-4 text-sm sm:grid-cols-4">
        {[
          ['Khách đã nhận', String(r.contacts.length)],
          ['Tổng lượng ảnh hưởng', qty(r.contacts.reduce((s, c) => s + Number(c.affected_qty), 0))],
          ['Đã xử lý', String(r.contacts.filter((c) => c.contact_status === 'RESOLVED' || c.contact_status === 'REFUNDED').length)],
          ['Chờ liên hệ', String(r.contacts.filter((c) => c.contact_status === 'PENDING').length)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-leaf-50 p-3">
            <p className="text-xs text-leaf-600">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
          </div>
        ))}
      </section>

      {r.status === 'OPEN' ? (
        <PatchForm
          path={`/admin/recalls/${r.id}/close`}
          method="POST"
          title="Kết thúc đợt thu hồi"
          submitLabel="Kết thúc & lưu biên bản"
          fields={<Field label="Biên bản kết thúc" name="summary" rows={4} required placeholder="Tóm tắt số khách đã liên hệ, xử lý hoàn tiền…" />}
        />
      ) : (
        <section className="card p-4 text-sm">
          <h2 className="font-semibold">Biên bản kết thúc</h2>
          <p className="mt-1 text-leaf-800">{r.summary || '—'}</p>
          <p className="mt-1 text-xs text-leaf-600">Kết thúc {dateTimeVN(r.closed_at)}. Lô vẫn bị khóa bán.</p>
        </section>
      )}

      <Link href="/admin/thu-hoi" className="btn-ghost">← Danh sách thu hồi</Link>
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
