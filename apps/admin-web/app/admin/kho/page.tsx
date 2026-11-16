import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { qty, dateVN, dateTimeVN } from '@/lib/format'
import { CreateForm, Field } from '@/components/admin-kit'

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

export default async function AdminInventory({ searchParams }: { searchParams: Promise<{ expiring?: string; search?: string }> }) {
  const sp = await searchParams
  const cookie = await authCookie()
  const qs = new URLSearchParams()
  if (sp.search) qs.set('search', sp.search)
  if (sp.expiring) qs.set('expiring_within_days', sp.expiring)
  const [inv, warehouses, batches, movements] = await Promise.all([
    serverFetch<Inv[]>(`/admin/inventory?${qs.toString()}`, cookie),
    serverFetch<Warehouse[]>('/admin/warehouses', cookie),
    serverFetch<{ data: Batch[] }>('/admin/batches?pageSize=100', cookie),
    serverFetch<{ data: Movement[] }>('/admin/stock/movements?pageSize=20', cookie),
  ])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">Kho & tồn</h1>
        <form className="ml-auto flex flex-wrap gap-2" action="/admin/kho">
          <input name="search" defaultValue={sp.search ?? ''} className="input" placeholder="Mã lô / sản phẩm" />
          <select name="expiring" defaultValue={sp.expiring ?? ''} className="input">
            <option value="">Mọi hạn dùng</option>
            <option value="3">Cận hạn ≤ 3 ngày</option>
            <option value="7">Cận hạn ≤ 7 ngày</option>
            <option value="30">Cận hạn ≤ 30 ngày</option>
          </select>
          <button className="btn-secondary">Lọc</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {(warehouses ?? []).map((w) => (
          <span key={w.id} className="badge bg-leaf-50 text-leaf-800">{w.code} · {w.name} ({w.batch_count} lô)</span>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>Lô</th><th>Kho</th><th>Hạn dùng</th><th>Tồn</th><th>Giữ chỗ</th><th>Khả dụng</th><th>Lô bán được?</th></tr>
          </thead>
          <tbody>
            {(inv ?? []).map((i) => {
              const sellable = i.quality_status === 'PASS' && i.publication_status === 'PUBLISHED' &&
                i.safety_status === 'NORMAL' && !i.is_expired
              return (
                <tr key={`${i.warehouse_id}-${i.batch_id}`}>
                  <td>
                    <Link href={`/admin/lo-hang/${i.batch_id}`} className="font-medium hover:underline">{i.batch_code}</Link>
                    <p className="text-xs text-leaf-600">{i.product_name}</p>
                  </td>
                  <td className="text-leaf-700">{i.warehouse_name}</td>
                  <td className={i.is_expired ? 'text-red-700' : i.near_expiry ? 'text-amber-700' : ''}>
                    {dateVN(i.expiry_date)}{i.is_expired && ' (hết hạn)'}{!i.is_expired && i.near_expiry && ' (cận hạn)'}
                  </td>
                  <td>{qty(i.on_hand_qty)} {i.unit}</td>
                  <td>{qty(i.reserved_qty)}</td>
                  <td>{qty(i.available_qty)}</td>
                  <td>
                    <span className={`badge ${sellable ? 'bg-leaf-100 text-leaf-800' : 'bg-slate-100 text-slate-700'}`}>
                      {sellable ? 'Có' : 'Không'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <section className="card overflow-x-auto p-4">
        <h2 className="mb-2 font-semibold">Biến động kho gần đây</h2>
        <table className="table-base">
          <thead><tr><th>Thời điểm</th><th>Lô</th><th>Kho</th><th>Loại</th><th>Số lượng</th><th>Tồn sau</th><th>Lý do</th></tr></thead>
          <tbody>
            {(movements?.data ?? []).map((m) => (
              <tr key={m.id}>
                <td className="text-xs">{dateTimeVN(m.occurred_at)}</td>
                <td>{m.batch_code}</td>
                <td className="text-leaf-700">{m.warehouse_name}</td>
                <td>
                  <span className={`badge ${m.type === 'IN' ? 'bg-leaf-100 text-leaf-800' : m.type === 'OUT' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'}`}>
                    {m.type === 'IN' ? 'Nhập' : m.type === 'OUT' ? 'Xuất' : 'Điều chỉnh'}
                  </span>
                </td>
                <td>{qty(m.quantity)}</td>
                <td>{qty(m.on_hand_after)}</td>
                <td className="text-xs text-leaf-700">{m.order_code ? `Đơn ${m.order_code}` : m.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export const dynamic = 'force-dynamic'
