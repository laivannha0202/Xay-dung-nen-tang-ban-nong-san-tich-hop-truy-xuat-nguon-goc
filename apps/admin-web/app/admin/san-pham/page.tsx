import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty } from '@/lib/format'
import { CreateForm, Field, Act } from '@/components/admin-kit'

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
}

interface Category { id: string; name: string }

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const sp = await searchParams
  const cookie = await authCookie()
  const qs = sp.search ? `?search=${encodeURIComponent(sp.search)}` : ''
  const [list, categories] = await Promise.all([
    serverFetch<{ data: Product[]; total: number }>(`/admin/products${qs}`, cookie),
    serverFetch<Category[]>('/admin/categories', cookie),
  ])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Sản phẩm</h1>
        <form className="ml-auto flex gap-2" action="/admin/san-pham">
          <input name="search" defaultValue={sp.search ?? ''} className="input" placeholder="Tên hoặc SKU" />
          <button className="btn-secondary">Tìm</button>
        </form>
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

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Khả dụng</th><th>Lô</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            {(list?.data ?? []).map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/san-pham/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                  <p className="text-xs text-leaf-600">{p.sku} · {p.unit} · HSD {p.shelf_life_days} ngày</p>
                </td>
                <td className="text-leaf-700">{p.category_name}</td>
                <td>{vnd(p.base_price_vnd)}</td>
                <td>{qty(p.available)} {p.unit}</td>
                <td>{p.batch_count}</td>
                <td>
                  <span className={`badge ${p.status === 'ACTIVE' ? 'bg-leaf-100 text-leaf-800' : 'bg-slate-100 text-slate-700'}`}>
                    {p.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}
                  </span>
                </td>
                <td>
                  <Act
                    path={`/admin/products/${p.id}`}
                    method="PATCH"
                    body={{ status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }}
                    label={p.status === 'ACTIVE' ? 'Ngừng bán' : 'Mở bán'}
                    className="btn-ghost text-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
