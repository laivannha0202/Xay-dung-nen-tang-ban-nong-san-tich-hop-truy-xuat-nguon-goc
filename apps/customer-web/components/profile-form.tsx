'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@agrimarket/ui'
import { api, ApiFailure } from '@/lib/api'

/** Lets the customer correct their own name and phone (CUS-02-01). */
export function ProfileForm({ name, phone, email }: { name: string | null; phone: string | null; email?: string }) {
  const router = useRouter()
  const [values, setValues] = useState({ name: name ?? '', phone: phone ?? '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setOk(false)
    try {
      // `name` is optional but cannot be blank, so a cleared name is simply not sent.
      // `phone` is always sent: an empty string is the deliberate way to clear it.
      const payload: { phone: string; name?: string } = { phone: values.phone.trim() }
      if (values.name.trim().length > 0) payload.name = values.name.trim()
      await api('/me', { method: 'PATCH', body: JSON.stringify(payload) })
      setOk(true)
      // The header and overview read the session on the server; refresh so the new name shows there too.
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiFailure ? err.payload.message : 'Không lưu được hồ sơ.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="pf-name">Họ tên</label>
          <input
            id="pf-name"
            className="input"
            value={values.name}
            maxLength={80}
            autoComplete="name"
            onChange={(e) => setValues({ ...values, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="pf-phone">Số điện thoại</label>
          <input
            id="pf-phone"
            className="input"
            inputMode="tel"
            autoComplete="tel"
            value={values.phone}
            maxLength={20}
            onChange={(e) => setValues({ ...values, phone: e.target.value })}
          />
          <p className="hint">Để trống nếu muốn xóa số điện thoại.</p>
        </div>
      </div>

      <div>
        <p className="label">Email tài khoản</p>
        <p className="text-sm text-ink-800">{email ?? '—'}</p>
        <p className="hint">Email dùng để đăng nhập và không sửa được tại đây.</p>
      </div>

      {error && <div role="alert"><Alert tone="danger">{error}</Alert></div>}
      {ok && !error && <Alert tone="success">Đã lưu hồ sơ. Tên mới hiển thị ở đầu trang và góc phải website.</Alert>}
      <div className="flex justify-end border-t border-ink-100 pt-4">
        <button className="btn-primary" disabled={busy} aria-busy={busy}>
          {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  )
}
