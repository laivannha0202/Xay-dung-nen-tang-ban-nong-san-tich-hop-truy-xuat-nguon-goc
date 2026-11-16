import Link from 'next/link'
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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mùa vụ & nhật ký canh tác</h1>
      <p className="text-sm text-leaf-700">
        Nhật ký canh tác là dữ liệu công khai trên trang tra cứu. Ghi nhận phun thuốc bắt buộc kèm thời gian cách ly —
        hệ thống chặn tạo lô nếu ngày thu hoạch vi phạm.
      </p>

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

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>Mã mùa vụ</th><th>Sản phẩm</th><th>Nông trại</th><th>Gieo</th><th>Dự kiến thu</th><th>Nhật ký</th><th>Lô</th></tr>
          </thead>
          <tbody>
            {(seasons ?? []).map((s) => (
              <tr key={s.id}>
                <td><Link href={`/admin/mua-vu/${s.id}`} className="font-medium hover:underline">{s.code}</Link></td>
                <td>{s.product_name}{s.variety && <span className="text-xs text-leaf-600"> · {s.variety}</span>}</td>
                <td className="text-leaf-700">{s.farm_name}</td>
                <td>{dateVN(s.sown_at)}</td>
                <td>{dateVN(s.expected_harvest_at)}</td>
                <td>{s.log_count}</td>
                <td>{s.batch_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card p-4 text-sm text-leaf-700">
        <p className="font-medium text-leaf-800">Các loại hoạt động</p>
        <p className="mt-1">{Object.values(ACTIVITY_LABEL).join(' · ')}</p>
      </section>
    </div>
  )
}

export const dynamic = 'force-dynamic'
