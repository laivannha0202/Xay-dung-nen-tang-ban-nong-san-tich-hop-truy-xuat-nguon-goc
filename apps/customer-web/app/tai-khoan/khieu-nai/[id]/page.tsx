import { notFound } from 'next/navigation'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateTimeVN, COMPLAINT_STATUS, COMPLAINT_TYPE } from '@/lib/format'
import { ComplaintThread } from '@/components/complaint-thread'
import { StatusBadge } from '@/components/ui'

interface Detail {
  id: string
  code: string
  type: string
  status: string
  description: string
  resolution: string
  batch_code: string | null
  order_code: string | null
  created_at: string
  messages: Array<{ id: string; content: string; actor_role: string; actor_name: string; created_at: string }>
}

export default async function ComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await serverFetch<Detail>(`/me/complaints/${id}`, await authCookie())
  if (!c) notFound()
  const closed = c.status === 'CLOSED'

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">{c.code}</h1>
        <StatusBadge map={COMPLAINT_STATUS} value={c.status} />
      </div>
      <section className="card space-y-1 p-4 text-sm">
        <p><span className="text-leaf-600">Loại: </span>{COMPLAINT_TYPE[c.type] ?? c.type}</p>
        {c.batch_code && <p><span className="text-leaf-600">Lô: </span>{c.batch_code}</p>}
        {c.order_code && <p><span className="text-leaf-600">Đơn: </span>{c.order_code}</p>}
        <p className="pt-2 whitespace-pre-line">{c.description}</p>
        {c.resolution && (
          <p className="mt-2 rounded-lg bg-leaf-50 p-3 text-leaf-900">
            <span className="font-medium">Kết luận: </span>{c.resolution}
          </p>
        )}
      </section>
      <ComplaintThread complaintId={c.id} initial={c.messages} closed={closed} />
      <p className="text-xs text-leaf-600">Mở lúc {dateTimeVN(c.created_at)}</p>
    </div>
  )
}
