'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@agrimarket/ui'
import { api, ApiFailure } from '@/lib/api'

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await api<{ user: { role: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (res.user.role !== 'ADMIN') {
        setError('Tài khoản này không có quyền quản trị.')
        setBusy(false)
        return
      }
      router.replace('/admin')
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiFailure ? err.payload.message : 'Đăng nhập thất bại.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card-pad space-y-4">
      <div>
        <label className="label" htmlFor="email">Email quản trị</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@agrimarket.vn"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">Mật khẩu</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
      <p className="hint flex items-center gap-1.5">
        <Icon name="shield" className="h-3.5 w-3.5" />
        Chỉ tài khoản vai trò quản trị truy cập được khu vực này.
      </p>
    </form>
  )
}
