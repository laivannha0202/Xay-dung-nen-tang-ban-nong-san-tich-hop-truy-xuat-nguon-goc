'use client'

import { useState } from 'react'
import { Alert, Badge, Icon } from '@agrimarket/ui'
import type { Address } from '@agrimarket/core'
import { api, ApiFailure } from '@/lib/api'
import { WardPicker } from './ward-picker'

export type Addr = Address

/** Renders the human-readable line; legacy rows keep their old district text. */
export const addressLine = (a: Address) =>
  [a.street_detail, a.ward_name ?? a.ward, a.district, a.province].filter(Boolean).join(', ')

export function AddressBook({ initial, profile }: { initial: Addr[]; profile?: { name: string | null; phone: string | null } }) {
  const [list, setList] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Addr | null>(null)
  const [confirming, setConfirming] = useState<Addr | null>(null)
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

  function closeForm() {
    setOpen(false)
    setEditing(null)
    setError(null)
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
    setBusy(true)
    try {
      await api(`/me/addresses/${id}`, { method: 'DELETE' })
      setConfirming(null)
      await reload()
    } catch (err) {
      setError(err instanceof ApiFailure ? err.payload.message : 'Không xóa được địa chỉ.')
    } finally {
      setBusy(false)
    }
  }

  async function makeDefault(id: string) {
    setBusy(true)
    try {
      await api(`/me/addresses/${id}`, { method: 'PATCH', body: JSON.stringify({ is_default: true }) })
      await reload()
    } catch (err) {
      setError(err instanceof ApiFailure ? err.payload.message : 'Không đặt được địa chỉ mặc định.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div aria-live="polite">
        {error && !open && <div role="alert"><Alert tone="danger">{error}</Alert></div>}
      </div>

      {list.length === 0 && !open && (
        <div className="grid place-items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-ink-200 px-6 py-10 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Icon name="pin" />
          </span>
          <p className="font-medium text-ink-800">Chưa có địa chỉ giao hàng</p>
          <p className="max-w-sm text-sm text-ink-500">Thêm địa chỉ để chọn sẵn ở bước thanh toán.</p>
        </div>
      )}

      {list.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-ink-200 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="font-semibold text-ink-900">{a.recipient_name}</p>
                <span className="text-ink-600">{a.phone}</span>
                {a.is_default && <Badge tone="brand">Mặc định</Badge>}
              </div>
              <p className="text-ink-600">{addressLine(a)}</p>
              {a.needs_confirmation && <Alert tone="warning">Địa chỉ cũ cần chọn lại xã/phường để giao được.</Alert>}
              {a.in_service_area === false && <Alert tone="danger">Địa chỉ nằm ngoài vùng giao hàng Hưng Yên.</Alert>}
              <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-ink-100 pt-2">
                {!a.is_default && (
                  <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => makeDefault(a.id)}>
                    Đặt mặc định
                  </button>
                )}
                <button type="button" className="btn-ghost btn-sm" onClick={() => startEdit(a)}>
                  Sửa
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-sm ml-auto text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => {
                    setError(null)
                    setConfirming(a)
                  }}
                >
                  <Icon name="trash" className="h-4 w-4" /> Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirming && (
        <div className="rounded-[var(--radius-card)] border border-rose-200 bg-rose-50/50 p-4" role="alertdialog" aria-labelledby="addr-del-title">
          <p id="addr-del-title" className="font-semibold text-ink-900">
            Xóa địa chỉ của {confirming.recipient_name}?
          </p>
          <p className="mt-1 text-sm text-ink-600">{addressLine(confirming)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-danger btn-sm" disabled={busy} onClick={() => remove(confirming.id)}>
              {busy ? 'Đang xóa…' : 'Xóa địa chỉ'}
            </button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setConfirming(null)} disabled={busy}>
              Giữ lại
            </button>
          </div>
        </div>
      )}

      {!open ? (
        <button type="button" className="btn-secondary" onClick={() => startEdit(null)}>
          <Icon name="plus" className="h-4 w-4" /> Thêm địa chỉ
        </button>
      ) : (
        <section aria-labelledby="addr-form-title" className="rounded-[var(--radius-card)] border border-ink-100 bg-ink-100/50 p-4 sm:p-5">
          <h2 id="addr-form-title" className="mb-3 font-semibold text-ink-900">
            {editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h2>
          <form key={editing?.id ?? `new-${bump}`} onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="province">Tỉnh/Thành</label>
              <input id="province" className="input bg-white" value="Tỉnh Hưng Yên" readOnly aria-readonly />
              <p className="hint">AgriMarket hiện chỉ giao hàng trong tỉnh Hưng Yên.</p>
            </div>
            <div className="sm:col-span-1">
              <WardPicker value={wardCode} onChange={(code) => setWardCode(code)} invalid={!wardCode} />
            </div>
            <div>
              <label className="label" htmlFor="recipient_name">Tên người nhận</label>
              <input
                id="recipient_name"
                name="recipient_name"
                className="input bg-white"
                autoComplete="name"
                defaultValue={editing?.recipient_name ?? profile?.name ?? ''}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="addr-phone">Số điện thoại</label>
              <input
                id="addr-phone"
                name="phone"
                className="input bg-white"
                defaultValue={editing?.phone ?? profile?.phone ?? ''}
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="street_detail">Số nhà, đường, thôn/tổ dân phố</label>
              <input
                id="street_detail"
                name="street_detail"
                className="input bg-white"
                autoComplete="street-address"
                defaultValue={editing?.street_detail ?? ''}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="is_default" value="true" defaultChecked={editing?.is_default ?? list.length === 0} />
              Đặt làm địa chỉ mặc định
            </label>
            {error && <div className="sm:col-span-2" role="alert"><Alert tone="danger">{error}</Alert></div>}
            <div className="flex flex-wrap gap-2 border-t border-ink-200 pt-3 sm:col-span-2">
              <button className="btn-primary" disabled={busy}>
                {busy ? 'Đang lưu…' : 'Lưu địa chỉ'}
              </button>
              <button type="button" className="btn-secondary" disabled={busy} onClick={closeForm}>
                Hủy
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
