import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateTimeVN, COMPLAINT_STATUS, COMPLAINT_TYPE } from '@/lib/format'
import { StatusBadge, Empty } from '@/components/ui'

interface Row {
  id: string
  code: string
  type: string
  status: string
  description: string
  created_at: string
  customer_email: string
  customer_name: string | null
  batch_code: string | null
  order_code: string | null
}

export default async function AdminComplaints({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams
  const list = await serverFetch<Row[]>(`/admin/complaints${sp.status ? `?status=${sp.status}` : ''}`, await authCookie())
  const tabs = ['', 'NEW', 'PROCESSING', 'RESOLVED', 'CLOSED']
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Khiếu nại</h1>
      <div className="flex gap-1 overflow-x-auto text-sm">
        {tabs.map((t) => (
          <Link
            key={t || 'all'}
            href={t ? `/admin/khieu-nai?status=${t}` : '/admin/khieu-nai'}
            className={`badge whitespace-nowrap px-3 py-1.5 ${(sp.status ?? '') === t ? 'bg-leaf-600 text-white' : 'bg-leaf-50 text-leaf-800'}`}
          >
            {t ? COMPLAINT_STATUS[t]?.label ?? t : 'Tất cả'}
          </Link>
        ))}
      </div>
      {!list || list.length === 0 ? (
        <Empty title="Không có khiếu nại" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Mã</th><th>Khách</th><th>Loại</th><th>Lô / Đơn</th><th>Trạng thái</th><th>Lúc</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/khieu-nai/${c.id}`} className="font-medium hover:underline">{c.code}</Link>
                    <p className="max-w-64 truncate text-xs text-leaf-600">{c.description}</p>
                  </td>
                  <td className="text-xs">
                    {c.customer_name ?? '—'}<br /><span className="text-leaf-700">{c.customer_email}</span>
                  </td>
                  <td>{COMPLAINT_TYPE[c.type] ?? c.type}</td>
                  <td className="text-xs">{c.batch_code ?? '—'}{c.order_code && ` · ${c.order_code}`}</td>
                  <td><StatusBadge map={COMPLAINT_STATUS} value={c.status} /></td>
                  <td className="text-xs">{dateTimeVN(c.created_at)}</td>
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
