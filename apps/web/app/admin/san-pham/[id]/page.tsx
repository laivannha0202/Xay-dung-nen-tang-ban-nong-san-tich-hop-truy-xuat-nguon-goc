import Link from 'next/link'
import { notFound } from 'next/navigation'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty, dateVN, QUALITY, PUBLICATION, SAFETY } from '@/lib/format'
import { PatchForm, Field } from '@/components/admin-kit'
import { StatusBadge } from '@/components/ui'

interface Product {
  id: string
  sku: string
  slug: string
  name: string
  description: string
  storage: string
  origin_note: string
  unit: string
  base_price_vnd: number
  shelf_life_days: number
  requires_trace: boolean
  status: string
  category_id: string
  images: Array<{ url: string; alt: string }>
  batches: Array<{
    id: string
    code: string
    harvest_date: string
    expiry_date: string
    quality_status: string
    publication_status: string
    safety_status: string
    on_hand: string
    available: string
  }>
}

interface Category { id: string; name: string }

export default async function AdminProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookie = await authCookie()
  const [p, categories] = await Promise.all([
    serverFetch<Product>(`/admin/products/${id}`, cookie),
    serverFetch<Category[]>('/admin/categories', cookie),
  ])
  if (!p) notFound()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h1 className="text-xl font-semibold">{p.name}</h1>
        <span className="text-sm text-leaf-600">{p.sku}</span>
        <Link href={`/san-pham/${p.slug}`} className="text-sm underline" target="_blank">Xem trang bán</Link>
      </div>

      <PatchForm
        path={`/admin/products/${p.id}`}
        title="Thông tin sản phẩm"
        fields={
          <>
            <Field label="Danh mục" name="category_id" defaultValue={p.category_id} options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))} />
            <Field label="Tên" name="name" defaultValue={p.name} />
            <Field label="Đơn vị" name="unit" defaultValue={p.unit} />
            <Field label="Giá bán (VNĐ)" name="base_price_vnd" type="number" defaultValue={p.base_price_vnd} />
            <Field label="Hạn dùng (ngày)" name="shelf_life_days" type="number" defaultValue={p.shelf_life_days} />
            <Field label="Trạng thái" name="status" defaultValue={p.status} options={[{ value: 'ACTIVE', label: 'Đang bán' }, { value: 'INACTIVE', label: 'Ngừng bán' }]} />
            <Field label="Bắt buộc truy xuất" name="requires_trace" defaultValue={String(p.requires_trace)} options={[{ value: 'true', label: 'Có' }, { value: 'false', label: 'Không' }]} />
            <Field label="Bảo quản" name="storage" defaultValue={p.storage} />
            <Field label="Mô tả" name="description" defaultValue={p.description} rows={3} />
          </>
        }
      />

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Lô hàng của sản phẩm</h2>
        {p.batches.length === 0 ? (
          <p className="text-sm text-leaf-700">Chưa có lô hàng.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr><th>Mã lô</th><th>Thu hoạch</th><th>Hạn dùng</th><th>Tồn</th><th>Chất lượng</th><th>Công khai</th><th>An toàn</th></tr>
              </thead>
              <tbody>
                {p.batches.map((b) => (
                  <tr key={b.id}>
                    <td><Link href={`/admin/lo-hang/${b.id}`} className="font-medium hover:underline">{b.code}</Link></td>
                    <td>{dateVN(b.harvest_date)}</td>
                    <td>{dateVN(b.expiry_date)}</td>
                    <td>{qty(b.available)} {p.unit}</td>
                    <td><StatusBadge map={QUALITY} value={b.quality_status} /></td>
                    <td><StatusBadge map={PUBLICATION} value={b.publication_status} /></td>
                    <td><StatusBadge map={SAFETY} value={b.safety_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="text-xs text-leaf-600">Giá niêm yết hiện tại: {vnd(p.base_price_vnd)} / {p.unit}</p>
    </div>
  )
}

export const dynamic = 'force-dynamic'
