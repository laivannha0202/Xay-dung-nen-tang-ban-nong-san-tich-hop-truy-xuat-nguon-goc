'use client'

import { useEffect, useMemo, useState } from 'react'
import { api, ApiFailure } from '@/lib/api'
import { Alert, Badge, SectionHeader } from '@agrimarket/ui'

interface WardRow {
  code: string
  name: string
  type: string
  in_service_area: boolean
  disabled_at: string | null
  open_orders: number
  saved_addresses: number
}

interface Payload {
  data: WardRow[]
  active_count: number
  total: number
}

/**
 * Toggle which Hưng Yên communes are deliverable. Orders already placed keep their
 * snapshot; this only gates *new* checkouts, which is why open orders are shown.
 */
export function ServiceAreaConsole() {
  const [rows, setRows] = useState<WardRow[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [query, setQuery] = useState('')
  const [onlyDisabled, setOnlyDisabled] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const p = await api<Payload>(
        `/admin/service-area/wards${query ? `?q=${encodeURIComponent(query)}` : ''}${onlyDisabled ? `${query ? '&' : '?'}only_disabled=true` : ''}`,
      )
      setRows(p.data)
      setActiveCount(p.active_count)
      setError(null)
    } catch (e) {
      setError(e instanceof ApiFailure ? e.payload.message : 'Không tải được danh sách xã/phường.')
    }
  }

  useEffect(() => {
    const t = setTimeout(() => void load(), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, onlyDisabled])

  async function toggle(w: WardRow) {
    if (w.in_service_area) {
      const hint = w.open_orders > 0 ? ` Đang có ${w.open_orders} đơn chưa giao tới khu vực này.` : ''
      if (!window.confirm(`Tắt giao hàng tới ${w.name}?${hint} Đơn đã đặt vẫn được giao.`)) return
    }
    setBusy(w.code)
    try {
      await api(`/admin/service-area/wards/${w.code}`, {
        method: 'PATCH',
        body: JSON.stringify({ in_service_area: !w.in_service_area }),
      })
      await load()
    } catch (e) {
      setError(e instanceof ApiFailure ? e.payload.message : 'Không cập nhật được.')
    } finally {
      setBusy(null)
    }
  }

  const disabled = useMemo(() => rows.filter((r) => !r.in_service_area).length, [rows])

  return (
    <section className="card">
      <div className="border-b border-ink-100 px-4 py-3">
        <SectionHeader
          title="Vùng giao hàng Hưng Yên"
          hint="104 xã/phường sau sáp nhập. Khách chỉ chọn được xã/phường đang bật."
          action={<Badge tone={activeCount > 0 ? 'brand' : 'danger'}>{activeCount} đang phục vụ</Badge>}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <input
          className="input max-w-xs"
          placeholder="Tìm không dấu, VD: pho hien"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Tìm xã/phường"
        />
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={onlyDisabled} onChange={(e) => setOnlyDisabled(e.target.checked)} />
          Chỉ xã/phường đang tắt
        </label>
        {onlyDisabled && <Badge tone="warning">{disabled} đang tắt</Badge>}
      </div>
      {error && <div className="px-4 pb-3"><Alert tone="danger">{error}</Alert></div>}
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Xã/Phường</th>
              <th>Mã</th>
              <th className="text-right">Địa chỉ đã lưu</th>
              <th className="text-right">Đơn chưa giao</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.code}>
                <td className="font-medium text-ink-900">{w.name}</td>
                <td className="tabular-nums text-ink-500">{w.code}</td>
                <td className="text-right tabular-nums">{w.saved_addresses}</td>
                <td className="text-right tabular-nums">{w.open_orders}</td>
                <td>
                  {w.in_service_area ? <Badge tone="success">Đang giao</Badge> : <Badge tone="danger">Đã tắt</Badge>}
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    disabled={busy === w.code}
                    onClick={() => void toggle(w)}
                  >
                    {w.in_service_area ? 'Tắt' : 'Bật'}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-ink-500">Không có xã/phường khớp tìm kiếm.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
