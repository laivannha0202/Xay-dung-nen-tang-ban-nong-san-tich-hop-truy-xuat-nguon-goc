import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateTimeVN } from '@/lib/format'
import { Act } from '@/components/admin-kit'
import { Empty } from '@/components/ui'

interface Refund {
  id: string
  order_id: string
  order_code: string
  customer_email: string
  amount_vnd: number
  reason: string
  status: string
  note: string
  created_at: string
  completed_at: string | null
}

const REFUND_STATUS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  COMPLETED: 'Đã hoàn tất',
  REJECTED: 'Từ chối',
}

export default async function AdminPayments() {
  const refunds = await serverFetch<Refund[]>('/admin/refunds', await authCookie())
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Thanh toán & hoàn tiền</h1>
      <p className="text-sm text-leaf-700">
        Xác nhận thanh toán chuyển khoản tại trang chi tiết đơn hàng. Yêu cầu hoàn tiền tạo tại đây hoặc từ trang đơn.
      </p>
      {!refunds || refunds.length === 0 ? (
        <Empty title="Chưa có yêu cầu hoàn tiền" hint="Mọi yêu cầu hoàn tiền đều được lưu vết kiểm toán." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Đơn</th><th>Khách</th><th>Số tiền</th><th>Lý do</th><th>Trạng thái</th><th>Tạo lúc</th><th></th></tr></thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/admin/don-hang/${r.order_id}`} className="font-medium hover:underline">{r.order_code}</Link></td>
                  <td className="text-xs text-leaf-700">{r.customer_email}</td>
                  <td>{vnd(r.amount_vnd)}</td>
                  <td className="max-w-56 truncate text-xs">{r.reason}</td>
                  <td>
                    <span className={`badge ${r.status === 'COMPLETED' ? 'bg-leaf-100 text-leaf-800' : r.status === 'REJECTED' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800'}`}>
                      {REFUND_STATUS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="text-xs">{dateTimeVN(r.created_at)}</td>
                  <td className="space-y-1">
                    {r.status === 'PENDING' && (
                      <>
                        <Act path={`/admin/refunds/${r.id}/approve`} label="Duyệt" className="btn-ghost text-xs" />
                        <Act path={`/admin/refunds/${r.id}/reject`} label="Từ chối" className="btn-ghost text-xs text-red-700" />
                      </>
                    )}
                    {r.status === 'APPROVED' && (
                      <Act path={`/admin/refunds/${r.id}/complete`} label="Đã chuyển tiền" className="btn-ghost text-xs" />
                    )}
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
