import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader, Kpi, SectionHeader, StatusPill, EmptyState, Alert, Badge } from '@agrimarket/ui'
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

const QUALITY_LABEL: Record<string, string> = {
  PASS: 'Đạt',
  FAIL: 'Không đạt',
  NORMAL: 'Bình thường',
  HOLD: 'Tạm giữ',
  RECALLED: 'Đã thu hồi',
}

export default async function AdminSeasonDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = await serverFetch<Season>(`/admin/seasons/${id}`, await authCookie())
  if (!s) notFound()

  const pesticideLogs = s.logs.filter((l) => l.activity === 'PESTICIDE').length

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Mùa vụ ${s.code}`}
        breadcrumb={
          <Link href="/admin/mua-vu" className="hover:underline">
            Mùa vụ / {s.code}
          </Link>
        }
        description={`${s.product_name}${s.variety ? ` · ${s.variety}` : ''} — ${s.farm_name}, ${s.province} · ${s.supplier_name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">Gieo {dateVN(s.sown_at)}</Badge>
            <Badge tone="info">Dự kiến thu {dateVN(s.expected_harvest_at)}</Badge>
          </div>
        }
      />

      {s.earliest_harvest_date && (
        <Alert tone="warning">
          Ngày thu hoạch sớm nhất được phép (do thời gian cách ly thuốc BVTV):{' '}
          <span className="font-medium">{dateVN(s.earliest_harvest_date)}</span>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Nhật ký" value={s.logs.length} icon="report" tone="brand" />
        <Kpi label="Lần phun thuốc" value={pesticideLogs} icon="shield" tone={pesticideLogs ? 'warning' : 'success'} hint={pesticideLogs ? 'Có ghi nhận thời gian cách ly' : 'Chưa phun thuốc BVTV'} />
        <Kpi label="Lô hàng" value={s.batches.length} icon="batch" tone="info" hint="Sinh ra từ mùa vụ này" />
        <Kpi label="Nông trại" value={s.farm_name} icon="leaf" tone="neutral" hint={s.supplier_name} />
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

      <section className="card overflow-x-auto">
        <div className="p-4">
          <SectionHeader title="Nhật ký canh tác" hint={`${s.logs.length} bản ghi`} />
        </div>
        {s.logs.length === 0 ? (
          <div className="px-4 pb-4">
            <EmptyState title="Chưa có nhật ký" hint="Ghi hoạt động đầu tiên để mùa vụ xuất hiện trên trang tra cứu." icon="report" />
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Hoạt động</th>
                <th>Người</th>
                <th>Vật tư</th>
                <th className="text-right">Cách ly</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {s.logs.map((l) => (
                <tr key={l.id}>
                  <td className="tabular-nums">{dateVN(l.activity_at)}</td>
                  <td className={l.activity === 'PESTICIDE' ? 'font-medium text-amber-800' : 'font-medium text-ink-900'}>
                    {ACTIVITY_LABEL[l.activity] ?? l.activity}
                    {l.pesticide_name && <p className="text-xs font-normal text-ink-500">{l.pesticide_name}</p>}
                  </td>
                  <td>{l.performer || '—'}</td>
                  <td className="text-xs text-ink-600">{l.materials || '—'}</td>
                  <td className="text-right tabular-nums">{l.isolation_days !== null ? `${l.isolation_days} ngày` : '—'}</td>
                  <td className="text-xs text-ink-600">{l.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card overflow-x-auto">
        <div className="p-4">
          <SectionHeader
            title="Lô hàng từ mùa vụ"
            hint={`${s.batches.length} lô`}
            action={
              <Link href="/admin/lo-hang" className="btn-secondary btn-sm">
                Tạo lô hàng
              </Link>
            }
          />
        </div>
        {s.batches.length === 0 ? (
          <div className="px-4 pb-4">
            <EmptyState title="Chưa có lô hàng" hint="Thu hoạch xong thì tạo lô để in tem truy xuất." icon="batch" />
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Mã lô</th>
                <th>Thu hoạch</th>
                <th>Hạn dùng</th>
                <th>Chất lượng</th>
              </tr>
            </thead>
            <tbody>
              {s.batches.map((b) => (
                <tr key={b.id}>
                  <td className="font-medium text-ink-900">
                    <Link href={`/admin/lo-hang/${b.id}`} className="hover:underline">{b.code}</Link>
                  </td>
                  <td className="tabular-nums">{dateVN(b.harvest_date)}</td>
                  <td className="tabular-nums">{dateVN(b.expiry_date)}</td>
                  <td>
                    <StatusPill value={b.quality_status} label={QUALITY_LABEL[b.quality_status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-ink-500">Cập nhật lần cuối {dateTimeVN(new Date().toISOString())}</p>
    </div>
  )
}

export const dynamic = 'force-dynamic'
