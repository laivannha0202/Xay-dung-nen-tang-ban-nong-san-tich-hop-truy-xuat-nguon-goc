'use client'

import { useState } from 'react'
import { api, ApiFailure } from '@/lib/api'
import { dateTimeVN } from '@/lib/format'

interface Message {
  id: string
  content: string
  actor_role: string
  actor_name: string
  created_at: string
}

export function AdminComplaintConsole({ complaintId, initial, closed }: { complaintId: string; initial: Message[]; closed: boolean }) {
  const [messages, setMessages] = useState(initial)
  const [text, setText] = useState('')
  const [status, setStatus] = useState('PROCESSING')
  const [resolution, setResolution] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function send() {
    setBusy(true)
    setError(null)
    try {
      await api(`/admin/complaints/${complaintId}/messages`, { method: 'POST', body: JSON.stringify({ content: text }) })
      const fresh = await api<{ messages: Message[] }>(`/admin/complaints/${complaintId}`)
      setMessages(fresh.messages)
      setText('')
    } catch (e) {
      setError(e instanceof ApiFailure ? e.payload.message : 'Không gửi được.')
    } finally {
      setBusy(false)
    }
  }

  async function updateStatus() {
    setBusy(true)
    setError(null)
    try {
      await api(`/admin/complaints/${complaintId}/status`, { method: 'POST', body: JSON.stringify({ status, resolution }) })
      window.location.reload()
    } catch (e) {
      setError(e instanceof ApiFailure ? e.payload.message : 'Không cập nhật được.')
      setBusy(false)
    }
  }

  return (
    <section className="card-pad space-y-3">
      <h2 className="font-semibold">Trao đổi với khách</h2>
      <ul className="space-y-2">
        {messages.map((m) => (
          <li key={m.id} className={`max-w-[85%] rounded-lg p-3 text-sm ${m.actor_role === 'ADMIN' ? 'ml-auto bg-brand-50' : 'bg-ink-100'}`}>
            <p className="text-xs text-ink-500">{m.actor_name} · {dateTimeVN(m.created_at)}</p>
            <p className="mt-1 whitespace-pre-line">{m.content}</p>
          </li>
        ))}
      </ul>
      {closed ? (
        <p className="text-sm text-ink-600">Khiếu nại đã đóng, không thể gửi thêm tin nhắn.</p>
      ) : (
        <div className="flex gap-2">
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Trả lời khách…" />
          <button type="button" className="btn-primary shrink-0" disabled={busy || !text.trim()} onClick={send}>Gửi</button>
        </div>
      )}

      <div className="border-t border-ink-200 pt-3">
        <h3 className="font-medium">Cập nhật trạng thái</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="NEW">Mới</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="RESOLVED">Đã giải quyết</option>
            <option value="CLOSED">Đóng</option>
          </select>
          <input className="input" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Kết luận / hướng xử lý" />
        </div>
        <button type="button" className="btn-secondary mt-2" disabled={busy} onClick={updateStatus}>Lưu trạng thái</button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </section>
  )
}
