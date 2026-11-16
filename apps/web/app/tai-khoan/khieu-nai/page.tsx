import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateVN, COMPLAINT_STATUS } from '@/lib/format'
import { StatusBadge, Empty } from '@/components/ui'

interface Row {
  id: string
  code: string
  type: string
  status: string
  created_at: string
  batch_code: string | null
  order_code: string | null
  message_count: number
}

export default async function ComplaintsPage() {
  const list = await serverFetch<Row[]>('/me/complaints', await authCookie())
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Khiếu nại</h1>
      <p className="text-sm text-leaf-700">Bạn có thể khiếu nại từ đơn hàng hoặc trực tiếp từ trang tra cứu tem QR.</p>
      {!list || list.length === 0 ? (
        <Empty title="Chưa có khiếu nại" hint="Mọi phản hồi đều được lưu vết và trả lời trong mục này." />
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.id} className="card flex flex-wrap items-center gap-2 p-4 text-sm">
              <Link href={`/tai-khoan/khieu-nai/${c.id}`} className="font-medium hover:underline">{c.code}</Link>
              <StatusBadge map={COMPLAINT_STATUS} value={c.status} />
              <span className="text-leaf-700">{c.type}</span>
              {c.batch_code && <span className="text-xs text-leaf-600">Lô {c.batch_code}</span>}
              {c.order_code && <span className="text-xs text-leaf-600">Đơn {c.order_code}</span>}
              <span className="ml-auto text-xs text-leaf-600">{dateVN(c.created_at)} · {c.message_count} tin nhắn</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
