import Link from 'next/link'
import { PageHeader, Kpi, StatusPill, EmptyState, Badge, Icon } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { CreateForm, Field, Act, Uploader, DemoTag } from '@/components/admin-kit'

interface Supplier {
  id: string
  code: string
  name: string
  business_type: string
  contact_name: string
  contact_phone: string
  contact_email: string
  status: string
  farm_count: number
}

interface Farm {
  id: string
  supplier_id: string
  name: string
  province: string
  district: string
  commune: string
  address_detail: string
  area_ha: string
  crops: string
  manager_name: string
  manager_phone: string
  status: string
  is_demo: boolean
  supplier_name: string
  season_count: number
}

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng' }

export default async function AdminSuppliers() {
  const cookie = await authCookie()
  const [suppliers, farms] = await Promise.all([
    serverFetch<Supplier[]>('/admin/suppliers', cookie),
    serverFetch<Farm[]>('/admin/farms', cookie),
  ])
  const activeSuppliers = (suppliers ?? []).filter((s) => s.status === 'ACTIVE')
  const farmRows = farms ?? []
  const totalArea = farmRows.reduce((sum, f) => sum + Number(f.area_ha ?? 0), 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Nhà cung cấp & nông trại"
        breadcrumb="Chuỗi cung ứng / Nhà cung cấp"
        description="Hồ sơ nhà cung cấp, nông trại và vùng trồng. Tài liệu nông trại tải lên tại đây được dùng cho hồ sơ truy xuất."
        actions={
          <div className="flex gap-2">
            <Badge tone="neutral">{activeSuppliers.length} đang hoạt động</Badge>
            <Badge tone="neutral">{farmRows.length} nông trại</Badge>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Nhà cung cấp" value={(suppliers ?? []).length} icon="supplier" tone="info" />
        <Kpi label="Đang hoạt động" value={activeSuppliers.length} icon="check" tone="success" hint={`${(suppliers ?? []).length - activeSuppliers.length} ngừng hợp tác`} />
        <Kpi label="Nông trại" value={farmRows.length} icon="leaf" tone="warning" hint={`${farmRows.filter((f) => f.status === 'ACTIVE').length} đang hoạt động`} />
        <Kpi label="Tổng diện tích" value={`${totalArea.toFixed(2)} ha`} icon="pin" tone="neutral" />
      </div>

      {/* min-w-0: the supplier table inside must scroll, not stretch the grid track. */}
      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <section className="space-y-3">
          <CreateForm
            path="/admin/suppliers"
            title="Thêm nhà cung cấp"
            fields={
              <>
                <Field label="Mã" name="code" required placeholder="VD: NCC-03" />
                <Field label="Tên" name="name" required />
                <Field label="Loại hình" name="business_type" defaultValue="Hợp tác xã" />
                <Field label="Người liên hệ" name="contact_name" />
                <Field label="Điện thoại" name="contact_phone" />
                <Field label="Email" name="contact_email" type="email" />
              </>
            }
          />
          {suppliers && suppliers.length === 0 ? (
            <EmptyState title="Chưa có nhà cung cấp" hint="Thêm nhà cung cấp đầu tiên để khai báo nông trại." icon="supplier" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Nhà cung cấp</th>
                    <th className="text-right">Nông trại</th>
                    <th className="hidden sm:table-cell">Liên hệ</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(suppliers ?? []).map((s) => (
                    <tr key={s.id}>
                      <td className="font-medium text-ink-900">
                        {s.name}
                        <p className="text-xs font-normal text-ink-500">{s.code} · {s.business_type}</p>
                      </td>
                      <td className="text-right tabular-nums">{s.farm_count}</td>
                      <td className="hidden text-xs text-ink-600 sm:table-cell">{s.contact_name || '—'}<br />{s.contact_phone || '—'}</td>
                      <td>
                        <StatusPill value={s.status} label={STATUS_LABEL[s.status]} />
                      </td>
                      <td className="text-right">
                        <Act
                          path={`/admin/suppliers/${s.id}`}
                          method="PATCH"
                          body={{ status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }}
                          label={s.status === 'ACTIVE' ? 'Ngừng' : 'Kích hoạt'}
                          className="btn-ghost btn-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <CreateForm
            path="/admin/farms"
            title="Thêm nông trại"
            fields={
              <>
                <Field label="Nhà cung cấp" name="supplier_id" required options={activeSuppliers.map((s) => ({ value: s.id, label: s.name }))} />
                <Field label="Tên nông trại" name="name" required />
                <Field label="Tỉnh/Thành" name="province" required />
                <Field label="Quận/Huyện" name="district" required />
                <Field label="Xã/Phường" name="commune" required />
                <Field label="Địa chỉ chi tiết" name="address_detail" />
                <Field label="Diện tích (ha)" name="area_ha" type="number" step="0.01" />
                <Field label="Cây trồng" name="crops" />
                <Field label="Người phụ trách" name="manager_name" />
                <Field label="Điện thoại" name="manager_phone" />
              </>
            }
          />
          {farms && farms.length === 0 ? (
            <EmptyState title="Chưa có nông trại" hint="Khai báo vùng trồng để bắt đầu ghi nhật ký canh tác." icon="leaf" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Nông trại</th>
                    <th className="hidden sm:table-cell">Địa chỉ</th>
                    <th className="text-right">Mùa vụ</th>
                    <th>Trạng thái</th>
                    <th>Hồ sơ</th>
                  </tr>
                </thead>
                <tbody>
                  {(farms ?? []).map((f) => (
                    <tr key={f.id}>
                      <td className="font-medium text-ink-900">
                        {f.name}
                        {f.is_demo && <span className="ml-1.5"><DemoTag /></span>}
                        <p className="text-xs font-normal text-ink-500">{f.supplier_name} · {f.area_ha} ha</p>
                      </td>
                      <td className="hidden text-xs text-ink-600 sm:table-cell">{f.commune}, {f.district}, {f.province}</td>
                      <td className="text-right tabular-nums">{f.season_count}</td>
                      <td>
                        <StatusPill value={f.status} label={STATUS_LABEL[f.status]} />
                      </td>
                      <td className="flex items-center gap-1">
                        <Link href={`/admin/mua-vu?farm=${f.id}`} className="btn-ghost btn-sm" title="Tạo mùa vụ cho nông trại này">
                          <Icon name="plus" className="h-3.5 w-3.5" /> Mùa vụ
                        </Link>
                        <Uploader ownerType="FARM" ownerId={f.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
