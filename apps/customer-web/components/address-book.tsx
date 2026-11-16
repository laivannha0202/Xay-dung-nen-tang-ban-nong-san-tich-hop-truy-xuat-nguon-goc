'use client'

import { useState } from 'react'
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
    <div className="mt-3 space-y-2">
      {list.map((a) => (
        <div key={a.id} className="rounded-lg border border-leaf-100 p-3 text-sm">
          <p><span className="font-medium">{a.recipient_name}</span> · {a.phone}</p>
          <p className="text-leaf-700">{a.street_detail}, {a.ward}, {a.district}, {a.province}</p>
          <div className="mt-1 flex gap-3 text-xs">
            {a.is_default ? (
              <span className="badge bg-leaf-100 text-leaf-700">Mặc định</span>
            ) : (
              <button type="button" className="underline" onClick={() => makeDefault(a.id)}>Đặt mặc định</button>
            )}
            <button type="button" className="text-red-700 underline" onClick={() => remove(a.id)}>Xóa</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={() => setOpen((v) => !v)}>
        {open ? 'Đóng' : 'Thêm địa chỉ'}
      </button>
      {open && (
        <form onSubmit={save} className="grid gap-2 sm:grid-cols-2">
          <input name="recipient_name" className="input" placeholder="Tên người nhận" required />
          <input name="phone" className="input" placeholder="Số điện thoại" required inputMode="tel" />
          <input name="province" className="input" placeholder="Tỉnh/Thành" required />
          <input name="district" className="input" placeholder="Quận/Huyện" required />
          <input name="ward" className="input" placeholder="Phường/Xã" required />
          <input name="street_detail" className="input sm:col-span-2" placeholder="Số nhà, đường" required />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="is_default" value="true" /> Đặt làm mặc định
          </label>
          {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
          <button className="btn-primary sm:col-span-2">Lưu</button>
        </form>
      )}
    </div>
  )
}
