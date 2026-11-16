'use client'

import { useState } from 'react'
import { Alert } from '@agrimarket/ui'
import { useCart } from './cart-provider'
import { api, ApiFailure } from '@/lib/api'

import { ADMIN_WEB } from '@/lib/config'

export function AddToCart({
  productId,
  unit,
  available,
  sku,
  name,
  slug,
  basePrice,
  image,
}: {
  productId: string
  unit: string
  available: number
  sku: string
  name: string
  slug: string
  basePrice: number
  image: string | null
}) {
  const { authed, setQuantity, addGuest, cart } = useCart()
  const [qty, setQty] = useState(1)
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const out = available <= 0

  const current = cart?.items.find((i) => i.product_id === productId)?.quantity ?? 0

  async function submit(goToCart: boolean) {
    setState('busy')
    setError(null)
    try {
      // Guests keep a local cart (CUS-05-04); it is merged into the server cart on login.
      if (!authed) {
        await addGuest(
          { product_id: productId, quantity: 0, sku, name, slug, unit, base_price_vnd: basePrice, image, available },
          Math.min(qty, available),
        )
      } else {
        await setQuantity(productId, Math.min(qty + current, available))
      }
      setState('done')
      if (goToCart) window.location.href = '/gio-hang'
    } catch (e) {
      setError(
        e instanceof ApiFailure
          ? e.payload.code === 'UNAUTHENTICATED'
            ? 'Vui lòng đăng nhập để thêm vào giỏ.'
            : e.payload.message
          : 'Không thêm được vào giỏ.',
      )
      setState('idle')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border border-ink-200 bg-white">
          <button type="button" className="btn-ghost px-3 py-2 text-lg" onClick={() => setQty((q) => Math.max(0.5, q - 1))} aria-label="Giảm">−</button>
          <input
            type="number"
            className="w-16 border-0 bg-transparent px-1 py-2 text-center tabular-nums outline-none"
            value={qty}
            min={0.5}
            step={0.5}
            onChange={(e) => setQty(Number(e.target.value) || 0.5)}
          />
          <button type="button" className="btn-ghost px-3 py-2 text-lg" onClick={() => setQty((q) => q + 1)} aria-label="Tăng">+</button>
        </div>
        <span className="text-sm text-ink-600">{unit}</span>
        {current > 0 && <span className="text-sm text-ink-500">Đang có {current} {unit} trong giỏ</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={out || state === 'busy'} onClick={() => submit(false)} className="btn-primary">
          {out ? 'Tạm hết hàng' : state === 'done' ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
        </button>
        <button type="button" disabled={out || state === 'busy'} onClick={() => submit(true)} className="btn-secondary">
          Mua ngay
        </button>
      </div>
      {error && (
        <Alert tone="danger">
          {error}{' '}
          <a href="/dang-nhap" className="underline">Đăng nhập</a>
        </Alert>
      )}
      <p className="hint">
        Còn lại {available} {unit} từ các lô đủ điều kiện bán.
      </p>
    </div>
  )
}

export function LoginForm({ next }: { next?: string }) {
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
      // Admins land on the other site; the storefront does not render admin routes.
      window.location.href = next ?? (res.user.role === 'ADMIN' ? `${ADMIN_WEB}/admin` : '/tai-khoan')
    } catch (err) {
      setError(err instanceof ApiFailure ? err.payload.message : 'Đăng nhập thất bại.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card-pad space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="password">Mật khẩu</label>
        <input id="password" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <div role="alert"><Alert tone="danger">{error}</Alert></div>}
      <button className="btn-primary w-full" disabled={busy} aria-busy={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
    </form>
  )
}

export function RegisterForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setMessage(null)
    try {
      await api('/auth/customer/register', { method: 'POST', body: JSON.stringify(form) })
      window.location.href = '/tai-khoan'
    } catch (err) {
      if (err instanceof ApiFailure) {
        setErrors(err.payload.field_errors ?? {})
        setMessage(err.payload.message)
      } else setMessage('Đăng ký thất bại.')
      setBusy(false)
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <form onSubmit={submit} className="card-pad space-y-4">
      <div>
        <label className="label" htmlFor="name">Họ tên</label>
        <input id="name" className="input" required {...field('name')} />
        {errors.name && <p className="error-text">{errors.name}</p>}
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" className="input" required {...field('email')} />
        {errors.email && <p className="error-text">{errors.email}</p>}
      </div>
      <div>
        <label className="label" htmlFor="phone">Số điện thoại</label>
        <input id="phone" className="input" inputMode="tel" required {...field('phone')} />
        {errors.phone && <p className="error-text">{errors.phone}</p>}
      </div>
      <div>
        <label className="label" htmlFor="password">Mật khẩu</label>
        <input id="password" type="password" className="input" required minLength={8} {...field('password')} />
        {errors.password && <p className="error-text">{errors.password}</p>}
      </div>
      {message && <div role="alert"><Alert tone="danger">{message}</Alert></div>}
      <button className="btn-primary w-full" disabled={busy} aria-busy={busy}>{busy ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}</button>
    </form>
  )
}
