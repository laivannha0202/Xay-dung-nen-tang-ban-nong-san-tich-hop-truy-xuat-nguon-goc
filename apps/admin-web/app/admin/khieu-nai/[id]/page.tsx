import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader, StatusPill, SectionHeader, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateTimeVN, COMPLAINT_STATUS, COMPLAINT_TYPE } from '@/lib/format'
import { mediaUrl } from '@/lib/config'
import { AdminComplaintConsole } from '@/components/admin-complaint-console'

interface Detail {
  id: string
  code: string
  type: string
  status: string
  description: string
  resolution: string
  created_at: string
  customer_email: string
  customer_name: string | null
  customer_phone: string | null
  batch_code: string | null
  batch_id: string | null
  order_code: string | null
  order_id: string | null
  recall_id: string | null
  messages: Array<{ id: string; content: string; actor_role: string; actor_name: string; created_at: string }>
  files: Array<{ id: string; url: string; mime: string }>
}

export default async function AdminComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await serverFetch<Detail>(`/admin/complaints/${id}`, await authCookie())
  if (!c) notFound()

  return (
    <div className="space-y-5">
      <PageHeader
        title={c.code}
        breadcrumb="Hậu mãi / Khiếu nại / Chi tiết"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill value={c.status} label={COMPLAINT_STATUS[c.status]} />
            <Badge tone="neutral">{COMPLAINT_TYPE[c.type] ?? c.type}</Badge>
            <Badge tone="neutral">Mở lúc {dateTimeVN(c.created_at)}</Badge>
          </div>
        }
        description={
          <>
            {c.customer_name ?? '—'} ({c.customer_email}
            {c.customer_phone && `, ${c.customer_phone}`})
            {c.batch_id && (
              <>
                {' · Lô '}
                <Link href={`/admin/lo-hang/${c.batch_id}`} className="text-brand-700 hover:underline">
                  {c.batch_code}
                </Link>
              </>
            )}
            {c.order_id && (
              <>
                {' · Đơn '}
                <Link href={`/admin/don-hang/${c.order_id}`} className="text-brand-700 hover:underline">
                  {c.order_code}
                </Link>
              </>
            )}
            {c.recall_id && (
              <>
                {' · '}
                <Link href={`/admin/thu-hoi/${c.recall_id}`} className="text-brand-700 hover:underline">
                  Đợt thu hồi
                </Link>
              </>
            )}
          </>
        }
      />

      <section className="card-pad">
        <SectionHeader title="Nội dung khách gửi" />
        <p className="whitespace-pre-line text-sm text-ink-800">{c.description}</p>
        {c.files.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {c.files.map((f) => (
              <li key={f.id}>
                <a href={mediaUrl(f.url) ?? f.url} target="_blank" rel="noreferrer" title="Mở ảnh đầy đủ">
                  <img src={mediaUrl(f.url) ?? f.url} alt="Ảnh khiếu nại" className="h-24 w-24 rounded-lg border border-ink-200 object-cover" />
                </a>
              </li>
            ))}
          </ul>
        )}
        {c.resolution && (
          <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-ink-800">Kết luận: {c.resolution}</p>
        )}
      </section>

      <AdminComplaintConsole complaintId={c.id} initial={c.messages} closed={c.status === 'CLOSED'} />

      <Link href="/admin/khieu-nai" className="btn-ghost">
        ← Danh sách khiếu nại
      </Link>
    </div>
  )
}

export const dynamic = 'force-dynamic'
