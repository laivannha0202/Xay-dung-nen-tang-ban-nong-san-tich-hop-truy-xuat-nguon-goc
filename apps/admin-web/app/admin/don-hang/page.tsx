import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateTimeVN, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/format'
import { StatusPill, PageHeader, EmptyState, Pager, Icon } from '@agrimarket/ui'
import { DemoTag } from '@/components/admin-kit'
import { Toolbar } from '@/components/toolbar'
import { CopyButton } from '@/components/quick-tools'

interface Row {
  id: string
  code: string
  status: string
  payment_status: string
  payment_method: string
  total_vnd: number
  placed_at: string
  customer_email: string
  customer_name: string | null
  line_count: number
  needs_reallocation: boolean
  is_demo: boolean
}

const STATUS_TABS = [
  { v: '', label: 'Tất cả' },
  { v: 'PENDING', label: 'Chờ xác nhận' },
  { v: 'CONFIRMED', label: 'Đã xác nhận' },
  { v: 'PREPARING', label: 'Chuẩn bị' },
  { v: 'SHIPPING', label: 'Đang giao' },
  { v: 'DELIVERED', label: 'Đã giao' },
  { v: 'COMPLETED', label: 'Hoàn tất' },
  { v: 'CANCELLED', label: 'Đã hủy' },
]

const PAGE_SIZE = 20

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string; from?: string; to?: string }>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1))
  const filterQs = new URLSearchParams()
  if (sp.status) filterQs.set('status', sp.status)
  if (sp.search) filterQs.set('search', sp.search)
  if (sp.from) filterQs.set('from', sp.from)
  if (sp.to) filterQs.set('to', sp.to)
  const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
  for (const [k, v] of filterQs) qs.set(k, v)
  const cookie = await authCookie()
  const [list, counts] = await Promise.all([
    serverFetch<{ data: Row[]; total: number }>(`/admin/orders?${qs}`, cookie),
    serverFetch<Record<string, number>>('/admin/orders/counts', cookie),
  ])

  const total = list?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const href = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams()
    const base = { status: sp.status, search: sp.search, from: sp.from, to: sp.to, page, ...patch }
    for (const [k, v] of Object.entries(base)) if (v !== undefined && v !== '' && !(k === 'page' && v === 1)) p.set(k, String(v))
    return `/admin/don-hang${p.size ? `?${p}` : ''}`
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Đơn hàng"
        description={`${total} đơn${sp.status ? ` · trạng thái ${ORDER_STATUS[sp.status] ?? sp.status}` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Toolbar action="/admin/don-hang" search={{ name: 'search', value: sp.search }} placeholder="Mã đơn, email, SĐT, tên khách" submitLabel="Tìm">
              {sp.status && <input type="hidden" name="status" value={sp.status} />}
              <label className="flex items-center gap-1 text-xs text-ink-600">
                Từ
                <input type="date" name="from" defaultValue={sp.from ?? ''} className="input w-[9.5rem]" />
              </label>
              <label className="flex items-center gap-1 text-xs text-ink-600">
                đến
                <input type="date" name="to" defaultValue={sp.to ?? ''} className="input w-[9.5rem]" />
              </label>
            </Toolbar>
            <a
              href={`/api/download/orders?${filterQs}`}
              className="btn-secondary btn-sm"
              title="Tải đúng danh sách đang lọc ra tệp CSV mở được bằng Excel"
            >
              <Icon name="download" className="h-3.5 w-3.5" /> CSV
            </a>
          </div>
        }
      />

      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <Link key={t.v} href={href({ status: t.v, page: 1 })} className={`chip whitespace-nowrap ${(sp.status ?? '') === t.v ? 'chip-active' : ''}`}>
            {t.label}
            {counts && (counts[t.v || 'ALL'] ?? 0) > 0 && (
              <span className="ml-1.5 text-[11px] tabular-nums opacity-70">{counts[t.v || 'ALL']}</span>
            )}
          </Link>
        ))}
      </div>

      {!list || list.data.length === 0 ? (
        <EmptyState title="Không có đơn hàng nào" hint="Đổi bộ lọc trạng thái hoặc từ khoá tìm kiếm." icon="orders" />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Đơn</th>
                  <th>Khách</th>
                  <th className="text-right">Tổng</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Đặt lúc</th>
                  <th className="w-px" aria-label="In phiếu" />
                </tr>
              </thead>
              <tbody>
                {list.data.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <span className="inline-flex items-center gap-1">
                        <Link href={`/admin/don-hang/${o.id}`} className="font-medium text-brand-700 hover:underline">{o.code}</Link>
                        <CopyButton value={o.code} label={`Sao chép mã đơn ${o.code}`} />
                      </span>
                      {o.is_demo && <span className="ml-1.5"><DemoTag /></span>}
                      <p className="text-xs text-ink-500">
                        {o.line_count} sản phẩm
                        {o.needs_reallocation && <span className="ml-1 text-sand-700">· cần đổi lô</span>}
                      </p>
                    </td>
                    <td className="text-xs">
                      <span className="block text-ink-800">{o.customer_name ?? '—'}</span>
                      <span className="text-ink-500">{o.customer_email}</span>
                    </td>
                    <td className="text-right font-medium whitespace-nowrap">{vnd(o.total_vnd)}</td>
                    <td>
                      <StatusPill value={o.payment_status} label={PAYMENT_STATUS[o.payment_status] ?? o.payment_status} />
                      <p className="mt-0.5 text-xs text-ink-500">{o.payment_method === 'COD' ? 'COD' : 'Chuyển khoản'}</p>
                    </td>
                    <td><StatusPill value={o.status} label={ORDER_STATUS[o.status] ?? o.status} /></td>
                    <td className="text-xs whitespace-nowrap text-ink-600">{dateTimeVN(o.placed_at)}</td>
                    <td><Link href={`/admin/in/giao-hang/${o.id}`} target="_blank" className="btn-ghost btn-sm" aria-label="In phiếu giao hàng" title="In phiếu giao hàng"><Icon name="print" className="h-3.5 w-3.5" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} pageCount={pageCount} makeHref={(n) => href({ page: n })} total={total} />
        </>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
