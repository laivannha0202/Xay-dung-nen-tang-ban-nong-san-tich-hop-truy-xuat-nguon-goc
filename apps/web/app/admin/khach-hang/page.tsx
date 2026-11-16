import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateVN } from '@/lib/format'
import { Act } from '@/components/admin-kit'

interface Row {
  id: string
  email: string
  status: string
  created_at: string
  name: string | null
  phone: string | null
  order_count: number
  spent_vnd: number
}

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const sp = await searchParams
  const qs = sp.search ? `?search=${encodeURIComponent(sp.search)}` : ''
  const list = await serverFetch<{ data: Row[]; total: number }>(`/admin/customers${qs}`, await authCookie())

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">Khách hàng</h1>
        <form className="ml-auto flex gap-2" action="/admin/khach-hang">
          <input name="search" defaultValue={sp.search ?? ''} className="input" placeholder="Email hoặc tên" />
          <button className="btn-secondary">Tìm</button>
        </form>
      </div>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Khách</th><th>Đơn</th><th>Đã chi</th><th>Tham gia</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {(list?.data ?? []).map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/khach-hang/${c.id}`} className="font-medium hover:underline">{c.name ?? c.email}</Link>
                  <p className="text-xs text-leaf-600">{c.email}{c.phone && ` · ${c.phone}`}</p>
                </td>
                <td>{c.order_count}</td>
                <td>{vnd(c.spent_vnd)}</td>
                <td className="text-xs">{dateVN(c.created_at)}</td>
                <td>
                  <span className={`badge ${c.status === 'ACTIVE' ? 'bg-leaf-100 text-leaf-800' : 'bg-red-100 text-red-800'}`}>
                    {c.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td>
                  <Act
                    path={`/admin/customers/${c.id}/status`}
                    body={{ status: c.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' }}
                    label={c.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                    className="btn-ghost text-xs"
                    promptLabel={c.status === 'ACTIVE' ? 'Lý do khóa tài khoản:' : 'Lý do mở khóa:'}
                    confirmText="Phiên đăng nhập hiện tại của khách sẽ bị thu hồi ngay."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-leaf-600">{list?.total ?? 0} khách hàng</p>
    </div>
  )
}

export const dynamic = 'force-dynamic'
