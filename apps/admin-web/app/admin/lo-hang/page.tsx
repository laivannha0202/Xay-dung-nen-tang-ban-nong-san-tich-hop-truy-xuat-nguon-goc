import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { qty, dateVN, QUALITY, PUBLICATION, SAFETY } from '@/lib/format'
import { CreateForm, Field, DemoTag } from '@/components/admin-kit'
import { Toolbar } from '@/components/toolbar'
import { Badge, EmptyState, Kpi, PageHeader, SectionHeader, StatusPill } from '@agrimarket/ui'

interface Batch {
  id: string
  code: string
  product_name: string
  unit: string
  farm_name: string
  season_code: string
  harvest_date: string
  pack_date: string
  expiry_date: string
  quality_status: string
  publication_status: string
  safety_status: string
  available: string
  is_demo: boolean
  is_expired: boolean
  qr_token: string | null
}

interface Season { id: string; code: string; product_name: string; farm_name: string }

export default async function AdminBatches({
  searchParams,
}: {
  searchParams: Promise<{ quality?: string; publication?: string; safety?: string; search?: string; season?: string }>
}) {
  const sp = await searchParams
  const cookie = await authCookie()
  const qs = new URLSearchParams()
  for (const k of ['quality', 'publication', 'safety', 'search'] as const) if (sp[k]) qs.set(k, sp[k]!)
  const [list, seasons] = await Promise.all([
    serverFetch<{ data: Batch[]; total: number }>(`/admin/batches?${qs.toString()}`, cookie),
    serverFetch<Season[]>('/admin/seasons', cookie),
  ])
  const rows = list?.data ?? []
  const expired = rows.filter((b) => b.is_expired).length
  const pendingQuality = rows.filter((b) => b.quality_status === 'PENDING').length
  const unsafe = rows.filter((b) => b.safety_status !== 'NORMAL').length
  const published = rows.filter((b) => b.publication_status === 'PUBLISHED' && !b.is_expired && b.quality_status === 'PASS').length
  const filtering = Boolean(sp.quality ?? sp.publication ?? sp.safety ?? sp.search)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lô hàng & kiểm nghiệm"
        breadcrumb="Hàng hoá / Lô hàng"
        description="Mỗi lô giữ truy xuất riêng: kiểm nghiệm, an toàn và công khai quyết định lô có bán được hay không."
        actions={
          <Toolbar action="/admin/lo-hang" search={{ name: 'search', value: sp.search }} placeholder="Mã lô / sản phẩm">
            <select name="quality" defaultValue={sp.quality ?? ''} className="select">
              <option value="">Mọi chất lượng</option>
              <option value="PENDING">Chờ kiểm nghiệm</option>
              <option value="PASS">Đạt</option>
              <option value="FAIL">Không đạt</option>
            </select>
            <select name="publication" defaultValue={sp.publication ?? ''} className="select">
              <option value="">Mọi công khai</option>
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISHED">Đã công khai</option>
            </select>
          </Toolbar>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Lô đang xem" value={list?.total ?? rows.length} icon="batch" tone="info" hint={filtering ? 'Theo bộ lọc hiện tại' : 'Toàn bộ lô hàng'} />
        <Kpi label="Đang bán được" value={published} icon="products" tone="success" hint="Đạt kiểm nghiệm, đã công khai, còn hạn" />
        <Kpi label="Chờ kiểm nghiệm" value={pendingQuality} icon="shield" tone={pendingQuality ? 'warning' : 'neutral'} hint="Chưa thể công khai" />
        <Kpi label="Hết hạn / không an toàn" value={expired + unsafe} icon="alert" tone={expired + unsafe ? 'danger' : 'neutral'} hint={`${expired} hết hạn · ${unsafe} tạm giữ hoặc thu hồi`} />
      </div>

      <section className="card-pad">
        <SectionHeader title="Tạo lô hàng" hint="Lô mới vào trạng thái chờ kiểm nghiệm và chưa công khai." action={<Badge tone="neutral">{(seasons ?? []).length} mùa vụ</Badge>} />
        <CreateForm
          path="/admin/batches"
          title="Tạo lô hàng"
          preset={sp.season ? { season_id: sp.season } : undefined}
          defaultOpen={Boolean(sp.season)}
          fields={
            <>
              <Field
                label="Mùa vụ"
                name="season_id"
                required
                defaultValue={sp.season}
                options={(seasons ?? []).map((s) => ({ value: s.id, label: `${s.code} — ${s.product_name} (${s.farm_name})` }))}
              />
              <Field label="Mã lô" name="code" placeholder="Để trống để hệ thống tự sinh (LO-2026-0011)" />
              <Field label="Ngày thu hoạch" name="harvest_date" type="date" required />
              <Field label="Ngày đóng gói" name="pack_date" type="date" required />
              <Field label="Hạn dùng" name="expiry_date" type="date" required />
              <Field label="Sản lượng thu hoạch" name="harvested_qty" type="number" step="0.001" required />
              <Field label="Điều kiện bảo quản" name="storage_condition" />
              <Field label="Ghi chú" name="notes" rows={2} />
            </>
          }
        />
      </section>

      {rows.length === 0 ? (
        <EmptyState
          title={filtering ? 'Không có lô nào khớp bộ lọc' : 'Chưa có lô hàng nào'}
          hint={filtering ? 'Đổi từ khoá hoặc bỏ bộ lọc chất lượng / công khai.' : 'Tạo lô đầu tiên từ mùa vụ đã thu hoạch.'}
          icon="batch"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Mã lô</th>
                <th>Sản phẩm</th>
                <th>Thu hoạch</th>
                <th>Hạn dùng</th>
                <th className="text-right">Khả dụng</th>
                <th>Chất lượng</th>
                <th>Công khai</th>
                <th>An toàn</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className={b.is_expired ? 'opacity-60' : ''}>
                  <td>
                    <Link href={`/admin/lo-hang/${b.id}`} className="font-mono font-medium text-brand-700 hover:underline">
                      {b.code}
                    </Link>
                    {b.is_demo && <span className="ml-1.5"><DemoTag /></span>}
                    <p className="text-xs text-ink-500">
                      {b.season_code} · {b.farm_name}
                    </p>
                  </td>
                  <td className="text-ink-800">{b.product_name}</td>
                  <td className="text-xs whitespace-nowrap text-ink-600">{dateVN(b.harvest_date)}</td>
                  <td className={`text-xs whitespace-nowrap ${b.is_expired ? 'font-medium text-rose-700' : 'text-ink-600'}`}>{dateVN(b.expiry_date)}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">
                    {qty(b.available)} {b.unit}
                  </td>
                  <td>
                    <StatusPill value={b.quality_status} label={QUALITY[b.quality_status] ?? b.quality_status} />
                  </td>
                  <td>
                    <StatusPill value={b.publication_status} label={PUBLICATION[b.publication_status] ?? b.publication_status} />
                  </td>
                  <td>
                    <StatusPill value={b.safety_status} label={SAFETY[b.safety_status] ?? b.safety_status} />
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
