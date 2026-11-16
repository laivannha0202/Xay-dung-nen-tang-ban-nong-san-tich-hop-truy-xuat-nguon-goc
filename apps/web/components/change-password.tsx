'use client'

import { useState } from 'react'
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
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-3 p-5">
      <h1 className="font-semibold">Đổi mật khẩu</h1>
      <div>
        <label className="label" htmlFor="cur">Mật khẩu hiện tại</label>
        <input id="cur" type="password" className="input" required value={form.current_password} onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))} />
      </div>
      <div>
        <label className="label" htmlFor="new">Mật khẩu mới</label>
        <input id="new" type="password" className="input" required minLength={8} value={form.new_password} onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))} />
      </div>
      {err && <p className="text-sm text-red-700">{err}</p>}
      {msg && <p className="text-sm text-leaf-800">{msg}</p>}
      <button className="btn-primary w-full">Lưu</button>
    </form>
  )
}
