import Link from 'next/link'
import { notFound } from 'next/navigation'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { dateTimeVN, COMPLAINT_STATUS, COMPLAINT_TYPE } from '@/lib/format'
import { AdminComplaintConsole } from '@/components/admin-complaint-console'
import { StatusBadge } from '@/components/ui'

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
  messages: Array<{ id: string; content: string; actor_role: string; actor_name: string; created_at: string }>
  files: Array<{ id: string; url: string; mime: string }>
}

export default async function AdminComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await serverFetch<Detail>(`/admin/complaints/${id}`, await authCookie())
  if (!c) notFound()

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{c.code}</h1>
          <StatusBadge map={COMPLAINT_STATUS} value={c.status} />
        </div>
        <p className="text-sm text-leaf-700">
          {COMPLAINT_TYPE[c.type] ?? c.type} · {c.customer_name ?? '—'} ({c.customer_email}
          {c.customer_phone && `, ${c.customer_phone}`}) · mở lúc {dateTimeVN(c.created_at)}
        </p>
        <p className="text-sm text-leaf-700">
          {c.batch_id && <>Lô <Link href={`/admin/lo-hang/${c.batch_id}`} className="underline">{c.batch_code}</Link></>}
          {c.order_id && <> · Đơn <Link href={`/admin/don-hang/${c.order_id}`} className="underline">{c.order_code}</Link></>}
        </p>
      </header>

      <section className="card p-4 text-sm">
        <h2 className="mb-1 font-semibold">Nội dung khách gửi</h2>
        <p className="whitespace-pre-line text-leaf-800">{c.description}</p>
        {c.files.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {c.files.map((f) => (
              <li key={f.id}>
                <img src={f.url} alt="Ảnh khiếu nại" className="h-24 w-24 rounded object-cover" />
              </li>
            ))}
          </ul>
        )}
        {c.resolution && <p className="mt-2 rounded-lg bg-leaf-50 p-3">Kết luận: {c.resolution}</p>}
      </section>

      <AdminComplaintConsole complaintId={c.id} initial={c.messages} closed={c.status === 'CLOSED'} />

      <Link href="/admin/khieu-nai" className="btn-ghost">← Danh sách khiếu nại</Link>
    </div>
  )
}

export const dynamic = 'force-dynamic'
