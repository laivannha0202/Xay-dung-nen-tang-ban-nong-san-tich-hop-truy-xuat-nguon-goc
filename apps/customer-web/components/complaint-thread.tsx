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

export function ComplaintThread({ complaintId, initial, closed }: { complaintId: string; initial: Message[]; closed: boolean }) {
  const [messages, setMessages] = useState(initial)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setError(null)
    try {
      await api(`/me/complaints/${complaintId}/messages`, { method: 'POST', body: JSON.stringify({ content: text }) })
      const refreshed = await api<{ messages: Message[] }>(`/me/complaints/${complaintId}`)
      setMessages(refreshed.messages)
      setText('')
    } catch (e) {
      setError(e instanceof ApiFailure ? e.payload.message : 'Không gửi được tin nhắn.')
    }
  }

  return (
    <section className="card space-y-3 p-4">
      <h2 className="font-semibold">Trao đổi</h2>
      {messages.length === 0 && <p className="text-sm text-leaf-700">Chưa có tin nhắn.</p>}
      <ul className="space-y-2">
        {messages.map((m) => (
          <li key={m.id} className={`max-w-[85%] rounded-lg p-3 text-sm ${m.actor_role === 'ADMIN' ? 'bg-leaf-50' : 'ml-auto bg-clay-50'}`}>
            <p className="text-xs text-leaf-600">{m.actor_name} · {dateTimeVN(m.created_at)}</p>
            <p className="mt-1 whitespace-pre-line">{m.content}</p>
          </li>
        ))}
      </ul>
      {closed ? (
        <p className="text-sm text-leaf-700">Khiếu nại đã đóng. Vui lòng tạo khiếu nại mới nếu cần.</p>
      ) : (
        <div className="flex gap-2">
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhập tin nhắn…" />
          <button type="button" className="btn-primary shrink-0" disabled={text.trim().length === 0} onClick={send}>Gửi</button>
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </section>
  )
}
