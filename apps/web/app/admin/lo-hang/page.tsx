import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { qty, dateVN, QUALITY, PUBLICATION, SAFETY } from '@/lib/format'
import { CreateForm, Field } from '@/components/admin-kit'
import { StatusBadge } from '@/components/ui'

interface Batch {
  id: string
  code: string
  product_name: string
  unit: string
  farm_name: string
  season_code: string
  harvest_date: string
  pack_date: string
  expiry_date: string
  quality_status: string
  publication_status: string
  safety_status: string
  available: string
  is_expired: boolean
  qr_token: string | null
}

interface Season { id: string; code: string; product_name: string; farm_name: string }

export default async function AdminBatches({ searchParams }: { searchParams: Promise<{ quality?: string; publication?: string; safety?: string; search?: string }> }) {
  const sp = await searchParams
  const cookie = await authCookie()
  const qs = new URLSearchParams()
  for (const k of ['quality', 'publication', 'safety', 'search'] as const) if (sp[k]) qs.set(k, sp[k]!)
  const [list, seasons] = await Promise.all([
    serverFetch<{ data: Batch[]; total: number }>(`/admin/batches?${qs.toString()}`, cookie),
    serverFetch<Season[]>('/admin/seasons', cookie),
  ])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">Lô hàng & kiểm nghiệm</h1>
        <form className="ml-auto flex flex-wrap gap-2" action="/admin/lo-hang">
          <input name="search" defaultValue={sp.search ?? ''} className="input" placeholder="Mã lô / sản phẩm" />
          <select name="quality" defaultValue={sp.quality ?? ''} className="input">
            <option value="">Mọi chất lượng</option>
            <option value="PENDING">Chờ kiểm nghiệm</option>
            <option value="PASS">Đạt</option>
            <option value="FAIL">Không đạt</option>
          </select>
          <select name="publication" defaultValue={sp.publication ?? ''} className="input">
            <option value="">Mọi công khai</option>
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Đã công khai</option>
          </select>
          <button className="btn-secondary">Lọc</button>
        </form>
      </div>

      <CreateForm
        path="/admin/batches"
        title="Tạo lô hàng"
        fields={
          <>
            <Field label="Mùa vụ" name="season_id" required options={(seasons ?? []).map((s) => ({ value: s.id, label: `${s.code} — ${s.product_name} (${s.farm_name})` }))} />
            <Field label="Mã lô" name="code" required placeholder="VD: LO-2026-0011" />
            <Field label="Ngày thu hoạch" name="harvest_date" type="date" required />
            <Field label="Ngày đóng gói" name="pack_date" type="date" required />
            <Field label="Hạn dùng" name="expiry_date" type="date" required />
            <Field label="Sản lượng thu hoạch" name="harvested_qty" type="number" step="0.001" required />
            <Field label="Điều kiện bảo quản" name="storage_condition" />
            <Field label="Ghi chú" name="notes" rows={2} />
          </>
        }
      />

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>Mã lô</th><th>Sản phẩm</th><th>Thu hoạch</th><th>Hạn dùng</th><th>Khả dụng</th><th>Chất lượng</th><th>Công khai</th><th>An toàn</th></tr>
          </thead>
          <tbody>
            {(list?.data ?? []).map((b) => (
              <tr key={b.id} className={b.is_expired ? 'opacity-60' : ''}>
                <td>
                  <Link href={`/admin/lo-hang/${b.id}`} className="font-medium hover:underline">{b.code}</Link>
                  <p className="text-xs text-leaf-600">{b.season_code} · {b.farm_name}</p>
                </td>
                <td>{b.product_name}</td>
                <td>{dateVN(b.harvest_date)}</td>
                <td className={b.is_expired ? 'text-red-700' : ''}>{dateVN(b.expiry_date)}</td>
                <td>{qty(b.available)} {b.unit}</td>
                <td><StatusBadge map={QUALITY} value={b.quality_status} /></td>
                <td><StatusBadge map={PUBLICATION} value={b.publication_status} /></td>
                <td><StatusBadge map={SAFETY} value={b.safety_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
