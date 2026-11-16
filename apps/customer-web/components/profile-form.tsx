'use client'

import { useState } from 'react'
import { api, ApiFailure } from '@/lib/api'

/** Lets the customer correct their own name and phone (CUS-02-01). */
export function ProfileForm({ name, phone }: { name: string | null; phone: string | null }) {
  const [values, setValues] = useState({ name: name ?? '', phone: phone ?? '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      // `name` is optional but cannot be blank, so a cleared name is simply not sent.
      // `phone` is always sent: an empty string is the deliberate way to clear it.
      const payload: { phone: string; name?: string } = { phone: values.phone.trim() }
      if (values.name.trim().length > 0) payload.name = values.name.trim()
      await api('/me', { method: 'PATCH', body: JSON.stringify(payload) })
      setOk(true)
    } catch (err) {
      setError(err instanceof ApiFailure ? err.payload.message : 'Không lưu được hồ sơ.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <div>
        <label className="label" htmlFor="pf-name">Họ tên</label>
        <input
          id="pf-name"
          className="input"
          value={values.name}
          maxLength={80}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
      </div>
      <div>
        <label className="label" htmlFor="pf-phone">Điện thoại</label>
        <input
          id="pf-phone"
          className="input"
          inputMode="tel"
          value={values.phone}
          maxLength={20}
          onChange={(e) => setValues({ ...values, phone: e.target.value })}
        />
      </div>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {ok && <p className="text-sm text-leaf-800">Đã lưu hồ sơ.</p>}
      <button className="btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu hồ sơ'}</button>
    </form>
  )
}
