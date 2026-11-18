import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateTimeVN, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/format'
import { mediaUrl } from '@/lib/config'
import { StatusPill, EmptyState, Icon } from '@agrimarket/ui'

interface Row {
  id: string
  code: string
  status: string
  payment_status: string
  total_vnd: number
  placed_at: string
  line_count: number
  items: Array<{ name: string; image: string | null }> | null
}

const TABS = [
  { v: '', label: 'Tất cả' },
  { v: 'PENDING', label: 'Chờ xác nhận' },
  { v: 'SHIPPING', label: 'Đang giao' },
  { v: 'DELIVERED', label: 'Đã giao' },
]

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>
}) {
  const sp = await searchParams
  const status = sp.status ?? ''
  const from = sp.from ?? ''
  const to = sp.to ?? ''
  const qs = new URLSearchParams()
  if (status) qs.set('status', status)
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  const list = await serverFetch<{ data: Row[]; total: number }>(
    `/me/orders${qs.size > 0 ? `?${qs}` : ''}`,
    await authCookie(),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="display text-[20px] text-ink-900">Đơn hàng của tôi</h2>
        <span className="text-xs text-ink-500">{list?.total ?? 0} đơn</span>
        <form action="/tai-khoan/don-hang" className="ml-auto flex flex-wrap items-end gap-2 text-sm">
          {status && <input type="hidden" name="status" value={status} />}
          <label className="text-xs text-ink-500">
            Từ
            <input name="from" type="date" defaultValue={from} className="input mt-0.5 w-36" />
          </label>
          <label className="text-xs text-ink-500">
            Đến
            <input name="to" type="date" defaultValue={to} className="input mt-0.5 w-36" />
          </label>
          <button className="btn-secondary btn-sm" type="submit">Lọc</button>
          {(from || to) && (
            <Link href={status ? `/tai-khoan/don-hang?status=${status}` : '/tai-khoan/don-hang'} className="btn-ghost btn-sm">
              Xoá
            </Link>
          )}
        </form>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Link
            key={t.v}
            href={t.v ? `/tai-khoan/don-hang?status=${t.v}` : '/tai-khoan/don-hang'}
            className={`chip whitespace-nowrap ${status === t.v ? 'chip-active' : ''}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {!list || list.data.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng"
          hint="Đơn đặt trên website và ứng dụng đều hiển thị ở đây."
          icon="orders"
          action={<Link href="/san-pham" className="btn-primary mt-2">Mua nông sản</Link>}
        />
      ) : (
        <ul className="space-y-3">
          {list.data.map((o) => (
            <li key={o.id} className="rounded-[var(--radius-panel)] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/tai-khoan/don-hang/${o.id}`} className="font-medium text-brand-700 hover:underline">{o.code}</Link>
                <StatusPill value={o.status} label={ORDER_STATUS[o.status] ?? o.status} />
                <StatusPill value={o.payment_status} label={PAYMENT_STATUS[o.payment_status] ?? o.payment_status} />
                <span className="ml-auto text-[15px] font-semibold text-ink-900 tabular-nums">{vnd(o.total_vnd)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                {dateTimeVN(o.placed_at)} · {o.line_count} sản phẩm
              </p>
              {(o.items?.length ?? 0) > 0 && (
                <div className="mt-2 flex gap-1.5 overflow-x-auto">
                  {o.items!.map((it, i) => (
                    <span key={i} className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-tile)] bg-ivory-100">
                      {it.image ? (
                        <img src={mediaUrl(it.image) ?? ''} alt={it.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full place-items-center text-brand-300">
                          <Icon name="leaf" className="h-4 w-4" />
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
