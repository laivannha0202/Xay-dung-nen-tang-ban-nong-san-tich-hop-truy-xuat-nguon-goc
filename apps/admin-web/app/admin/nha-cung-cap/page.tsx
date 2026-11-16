import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { CreateForm, Field, Act, Uploader } from '@/components/admin-kit'

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
  supplier_name: string
  season_count: number
}

export default async function AdminSuppliers() {
  const cookie = await authCookie()
  const [suppliers, farms] = await Promise.all([
    serverFetch<Supplier[]>('/admin/suppliers', cookie),
    serverFetch<Farm[]>('/admin/farms', cookie),
  ])
  const activeSuppliers = (suppliers ?? []).filter((s) => s.status === 'ACTIVE')

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Nhà cung cấp & nông trại</h1>

      <div className="grid gap-4 lg:grid-cols-2">
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
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Nhà cung cấp</th><th>Nông trại</th><th>Liên hệ</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                {(suppliers ?? []).map((s) => (
                  <tr key={s.id}>
                    <td>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-leaf-600">{s.code} · {s.business_type}</p>
                    </td>
                    <td>{s.farm_count}</td>
                    <td className="text-xs text-leaf-700">{s.contact_name}<br />{s.contact_phone}</td>
                    <td>
                      <span className={`badge ${s.status === 'ACTIVE' ? 'bg-leaf-100 text-leaf-800' : 'bg-slate-100 text-slate-700'}`}>
                        {s.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng'}
                      </span>
                    </td>
                    <td>
                      <Act
                        path={`/admin/suppliers/${s.id}`}
                        method="PATCH"
                        body={{ status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }}
                        label={s.status === 'ACTIVE' ? 'Ngừng' : 'Kích hoạt'}
                        className="btn-ghost text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Nông trại</th><th>Địa chỉ</th><th>Mùa vụ</th><th>Trạng thái</th><th>Hồ sơ</th></tr></thead>
              <tbody>
                {(farms ?? []).map((f) => (
                  <tr key={f.id}>
                    <td>
                      <p className="font-medium">{f.name}</p>
                      <p className="text-xs text-leaf-600">{f.supplier_name} · {f.area_ha} ha</p>
                    </td>
                    <td className="text-xs text-leaf-700">{f.commune}, {f.district}, {f.province}</td>
                    <td>{f.season_count}</td>
                    <td>
                      <span className={`badge ${f.status === 'ACTIVE' ? 'bg-leaf-100 text-leaf-800' : 'bg-slate-100 text-slate-700'}`}>
                        {f.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng'}
                      </span>
                    </td>
                    <td>
                      <Uploader ownerType="FARM" ownerId={f.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
