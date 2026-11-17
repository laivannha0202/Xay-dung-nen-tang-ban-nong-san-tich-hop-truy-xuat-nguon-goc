import Link from 'next/link'
import { PageHeader, Kpi, StatusPill, EmptyState, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty } from '@/lib/format'
import { CreateForm, Field, Act, DemoTag } from '@/components/admin-kit'
import { Toolbar } from '@/components/toolbar'

interface Product {
  id: string
  sku: string
  slug: string
  name: string
  unit: string
  base_price_vnd: number
  status: string
  requires_trace: boolean
  shelf_life_days: number
  category_name: string
  image: string | null
  available: string
  batch_count: number
  is_demo: boolean
}

interface Category { id: string; name: string }

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Đang bán', INACTIVE: 'Ngừng bán' }

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const sp = await searchParams
  const cookie = await authCookie()
  const qs = sp.search ? `?search=${encodeURIComponent(sp.search)}` : ''
  const [list, categories] = await Promise.all([
    serverFetch<{ data: Product[]; total: number }>(`/admin/products${qs}`, cookie),
    serverFetch<Category[]>('/admin/categories', cookie),
  ])
  const rows = list?.data ?? []
  const selling = rows.filter((p) => p.status === 'ACTIVE').length
  const outOfStock = rows.filter((p) => Number(p.available) <= 0).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sản phẩm"
        breadcrumb="Hàng hoá / Sản phẩm"
        description="Danh mục bán, giá niêm yết và lượng hàng còn bán được. Ngừng bán không xoá sản phẩm khỏi đơn cũ."
        actions={
          <Toolbar action="/admin/san-pham" search={{ name: 'search', value: sp.search }} placeholder="Tên hoặc SKU" submitLabel="Tìm" />
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Tổng sản phẩm" value={list?.total ?? rows.length} icon="products" tone="info" />
        <Kpi label="Đang bán" value={selling} icon="check" tone="success" hint={`${rows.length - selling} ngừng bán trong trang`} />
        <Kpi label="Hết hàng" value={outOfStock} icon="alert" tone={outOfStock ? 'warning' : 'neutral'} hint="Khả dụng bằng 0" />
        <Kpi label="Danh mục" value={(categories ?? []).length} icon="categories" tone="neutral" />
      </div>

      <CreateForm
        path="/admin/products"
        title="Thêm sản phẩm"
        fields={
          <>
            <Field label="Danh mục" name="category_id" required options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))} />
            <Field label="SKU" name="sku" required placeholder="VD: SP-CA-CHUA" />
            <Field label="Tên sản phẩm" name="name" required />
            <Field label="Đơn vị" name="unit" defaultValue="kg" required />
            <Field label="Giá bán (VNĐ)" name="base_price_vnd" type="number" required />
            <Field label="Hạn dùng (ngày)" name="shelf_life_days" type="number" defaultValue={7} required />
            <Field label="Bắt buộc truy xuất" name="requires_trace" options={[{ value: 'true', label: 'Có' }, { value: 'false', label: 'Không' }]} />
            <Field label="Cách bảo quản" name="storage" placeholder="VD: 2–5°C" />
            <Field label="Xuất xứ" name="origin_note" />
            <Field label="Mô tả" name="description" rows={3} />
          </>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title={sp.search ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm'}
          hint={sp.search ? `Không có kết quả cho “${sp.search}”. Thử từ khoá khác hoặc xoá bộ lọc.` : 'Thêm sản phẩm đầu tiên rồi tạo lô hàng để bán.'}
          icon="products"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th className="text-right">Giá</th>
                <th className="text-right">Khả dụng</th>
                <th className="text-right">Lô</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/san-pham/${p.id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline">
                      {p.name}
                    </Link>
                    {p.is_demo && <span className="ml-1.5"><DemoTag /></span>}
                    <p className="text-xs text-ink-500">{p.sku} · {p.unit} · HSD {p.shelf_life_days} ngày</p>
                  </td>
                  <td className="text-ink-600">{p.category_name}</td>
                  <td className="text-right tabular-nums">
                    {vnd(p.base_price_vnd)}
                    {p.requires_trace && <p className="text-xs text-ink-500">Bắt buộc truy xuất</p>}
                  </td>
                  <td className="text-right tabular-nums">
                    {qty(p.available)} {p.unit}
                    {Number(p.available) <= 0 && <p className="text-xs text-rose-600">Hết hàng</p>}
                  </td>
                  <td className="text-right tabular-nums text-ink-500">{p.batch_count}</td>
                  <td>
                    <StatusPill value={p.status} label={STATUS_LABEL[p.status]} />
                  </td>
                  <td className="text-right">
                    <Act
                      path={`/admin/products/${p.id}`}
                      method="PATCH"
                      body={{ status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }}
                      label={p.status === 'ACTIVE' ? 'Ngừng bán' : 'Mở bán'}
                      className="btn-ghost btn-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-ink-500">{list?.total ?? rows.length} sản phẩm</p>
    </div>
  )
}

export const dynamic = 'force-dynamic'
