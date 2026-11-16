'use client'

import { useState } from 'react'
import { api, ApiFailure } from '@/lib/api'

interface Line {
  id: string
  product_name: string
  reviewed: boolean
  batches: Array<{ id: string; code: string }>
}

export function OrderActions({ orderId, status, lines }: { orderId: string; status: string; lines: Line[]; batches: string[] }) {
  const [tab, setTab] = useState<'none' | 'review' | 'complaint' | 'cancel'>('none')
  const [lineId, setLineId] = useState(lines[0]?.id ?? '')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reason, setReason] = useState('')
  const [type, setType] = useState('QUALITY')
  const [description, setDescription] = useState('')
  // CUS-11-02: a line shipped from several batches must not be pinned to one arbitrarily.
  const [batchId, setBatchId] = useState('')
  const [files, setFiles] = useState<Array<{ url: string; mime: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const batchOptions = lines.find((l) => l.id === lineId)?.batches ?? []

  async function upload(file: File) {
    setUploading(true)
    setMessage(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api<{ url: string; mime: string }>('/uploads', { method: 'POST', body: fd })
      setFiles((f) => [...f, res].slice(0, 5))
    } catch (e) {
      setMessage(e instanceof ApiFailure ? e.payload.message : 'Không tải được ảnh.')
    } finally {
      setUploading(false)
    }
  }

  const canCancel = ['PENDING', 'CONFIRMED', 'PREPARING'].includes(status)
  const canReview = ['DELIVERED', 'COMPLETED'].includes(status)
  const canComplain = ['SHIPPING', 'DELIVERED', 'COMPLETED', 'DELIVERY_FAILED'].includes(status)
  if (!canCancel && !canReview && !canComplain) return null

  async function act(fn: () => Promise<unknown>, ok: string) {
    setBusy(true)
    setMessage(null)
    try {
      await fn()
      setMessage(ok)
      setTimeout(() => window.location.reload(), 800)
    } catch (e) {
      setMessage(e instanceof ApiFailure ? e.payload.message : 'Thao tác thất bại.')
      setBusy(false)
    }
  }

  return (
    <section className="card p-4">
      <div className="flex flex-wrap gap-2">
        {canReview && <button type="button" className="btn-secondary" onClick={() => setTab(tab === 'review' ? 'none' : 'review')}>Đánh giá</button>}
        {canComplain && <button type="button" className="btn-secondary" onClick={() => setTab(tab === 'complaint' ? 'none' : 'complaint')}>Gửi khiếu nại</button>}
        {canCancel && <button type="button" className="btn-ghost text-red-700" onClick={() => setTab(tab === 'cancel' ? 'none' : 'cancel')}>Hủy đơn</button>}
      </div>

      {tab === 'review' && (
        <div className="mt-3 space-y-2">
          <label className="label" htmlFor="line">Sản phẩm</label>
          <select id="line" className="input" value={lineId} onChange={(e) => setLineId(e.target.value)}>
            {lines.map((l) => (
              <option key={l.id} value={l.id} disabled={l.reviewed}>
                {l.product_name}{l.reviewed ? ' (đã đánh giá)' : ''}
              </option>
            ))}
          </select>
          <label className="label" htmlFor="rating">Số sao</label>
          <select id="rating" className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
          </select>
          <label className="label" htmlFor="comment">Nhận xét</label>
          <textarea id="comment" className="input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => act(() => api('/me/reviews', { method: 'POST', body: JSON.stringify({ order_line_id: lineId, rating, comment }) }), 'Đã gửi đánh giá.')}
          >
            Gửi đánh giá
          </button>
        </div>
      )}

      {tab === 'complaint' && (
        <div className="mt-3 space-y-2">
          <label className="label" htmlFor="cl">Sản phẩm</label>
          <select
            id="cl"
            className="input"
            value={lineId}
            onChange={(e) => {
              setLineId(e.target.value)
              setBatchId('')
            }}
          >
            {lines.map((l) => (
              <option key={l.id} value={l.id}>{l.product_name}</option>
            ))}
          </select>
          <label className="label" htmlFor="type">Loại vấn đề</label>
          <select id="type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="QUALITY">Chất lượng</option>
            <option value="DAMAGED">Hư hỏng</option>
            <option value="WRONG_ITEM">Sai hàng</option>
            <option value="SUSPECTED_FAKE">Nghi hàng giả</option>
            <option value="OTHER">Khác</option>
          </select>
          <label className="label" htmlFor="batch">Lô hàng liên quan</label>
          <select id="batch" className="input" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">Chưa xác định</option>
            {batchOptions.map((b) => (
              <option key={b.id} value={b.id}>Lô {b.code}</option>
            ))}
          </select>
          <label className="label" htmlFor="desc">Mô tả</label>
          <textarea id="desc" className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả chi tiết vấn đề (tối thiểu 10 ký tự)" />
          <label className="label" htmlFor="ev">Ảnh bằng chứng (JPG/PNG/PDF, tối đa 8MB mỗi tệp)</label>
          <input
            id="ev"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="input"
            disabled={uploading || files.length >= 5}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void upload(f)
            }}
          />
          {uploading && <p className="text-xs text-leaf-600">Đang tải tệp…</p>}
          {files.length > 0 && (
            <ul className="flex flex-wrap gap-2 text-xs">
              {files.map((f) => (
                <li key={f.url} className="rounded border border-leaf-100 px-2 py-1">{f.url.split('/').pop()}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="btn-primary"
            disabled={busy || uploading || description.trim().length < 10}
            onClick={() =>
              act(
                () =>
                  api('/me/complaints', {
                    method: 'POST',
                    body: JSON.stringify({
                      order_id: orderId,
                      order_line_id: lineId,
                      batch_id: batchId || undefined,
                      type,
                      description,
                      files: files.length ? files : undefined,
                    }),
                  }),
                'Đã gửi khiếu nại.',
              )
            }
          >
            Gửi khiếu nại
          </button>
        </div>
      )}

      {tab === 'cancel' && (
        <div className="mt-3 space-y-2">
          <label className="label" htmlFor="reason">Lý do hủy</label>
          <input id="reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button
            type="button"
            className="btn-danger"
            disabled={busy || reason.trim().length < 3}
            onClick={() => act(() => api(`/me/orders/${orderId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }), 'Đã hủy đơn.')}
          >
            Xác nhận hủy
          </button>
        </div>
      )}

      {message && <p className="mt-2 text-sm text-leaf-800" role="status">{message}</p>}
    </section>
  )
}
