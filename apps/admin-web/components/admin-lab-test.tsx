'use client'

import { useState } from 'react'
import { api, ApiFailure } from '@/lib/api'

interface Metric {
  metric: string
  measured_value: string
  unit: string
  reference_limit: string
  result: 'PASS' | 'FAIL'
}

const EMPTY: Metric = { metric: '', measured_value: '', unit: '', reference_limit: '', result: 'PASS' }

export function LabTestForm({ batchId }: { batchId: string }) {
  const [open, setOpen] = useState(false)
  const [laboratory, setLaboratory] = useState('')
  const [sampledAt, setSampledAt] = useState('')
  const [resultedAt, setResultedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [metrics, setMetrics] = useState<Metric[]>([{ ...EMPTY }])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function patch(i: number, next: Partial<Metric>) {
    setMetrics((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...next } : r)))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api(`/admin/batches/${batchId}/lab-tests`, {
        method: 'POST',
        body: JSON.stringify({
          laboratory,
          sampled_at: sampledAt,
          resulted_at: resultedAt,
          notes,
          metrics: metrics.filter((m) => m.metric.trim() && m.measured_value.trim()),
        }),
      })
      window.location.reload()
    } catch (err) {
      setError(
        err instanceof ApiFailure
          ? err.payload.field_errors
            ? Object.values(err.payload.field_errors).join(' ')
            : err.payload.message
          : 'Không tạo được phiếu.',
      )
      setBusy(false)
    }
  }

  if (!open) return <button type="button" className="btn-primary" onClick={() => setOpen(true)}>+ Thêm phiếu kiểm nghiệm</button>

  return (
    <form onSubmit={submit} className="card-pad space-y-3">
      <h2 className="font-semibold">Phiếu kiểm nghiệm mới</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="lab">Đơn vị kiểm nghiệm</label>
          <input id="lab" className="input" required value={laboratory} onChange={(e) => setLaboratory(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="sampled">Ngày lấy mẫu</label>
          <input id="sampled" type="date" className="input" required value={sampledAt} onChange={(e) => setSampledAt(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="resulted">Ngày có kết quả</label>
          <input id="resulted" type="date" className="input" required value={resultedAt} onChange={(e) => setResultedAt(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="notes">Ghi chú</label>
          <input id="notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Chỉ tiêu</p>
        {metrics.map((m, i) => (
          <div key={i} className="grid gap-2 rounded-lg bg-brand-50/60 p-2 sm:grid-cols-5">
            <input className="input" placeholder="Chỉ tiêu" required value={m.metric} onChange={(e) => patch(i, { metric: e.target.value })} />
            <input className="input" placeholder="Giá trị đo" required value={m.measured_value} onChange={(e) => patch(i, { measured_value: e.target.value })} />
            <input className="input" placeholder="Đơn vị" value={m.unit} onChange={(e) => patch(i, { unit: e.target.value })} />
            <input className="input" placeholder="Ngưỡng cho phép" value={m.reference_limit} onChange={(e) => patch(i, { reference_limit: e.target.value })} />
            <select className="input" value={m.result} onChange={(e) => patch(i, { result: e.target.value as 'PASS' | 'FAIL' })}>
              <option value="PASS">Đạt</option>
              <option value="FAIL">Không đạt</option>
            </select>
          </div>
        ))}
        <button type="button" className="btn-ghost text-sm" onClick={() => setMetrics((r) => [...r, { ...EMPTY }])}>+ Thêm chỉ tiêu</button>
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}
      <p className="hint">
        Có chỉ tiêu không đạt → lô tự động chuyển Không đạt + Tạm giữ, không thể bán cho tới khi có phiếu đạt được xác nhận.
      </p>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu phiếu'}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy</button>
      </div>
    </form>
  )
}
