import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader, Kpi, StatusPill, SectionHeader, EmptyState, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty, dateVN, QUALITY, PUBLICATION, SAFETY } from '@/lib/format'
import { PatchForm, Field } from '@/components/admin-kit'
import { ProductImages } from '@/components/product-images'

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

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Đang bán', INACTIVE: 'Ngừng bán' }

export default async function AdminProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookie = await authCookie()
  const [p, categories] = await Promise.all([
    serverFetch<Product>(`/admin/products/${id}`, cookie),
    serverFetch<Category[]>('/admin/categories', cookie),
  ])
  if (!p) notFound()

  const available = p.batches.reduce((sum, b) => sum + Number(b.available ?? 0), 0)
  const held = p.batches.filter((b) => b.safety_status !== 'NORMAL').length

  return (
    <div className="space-y-5">
      <PageHeader
        title={p.name}
        breadcrumb={`Hàng hoá / Sản phẩm / ${p.sku}`}
        description={`${p.sku} · ${p.unit} · hạn dùng ${p.shelf_life_days} ngày · ${vnd(p.base_price_vnd)} / ${p.unit}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill value={p.status} label={STATUS_LABEL[p.status]} />
            {p.requires_trace && <Badge tone="info">Bắt buộc truy xuất</Badge>}
            <Link href={`/san-pham/${p.slug}`} className="btn-ghost btn-sm" target="_blank">Xem trang bán</Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Lô hàng" value={p.batches.length} icon="batch" tone="info" />
        <Kpi label="Khả dụng" value={`${qty(available)} ${p.unit}`} icon="warehouse" tone="success" hint="Cộng dồn các lô" />
        <Kpi label="Lô bị giữ" value={held} icon="shield" tone={held ? 'warning' : 'neutral'} hint="An toàn khác bình thường" />
        <Kpi label="Ảnh" value={(p.images ?? []).length} icon="products" tone="neutral" />
      </div>

      <section className="card-pad">
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
      </section>

      <section className="card-pad">
        <SectionHeader title="Ảnh sản phẩm" hint="Ảnh đầu tiên là ảnh đại diện trên cửa hàng." />
        <ProductImages productId={p.id} initial={p.images ?? []} />
      </section>

      <section className="card-pad">
        <SectionHeader title="Lô hàng của sản phẩm" hint="Chất lượng, công khai và trạng thái an toàn của từng lô." />
        {p.batches.length === 0 ? (
          <EmptyState title="Chưa có lô hàng" hint="Nhập lô mới để bắt đầu bán sản phẩm này." icon="batch" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Mã lô</th>
                  <th>Thu hoạch</th>
                  <th>Hạn dùng</th>
                  <th className="text-right">Tồn</th>
                  <th>Chất lượng</th>
                  <th>Công khai</th>
                  <th>An toàn</th>
                </tr>
              </thead>
              <tbody>
                {p.batches.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link href={`/admin/lo-hang/${b.id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline">
                        {b.code}
                      </Link>
                    </td>
                    <td className="text-xs text-ink-600">{dateVN(b.harvest_date)}</td>
                    <td className="text-xs text-ink-600">{dateVN(b.expiry_date)}</td>
                    <td className="text-right tabular-nums">{qty(b.available)} {p.unit}</td>
                    <td><StatusPill value={b.quality_status} label={QUALITY[b.quality_status]} /></td>
                    <td><StatusPill value={b.publication_status} label={PUBLICATION[b.publication_status]} /></td>
                    <td><StatusPill value={b.safety_status} label={SAFETY[b.safety_status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-ink-500">Giá niêm yết hiện tại: {vnd(p.base_price_vnd)} / {p.unit}</p>
    </div>
  )
}

export const dynamic = 'force-dynamic'
