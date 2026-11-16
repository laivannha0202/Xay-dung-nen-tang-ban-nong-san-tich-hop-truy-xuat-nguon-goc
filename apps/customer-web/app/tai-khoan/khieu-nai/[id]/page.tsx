import Link from 'next/link'
import { notFound } from 'next/navigation'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateTimeVN, COMPLAINT_STATUS, COMPLAINT_TYPE } from '@/lib/format'
import { ComplaintThread } from '@/components/complaint-thread'
import { PageHeader, StatusPill, SectionHeader, Icon } from '@agrimarket/ui'

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
      <PageHeader
        title={c.code}
        breadcrumb={
          <Link href="/tai-khoan/khieu-nai" className="hover:underline">
            Khiếu nại
          </Link>
        }
        description={COMPLAINT_TYPE[c.type] ?? c.type}
        actions={<StatusPill value={c.status} label={COMPLAINT_STATUS[c.status] ?? c.status} />}
      />

      <section className="card-pad space-y-1 text-sm">
        <SectionHeader title="Nội dung khiếu nại" hint={`Mở lúc ${dateTimeVN(c.created_at)}`} />
        {(c.batch_code || c.order_code) && (
          <div className="flex flex-wrap gap-2 pb-1">
            {c.batch_code && (
              <span className="chip">
                <Icon name="batch" className="h-3.5 w-3.5" /> Lô {c.batch_code}
              </span>
            )}
            {c.order_code && (
              <span className="chip">
                <Icon name="orders" className="h-3.5 w-3.5" /> Đơn {c.order_code}
              </span>
            )}
          </div>
        )}
        <p className="whitespace-pre-line text-ink-800">{c.description}</p>
        {c.resolution && (
          <div className="mt-2 rounded-lg border border-brand-100 bg-brand-50 p-3 text-ink-800">
            <span className="font-medium">Kết luận: </span>
            <span className="whitespace-pre-line">{c.resolution}</span>
          </div>
        )}
      </section>

      <ComplaintThread complaintId={c.id} initial={c.messages} closed={closed} />
    </div>
  )
}
