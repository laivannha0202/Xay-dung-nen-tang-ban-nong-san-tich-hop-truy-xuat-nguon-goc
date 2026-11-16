import { PageHeader, StatusPill, EmptyState, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { CreateForm, Field, Act } from '@/components/admin-kit'

interface Category {
  id: string
  name: string
  description: string
  status: string
  sort_order: number
  product_count: number
}

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Hiển thị', HIDDEN: 'Đang ẩn' }

export default async function AdminCategories() {
  const list = await serverFetch<Category[]>('/admin/categories', await authCookie())
  const rows = list ?? []
  const hidden = rows.filter((c) => c.status !== 'ACTIVE').length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Danh mục hàng"
        breadcrumb="Hàng hoá / Danh mục"
        description="Nhóm sản phẩm hiển thị trên cửa hàng. Danh mục đang ẩn vẫn giữ sản phẩm nhưng khách không thấy trong menu."
        actions={
          <div className="flex gap-2">
            <Badge tone="neutral">{rows.length} danh mục</Badge>
            {hidden > 0 && <Badge tone="warning">{hidden} đang ẩn</Badge>}
          </div>
        }
      />

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

      {rows.length === 0 ? (
        <EmptyState title="Chưa có danh mục" hint="Thêm danh mục đầu tiên để bắt đầu bày bán sản phẩm." icon="categories" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Mô tả</th>
                <th className="text-right">Sản phẩm</th>
                <th className="text-right">Thứ tự</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium text-ink-900">{c.name}</td>
                  <td className="max-w-80 text-ink-600">{c.description || '—'}</td>
                  <td className="text-right tabular-nums">{c.product_count}</td>
                  <td className="text-right tabular-nums text-ink-500">{c.sort_order}</td>
                  <td>
                    <StatusPill value={c.status} label={STATUS_LABEL[c.status]} />
                  </td>
                  <td className="text-right">
                    <Act
                      path={`/admin/categories/${c.id}`}
                      method="PATCH"
                      body={{ status: c.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE' }}
                      label={c.status === 'ACTIVE' ? 'Ẩn' : 'Hiện'}
                      className="btn-ghost btn-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
