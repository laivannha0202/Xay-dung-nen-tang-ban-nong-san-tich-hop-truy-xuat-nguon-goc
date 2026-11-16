import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { CreateForm, Field, Act } from '@/components/admin-kit'
import { StatusBadge } from '@/components/ui'

interface Category {
  id: string
  name: string
  description: string
  status: string
  sort_order: number
  product_count: number
}

export default async function AdminCategories() {
  const list = await serverFetch<Category[]>('/admin/categories', await authCookie())
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Danh mục hàng</h1>
      <CreateForm
        path="/admin/categories"
        title="Thêm danh mục"
        fields={
          <>
            <Field label="Tên danh mục" name="name" required />
            <Field label="Thứ tự hiển thị" name="sort_order" type="number" defaultValue={0} />
            <Field label="Mô tả" name="description" rows={2} />
          </>
        }
      />
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>Tên</th><th>Mô tả</th><th>Số sản phẩm</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            {(list ?? []).map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td className="text-leaf-700">{c.description || '—'}</td>
                <td>{c.product_count}</td>
                <td>
                  <span className={`badge ${c.status === 'ACTIVE' ? 'bg-leaf-100 text-leaf-800' : 'bg-slate-100 text-slate-700'}`}>
                    {c.status === 'ACTIVE' ? 'Hiển thị' : 'Đang ẩn'}
                  </span>
                </td>
                <td>
                  <Act
                    path={`/admin/categories/${c.id}`}
                    method="PATCH"
                    body={{ status: c.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE' }}
                    label={c.status === 'ACTIVE' ? 'Ẩn' : 'Hiện'}
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
