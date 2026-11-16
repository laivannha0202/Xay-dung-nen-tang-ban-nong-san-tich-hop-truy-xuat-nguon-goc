import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateTimeVN } from '@/lib/format'
import { Empty } from '@/components/ui'

interface Recall {
  id: string
  reason: string
  severity: string
  status: string
  started_at: string
  closed_at: string | null
  batch_code: string
  product_name: string
  affected_count: number
}

const SEVERITY: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Thấp', className: 'bg-amber-100 text-amber-800' },
  MEDIUM: { label: 'Trung bình', className: 'bg-orange-100 text-orange-800' },
  HIGH: { label: 'Nghiêm trọng', className: 'bg-red-100 text-red-800' },
}

export default async function AdminRecalls() {
  const list = await serverFetch<Recall[]>('/admin/recalls', await authCookie())
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Thu hồi lô hàng</h1>
      <p className="text-sm text-leaf-700">
        Tạo đợt thu hồi từ trang chi tiết lô hàng. Hệ thống tự chặn bán, giải phóng đơn chưa xuất và lập danh sách
        khách đã nhận lô.
      </p>
      {!list || list.length === 0 ? (
        <Empty title="Chưa có đợt thu hồi" hint="Mọi đợt thu hồi đều được lưu vết tại đây." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr><th>Lô</th><th>Lý do</th><th>Mức độ</th><th>Khách ảnh hưởng</th><th>Bắt đầu</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/thu-hoi/${r.id}`} className="font-medium hover:underline">{r.batch_code}</Link>
                    <p className="text-xs text-leaf-600">{r.product_name}</p>
                  </td>
                  <td className="max-w-64 truncate text-leaf-800">{r.reason}</td>
                  <td><span className={`badge ${SEVERITY[r.severity]?.className ?? ''}`}>{SEVERITY[r.severity]?.label ?? r.severity}</span></td>
                  <td>{r.affected_count}</td>
                  <td className="text-xs">{dateTimeVN(r.started_at)}</td>
                  <td>
                    <span className={`badge ${r.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
                      {r.status === 'OPEN' ? 'Đang xử lý' : 'Đã kết thúc'}
                    </span>
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
