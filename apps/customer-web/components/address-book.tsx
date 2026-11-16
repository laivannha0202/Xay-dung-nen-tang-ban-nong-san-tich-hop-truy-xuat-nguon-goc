'use client'

import { useState } from 'react'
import { Alert, Badge } from '@agrimarket/ui'
import { api, ApiFailure } from '@/lib/api'

export interface Addr {
  id: string
  recipient_name: string
  phone: string
  province: string
  district: string
  ward: string
  street_detail: string
  is_default: boolean
}

export function AddressBook({ initial }: { initial: Addr[] }) {
  const [list, setList] = useState(initial)
  const [open, setOpen] = useState(initial.length === 0)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    setList(await api<Addr[]>('/me/addresses'))
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    try {
      await api('/me/addresses', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) })
      form.reset()
      setOpen(false)
      setError(null)
      await reload()
    } catch (err) {
      setError(err instanceof ApiFailure ? err.payload.message : 'Không lưu được địa chỉ.')
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
          </div>
          <p className="text-ink-600">
            {a.street_detail}, {a.ward}, {a.district}, {a.province}
          </p>
          <div className="flex gap-2 pt-1">
            {!a.is_default && (
              <button type="button" className="btn-ghost btn-sm" onClick={() => makeDefault(a.id)}>Đặt mặc định</button>
            )}
            <button type="button" className="btn-ghost btn-sm text-rose-600" onClick={() => remove(a.id)}>Xóa</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={() => setOpen((v) => !v)}>
        {open ? 'Đóng' : 'Thêm địa chỉ'}
      </button>
      {open && (
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <input name="recipient_name" className="input" placeholder="Tên người nhận" aria-label="Tên người nhận" required />
          <input name="phone" className="input" placeholder="Số điện thoại" aria-label="Số điện thoại" required inputMode="tel" />
          <input name="province" className="input" placeholder="Tỉnh/Thành" aria-label="Tỉnh/Thành" required />
          <input name="district" className="input" placeholder="Quận/Huyện" aria-label="Quận/Huyện" required />
          <input name="ward" className="input" placeholder="Phường/Xã" aria-label="Phường/Xã" required />
          <input name="street_detail" className="input sm:col-span-2" placeholder="Số nhà, đường" aria-label="Số nhà, đường" required />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="is_default" value="true" /> Đặt làm mặc định
          </label>
          {error && <div className="sm:col-span-2"><Alert tone="danger">{error}</Alert></div>}
          <button className="btn-primary sm:col-span-2">Lưu</button>
        </form>
      )}
    </div>
  )
}
