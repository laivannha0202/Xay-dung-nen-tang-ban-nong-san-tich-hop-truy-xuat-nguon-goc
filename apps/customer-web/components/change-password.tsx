'use client'

import { useState } from 'react'
import { Alert } from '@agrimarket/ui'
import { api, ApiFailure } from '@/lib/api'

export function ChangePassword() {
  const [form, setForm] = useState({ current_password: '', new_password: '' })
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    try {
      await api('/me/password', { method: 'POST', body: JSON.stringify(form) })
      setMsg('Đã đổi mật khẩu. Vui lòng đăng nhập lại trên các thiết bị khác.')
      setForm({ current_password: '', new_password: '' })
    } catch (e2) {
      setErr(e2 instanceof ApiFailure ? e2.payload.message : 'Không đổi được mật khẩu.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="font-semibold text-ink-900">Đổi mật khẩu</h2>
      <div>
        <label className="label" htmlFor="cur">Mật khẩu hiện tại</label>
        <input id="cur" type="password" className="input" required autoComplete="current-password" value={form.current_password} onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))} />
      </div>
      <div>
        <label className="label" htmlFor="new">Mật khẩu mới</label>
        <input id="new" type="password" className="input" required minLength={8} autoComplete="new-password" value={form.new_password} onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))} />
        <p className="hint">Tối thiểu 8 ký tự.</p>
      </div>
      {err && <div role="alert"><Alert tone="danger">{err}</Alert></div>}
      {msg && !err && <Alert tone="success">{msg}</Alert>}
      <div className="flex justify-end border-t border-ink-100 pt-4">
        <button className="btn-primary" disabled={!form.current_password || form.new_password.length < 8}>
          Lưu mật khẩu mới
        </button>
      </div>
    </form>
  )
}
