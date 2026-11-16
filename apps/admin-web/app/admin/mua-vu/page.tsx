import Link from 'next/link'
import { PageHeader, Kpi, SectionHeader, EmptyState, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateVN, ACTIVITY_LABEL } from '@/lib/format'
import { CreateForm, Field } from '@/components/admin-kit'

interface Season {
  id: string
  code: string
  farm_name: string
  product_name: string
  variety: string
  area_ha: string
  sown_at: string
  expected_harvest_at: string
  batch_count: number
  log_count: number
}

interface Farm { id: string; name: string; status: string }
interface Product { id: string; name: string }

export default async function AdminSeasons() {
  const cookie = await authCookie()
  const [seasons, farms, products] = await Promise.all([
    serverFetch<Season[]>('/admin/seasons', cookie),
    serverFetch<Farm[]>('/admin/farms', cookie),
    serverFetch<{ data: Product[] }>('/admin/products?pageSize=100', cookie),
  ])
  const rows = seasons ?? []
  const totalArea = rows.reduce((sum, s) => sum + Number(s.area_ha ?? 0), 0)
  const totalLogs = rows.reduce((sum, s) => sum + s.log_count, 0)
  const totalBatches = rows.reduce((sum, s) => sum + s.batch_count, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mùa vụ & nhật ký canh tác"
        breadcrumb="Chuỗi cung ứng / Mùa vụ"
        description="Nhật ký canh tác là dữ liệu công khai trên trang tra cứu. Ghi nhận phun thuốc bắt buộc kèm thời gian cách ly — hệ thống chặn tạo lô nếu ngày thu hoạch vi phạm."
        actions={<Badge tone="neutral">{rows.length} mùa vụ</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Mùa vụ" value={rows.length} icon="season" tone="brand" />
        <Kpi label="Diện tích gieo trồng" value={`${totalArea.toFixed(2)} ha`} icon="pin" tone="info" />
        <Kpi label="Nhật ký canh tác" value={totalLogs} icon="report" tone="success" hint="Đã ghi nhận trên tất cả mùa vụ" />
        <Kpi label="Lô hàng" value={totalBatches} icon="batch" tone="warning" hint="Sinh ra từ các mùa vụ này" />
      </div>

      <CreateForm
        path="/admin/seasons"
        title="Thêm mùa vụ"
        fields={
          <>
            <Field label="Nông trại" name="farm_id" required options={(farms ?? []).filter((f) => f.status === 'ACTIVE').map((f) => ({ value: f.id, label: f.name }))} />
            <Field label="Sản phẩm" name="product_id" required options={(products?.data ?? []).map((p) => ({ value: p.id, label: p.name }))} />
            <Field label="Giống" name="variety" />
            <Field label="Diện tích (ha)" name="area_ha" type="number" step="0.01" />
            <Field label="Ngày gieo" name="sown_at" type="date" required />
            <Field label="Dự kiến thu hoạch" name="expected_harvest_at" type="date" required />
          </>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="Chưa có mùa vụ" hint="Tạo mùa vụ đầu tiên để bắt đầu ghi nhật ký canh tác." icon="season" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Mã mùa vụ</th>
                <th>Sản phẩm</th>
                <th>Nông trại</th>
                <th>Gieo</th>
                <th>Dự kiến thu</th>
                <th className="text-right">Nhật ký</th>
                <th className="text-right">Lô</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-ink-900">
                    <Link href={`/admin/mua-vu/${s.id}`} className="hover:underline">{s.code}</Link>
                  </td>
                  <td>
                    {s.product_name}
                    {s.variety && <span className="text-xs text-ink-500"> · {s.variety}</span>}
                  </td>
                  <td className="text-ink-600">{s.farm_name}</td>
                  <td className="tabular-nums">{dateVN(s.sown_at)}</td>
                  <td className="tabular-nums">{dateVN(s.expected_harvest_at)}</td>
                  <td className="text-right tabular-nums">{s.log_count}</td>
                  <td className="text-right tabular-nums">{s.batch_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="card-pad">
        <SectionHeader title="Các loại hoạt động" hint="Dùng khi ghi nhật ký canh tác cho từng mùa vụ." />
        <p className="text-sm text-ink-600">{Object.values(ACTIVITY_LABEL).join(' · ')}</p>
      </section>
    </div>
  )
}

export const dynamic = 'force-dynamic'
