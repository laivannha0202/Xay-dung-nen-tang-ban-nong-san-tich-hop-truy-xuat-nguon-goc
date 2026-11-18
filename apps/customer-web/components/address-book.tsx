'use client'

import { useState } from 'react'
import { Alert, Badge } from '@agrimarket/ui'
import type { Address } from '@agrimarket/core'
import { api, ApiFailure } from '@/lib/api'
import { WardPicker } from './ward-picker'

export type Addr = Address

/** Renders the human-readable line; legacy rows keep their old district text. */
export const addressLine = (a: Address) =>
  [a.street_detail, a.ward_name ?? a.ward, a.district, a.province].filter(Boolean).join(', ')

export function AddressBook({ initial, profile }: { initial: Addr[]; profile?: { name: string | null; phone: string | null } }) {
  const [list, setList] = useState(initial)
  const [open, setOpen] = useState(initial.length === 0)
  const [editing, setEditing] = useState<Addr | null>(null)
  const [wardCode, setWardCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [bump, setBump] = useState(0)

  async function reload() {
    setList(await api<Addr[]>('/me/addresses'))
  }

  function startEdit(a: Addr | null) {
    setEditing(a)
    setWardCode(a?.ward_code ?? '')
    setOpen(true)
    setError(null)
    if (!a) setBump((n) => n + 1)
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    if (!wardCode) {
      setError('Chọn xã/phường nhận hàng trong tỉnh Hưng Yên.')
      return
    }
    const raw = Object.fromEntries(new FormData(form).entries()) as Record<string, string>
    setBusy(true)
    try {
      const body = JSON.stringify({
        recipient_name: raw.recipient_name,
        phone: raw.phone,
        ward_code: wardCode,
        street_detail: raw.street_detail,
        is_default: raw.is_default === 'true',
      })
      await api(editing ? `/me/addresses/${editing.id}` : '/me/addresses', {
        method: editing ? 'PATCH' : 'POST',
        body,
      })
      form.reset()
      setEditing(null)
      setWardCode('')
      setOpen(false)
      setError(null)
      await reload()
    } catch (err) {
      setError(err instanceof ApiFailure ? err.payload.message : 'Không lưu được địa chỉ.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    await api(`/me/addresses/${id}`, { method: 'DELETE' })
    await reload()
  }

  async function makeDefault(id: string) {
    await api(`/me/addresses/${id}`, { method: 'PATCH', body: JSON.stringify({ is_default: true }) })
    await reload()
  }

  return (
    <div className="mt-4 space-y-3">
      {list.map((a) => (
        <div key={a.id} className="card-pad space-y-1 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-ink-900">{a.recipient_name}</p>
            <span className="text-ink-500">{a.phone}</span>
            {a.is_default && <Badge tone="brand">Mặc định</Badge>}
            {a.needs_confirmation && <Badge tone="warning">Cần chọn lại xã/phường</Badge>}
            {a.in_service_area === false && <Badge tone="danger">Ngoài vùng giao</Badge>}
          </div>
          <p className="text-ink-600">{addressLine(a)}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {!a.is_default && (
              <button type="button" className="btn-ghost btn-sm" onClick={() => makeDefault(a.id)}>Đặt mặc định</button>
            )}
            <button type="button" className="btn-ghost btn-sm" onClick={() => startEdit(a)}>Sửa</button>
            <button type="button" className="btn-ghost btn-sm text-rose-600" onClick={() => remove(a.id)}>Xóa</button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          if (open) {
            setOpen(false)
            setEditing(null)
          } else startEdit(null)
        }}
      >
        {open ? 'Đóng' : 'Thêm địa chỉ'}
      </button>
      {open && (
        <form key={editing?.id ?? `new-${bump}`} onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="province">Tỉnh/Thành</label>
            <input id="province" className="input bg-ink-50" value="Tỉnh Hưng Yên" readOnly aria-readonly />
            <p className="mt-1 text-xs text-ink-500">AgriMarket hiện chỉ giao hàng trong tỉnh Hưng Yên.</p>
          </div>
          <WardPicker value={wardCode} onChange={(code) => setWardCode(code)} invalid={!wardCode} />
          <input
            name="recipient_name"
            className="input"
            placeholder="Tên người nhận"
            aria-label="Tên người nhận"
            defaultValue={editing?.recipient_name ?? profile?.name ?? ''}
            required
          />
          <input
            name="phone"
            className="input"
            placeholder="Số điện thoại"
            aria-label="Số điện thoại"
            defaultValue={editing?.phone ?? profile?.phone ?? ''}
            inputMode="tel"
            required
          />
          <input
            name="street_detail"
            className="input sm:col-span-2"
            placeholder="Số nhà, đường, thôn/tổ dân phố"
            aria-label="Số nhà, đường, thôn/tổ dân phố"
            defaultValue={editing?.street_detail ?? ''}
            required
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="is_default" value="true" defaultChecked={editing?.is_default ?? list.length === 0} /> Đặt làm mặc định
          </label>
          {error && <div className="sm:col-span-2"><Alert tone="danger">{error}</Alert></div>}
          <button className="btn-buy sm:col-span-2" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu địa chỉ'}</button>
        </form>
      )}
    </div>
  )
}
