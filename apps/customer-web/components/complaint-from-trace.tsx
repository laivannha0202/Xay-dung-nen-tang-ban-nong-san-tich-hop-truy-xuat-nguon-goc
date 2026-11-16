'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api, ApiFailure } from '@/lib/api'
import { Alert, Icon } from '@agrimarket/ui'

const TYPES = [
  { value: 'SUSPECTED_FAKE', label: 'Nghi hàng giả / không đúng nguồn gốc' },
  { value: 'QUALITY', label: 'Chất lượng không như mô tả' },
  { value: 'DAMAGED', label: 'Hư hỏng khi nhận' },
  { value: 'WRONG_ITEM', label: 'Giao sai hàng' },
  { value: 'OTHER', label: 'Khác' },
] as const

/**
 * Complaint raised straight from a trace page (CUS-09-05). The batch is bound
 * from the QR the shopper scanned, never guessed.
 */
export function ComplaintFromTrace({ batchId, batchCode }: { batchId: string; batchCode: string }) {
  const [type, setType] = useState<string>('SUSPECTED_FAKE')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)

  if (code) {
    return (
      <div className="card-pad">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
            <Icon name="check" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink-900">Đã gửi khiếu nại {code}</h2>
            <p className="mt-1 text-sm text-ink-500">Chúng tôi sẽ phản hồi trong mục Khiếu nại của tài khoản.</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/tai-khoan/khieu-nai" className="btn-secondary">Xem khiếu nại</Link>
          <Link href={`/t/${batchCode}`} className="btn-ghost">Về trang truy xuất</Link>
        </div>
      </div>
    )
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await api<{ code: string }>('/me/complaints', {
        method: 'POST',
        body: JSON.stringify({ batch_id: batchId, type, description }),
      })
      setCode(res.code)
    } catch (err) {
      setError(err instanceof ApiFailure ? err.payload.message : 'Không gửi được khiếu nại.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card-pad space-y-3">
      <h2 className="text-base font-semibold text-ink-900">Báo cáo vấn đề cho lô {batchCode}</h2>
      <div>
        <label className="label" htmlFor="cp-type">Loại vấn đề</label>
        <select id="cp-type" className="select" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="cp-desc">Mô tả</label>
        <textarea
          id="cp-desc"
          className="input"
          rows={3}
          minLength={10}
          maxLength={2000}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả cụ thể vấn đề bạn gặp (tối thiểu 10 ký tự)."
        />
        <p className="hint">Càng chi tiết càng giúp bộ phận hỗ trợ xử lý nhanh.</p>
      </div>
      {error && <Alert tone="danger"><span role="alert">{error}</span></Alert>}
      <button className="btn-primary" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi khiếu nại'}</button>
    </form>
  )
}
