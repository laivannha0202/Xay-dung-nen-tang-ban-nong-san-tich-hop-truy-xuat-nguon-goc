'use client'

import { useState } from 'react'
import { api, ApiFailure } from '@/lib/api'

interface Allocation {
  id: string
  batch_code: string
  reserved_qty: string
  shipped_qty: string
  status: string
  product_name?: string
}

interface BatchOption { id: string; code: string; product_name: string }

function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return {
    busy,
    error,
    clear: () => setError(null),
    run: async (fn: () => Promise<unknown>) => {
      setBusy(true)
      setError(null)
      try {
        await fn()
        window.location.reload()
      } catch (e) {
        setError(
          e instanceof ApiFailure
            ? e.payload.field_errors
              ? Object.values(e.payload.field_errors).join(' ')
              : e.payload.message
            : 'Thao tác thất bại.',
        )
        setBusy(false)
      }
    },
  }
}

export function ShipForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [carrier, setCarrier] = useState('')
  const [tracking, setTracking] = useState('')
  const [courier, setCourier] = useState('')
  const a = useAction()

  if (!open) return <button type="button" className="btn-primary" onClick={() => setOpen(true)}>Xuất kho & giao hàng</button>

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void a.run(() => api(`/admin/orders/${orderId}/ship`, { method: 'POST', body: JSON.stringify({ carrier, tracking_code: tracking, courier_name: courier }) }))
      }}
      className="grid gap-2 rounded-lg border border-ink-200 bg-ink-100 p-3 sm:grid-cols-3"
    >
      <input className="input" placeholder="Đơn vị vận chuyển" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
      <input className="input" placeholder="Mã vận đơn" value={tracking} onChange={(e) => setTracking(e.target.value)} />
      <input className="input" placeholder="Người giao" value={courier} onChange={(e) => setCourier(e.target.value)} />
      <div className="sm:col-span-3 flex gap-2">
        <button className="btn-primary" disabled={a.busy}>{a.busy ? 'Đang xuất…' : 'Xuất kho & chuyển Đang giao'}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy</button>
      </div>
      {a.error && <p className="sm:col-span-3 text-sm text-rose-700">{a.error}</p>}
      <p className="sm:col-span-3 hint">
        Hệ thống chỉ xuất đúng các lô đã giữ chỗ. Nếu lô hết hạn / tạm giữ / thu hồi, thao tác bị chặn và cần đổi lô.
      </p>
    </form>
  )
}

export function ReallocateForm({ orderId, allocations, batches }: { orderId: string; allocations: Allocation[]; batches: BatchOption[] }) {
  const active = allocations.filter((x) => x.status === 'ACTIVE' && Number(x.shipped_qty) === 0)
  const [allocationId, setAllocationId] = useState(active[0]?.id ?? '')
  const [batchId, setBatchId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const a = useAction()

  if (active.length === 0) return null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void a.run(() =>
          api(`/admin/orders/${orderId}/reallocate`, {
            method: 'POST',
            body: JSON.stringify({ allocation_id: allocationId, batch_id: batchId, quantity: Number(quantity), reason }),
          }),
        )
      }}
      className="grid gap-2 rounded-lg border border-ink-200 bg-ink-100 p-3 sm:grid-cols-2"
    >
      <h3 className="sm:col-span-2 font-medium">Đổi lô cho đơn</h3>
      <div>
        <label className="label" htmlFor="alloc">Phân bổ cần thay</label>
        <select id="alloc" className="input" value={allocationId} onChange={(e) => setAllocationId(e.target.value)}>
          {active.map((x) => (
            <option key={x.id} value={x.id}>
              Lô {x.batch_code} · giữ {Number(x.reserved_qty)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="newbatch">Lô thay thế</label>
        <select id="newbatch" className="input" required value={batchId} onChange={(e) => setBatchId(e.target.value)}>
          <option value="">Chọn lô bán được</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.code} — {b.product_name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="qty">Số lượng</label>
        <input id="qty" type="number" step="0.001" className="input" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="why">Lý do (bắt buộc)</label>
        <input id="why" className="input" required minLength={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <button className="btn-secondary sm:col-span-2" disabled={a.busy}>{a.busy ? 'Đang đổi…' : 'Xác nhận đổi lô'}</button>
      {a.error && <p className="sm:col-span-2 text-sm text-rose-700">{a.error}</p>}
    </form>
  )
}

export function RefundForm({ orderId, maxAmount }: { orderId: string; maxAmount: number }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const a = useAction()

  if (!open) return <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>Tạo yêu cầu hoàn tiền</button>

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void a.run(() =>
          api('/admin/refunds', { method: 'POST', body: JSON.stringify({ order_id: orderId, amount_vnd: Number(amount), reason }) }),
        )
      }}
      className="grid gap-2 rounded-lg border border-ink-200 bg-ink-100 p-3 sm:grid-cols-2"
    >
      <div>
        <label className="label" htmlFor="amt">Số tiền hoàn (tối đa {maxAmount.toLocaleString('vi-VN')}₫)</label>
        <input id="amt" type="number" className="input" required min={1} max={maxAmount} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="rsn">Lý do</label>
        <input id="rsn" className="input" required minLength={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <div className="sm:col-span-2 flex gap-2">
        <button className="btn-primary" disabled={a.busy}>{a.busy ? 'Đang tạo…' : 'Tạo yêu cầu'}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Hủy</button>
      </div>
      {a.error && <p className="sm:col-span-2 text-sm text-rose-700">{a.error}</p>}
    </form>
  )
}
