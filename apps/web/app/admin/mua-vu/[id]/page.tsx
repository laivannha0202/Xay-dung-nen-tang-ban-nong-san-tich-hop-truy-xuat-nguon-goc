import Link from 'next/link'
import { notFound } from 'next/navigation'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateVN, dateTimeVN, ACTIVITY_LABEL } from '@/lib/format'
import { CreateForm, Field } from '@/components/admin-kit'

interface Log {
  id: string
  activity: string
  activity_at: string
  performer: string
  materials: string
  pesticide_name: string | null
  isolation_days: number | null
  note: string
}

interface Season {
  id: string
  code: string
  product_name: string
  farm_name: string
  province: string
  supplier_name: string
  variety: string
  sown_at: string
  expected_harvest_at: string
  earliest_harvest_date: string | null
  logs: Log[]
  batches: Array<{ id: string; code: string; harvest_date: string; expiry_date: string; quality_status: string }>
}

export default async function AdminSeasonDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = await serverFetch<Season>(`/admin/seasons/${id}`, await authCookie())
  if (!s) notFound()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Mùa vụ {s.code}</h1>
        <p className="text-sm text-leaf-700">
          {s.product_name}{s.variety && ` · ${s.variety}`} — {s.farm_name}, {s.province} · {s.supplier_name}
        </p>
        <p className="text-sm text-leaf-600">Gieo {dateVN(s.sown_at)} · dự kiến thu {dateVN(s.expected_harvest_at)}</p>
        {s.earliest_harvest_date && (
          <p className="mt-1 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">
            Ngày thu hoạch sớm nhất được phép (do thời gian cách ly thuốc BVTV): {dateVN(s.earliest_harvest_date)}
          </p>
        )}
      </div>

      <CreateForm
        path={`/admin/seasons/${s.id}/logs`}
        title="Ghi nhật ký canh tác"
        fields={
          <>
            <Field
              label="Hoạt động"
              name="activity"
              required
              options={Object.entries(ACTIVITY_LABEL).map(([value, label]) => ({ value, label }))}
            />
            <Field label="Ngày thực hiện" name="activity_at" type="date" required />
            <Field label="Người thực hiện" name="performer" />
            <Field label="Vật tư sử dụng" name="materials" />
            <Field label="Tên thuốc BVTV (nếu phun)" name="pesticide_name" />
            <Field label="Thời gian cách ly (ngày)" name="isolation_days" type="number" placeholder="Bắt buộc khi phun thuốc" />
            <Field label="Ghi chú" name="note" rows={2} />
          </>
        }
      />

      <section className="card overflow-x-auto p-4">
        <h2 className="mb-2 font-semibold">Nhật ký ({s.logs.length})</h2>
        <table className="table-base">
          <thead>
            <tr><th>Ngày</th><th>Hoạt động</th><th>Người</th><th>Vật tư</th><th>Cách ly</th><th>Ghi chú</th></tr>
          </thead>
          <tbody>
            {s.logs.map((l) => (
              <tr key={l.id}>
                <td>{dateVN(l.activity_at)}</td>
                <td>
                  <span className={l.activity === 'PESTICIDE' ? 'font-medium text-clay-700' : ''}>
                    {ACTIVITY_LABEL[l.activity] ?? l.activity}
                  </span>
                  {l.pesticide_name && <p className="text-xs text-leaf-600">{l.pesticide_name}</p>}
                </td>
                <td>{l.performer || '—'}</td>
                <td className="text-xs text-leaf-700">{l.materials || '—'}</td>
                <td>{l.isolation_days !== null ? `${l.isolation_days} ngày` : '—'}</td>
                <td className="text-xs text-leaf-700">{l.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card overflow-x-auto p-4">
        <h2 className="mb-2 font-semibold">Lô hàng từ mùa vụ</h2>
        {s.batches.length === 0 ? (
          <p className="text-sm text-leaf-700">Chưa có lô hàng.</p>
        ) : (
          <table className="table-base">
            <thead><tr><th>Mã lô</th><th>Thu hoạch</th><th>Hạn dùng</th><th>Chất lượng</th></tr></thead>
            <tbody>
              {s.batches.map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/admin/lo-hang/${b.id}`} className="font-medium hover:underline">{b.code}</Link></td>
                  <td>{dateVN(b.harvest_date)}</td>
                  <td>{dateVN(b.expiry_date)}</td>
                  <td>{b.quality_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Link href="/admin/lo-hang" className="btn-secondary mt-3">Tạo lô hàng</Link>
      </section>
      <p className="text-xs text-leaf-600">Cập nhật lần cuối {dateTimeVN(new Date().toISOString())}</p>
    </div>
  )
}

export const dynamic = 'force-dynamic'
