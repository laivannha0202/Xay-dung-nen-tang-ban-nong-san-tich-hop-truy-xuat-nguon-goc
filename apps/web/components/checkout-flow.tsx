'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api, ApiFailure } from '@/lib/api'
import { vnd, qty } from '@/lib/format'
import { useCart } from './cart-provider'

interface Address {
  id: string
  recipient_name: string
  phone: string
  province: string
  district: string
  ward: string
  street_detail: string
  is_default: boolean
}

interface Quote {
  lines: Array<{
    product_id: string
    product_name: string
    unit: string
    quantity: number
    unit_price_vnd: number
    total_vnd: number
    allocations: Array<{ batch_id: string; batch_code: string; qty: number; expiry_date: string; discount_percent: number; discount_vnd: number }>
  }>
  subtotal_vnd: number
  promotion_discount_vnd: number
  ship_fee_vnd: number
  total_vnd: number
  promotion: { code: string; name: string } | null
  version: string
  available_promotions: Array<{ code: string; name: string; type: string; value: number; min_subtotal_vnd: number }>
}

const newIdempotencyKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random()}`

export function CheckoutFlow() {
  const { refresh } = useCart()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressId, setAddressId] = useState('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [method, setMethod] = useState<'COD' | 'BANK_TRANSFER'>('COD')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [idemKey] = useState(newIdempotencyKey)
  const [showAddressForm, setShowAddressForm] = useState(false)

  const loadPreview = useCallback(
    async (code?: string) => {
      try {
        const q = await api<Quote>('/checkout/preview', {
          method: 'POST',
          body: JSON.stringify(code ? { promotion_code: code } : {}),
        })
        setQuote(q)
        setError(null)
        return q
      } catch (e) {
        if (e instanceof ApiFailure) {
          setQuote(null)
          const lines = (e.payload.lines as Array<{ product_name: string; requested: number; available: number }>) ?? []
          setError(
            lines.length
              ? lines.map((l) => `${l.product_name}: cần ${l.requested}, còn ${l.available}`).join('; ')
              : e.payload.message,
          )
        }
        return null
      }
    },
    [],
  )

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const list = await api<Address[]>('/me/addresses')
        if (!alive) return
        setAddresses(list)
        const def = list.find((a) => a.is_default) ?? list[0]
        if (def) setAddressId(def.id)
      } catch {
        /* logged-out users are handled by the caller page */
      }
      await loadPreview()
    })()
    return () => {
      alive = false
    }
  }, [loadPreview])

  async function addAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form.entries())
    try {
      const created = await api<{ id: string }>('/me/addresses', { method: 'POST', body: JSON.stringify(payload) })
      const list = await api<Address[]>('/me/addresses')
      setAddresses(list)
      setAddressId(created.id)
      setShowAddressForm(false)
    } catch (err) {
      setError(err instanceof ApiFailure ? err.payload.message : 'Không thêm được địa chỉ.')
    }
  }

  async function submit() {
    if (!quote || !addressId) return
    setBusy(true)
    setError(null)
    try {
      const res = await api<{ order_id: string; code: string }>('/orders', {
        method: 'POST',
        headers: { 'idempotency-key': idemKey },
        body: JSON.stringify({
          address_id: addressId,
          payment_method: method,
          promotion_code: promoCode || undefined,
          quote_version: quote.version,
          note,
        }),
      })
      await refresh()
      window.location.href = `/dat-hang-thanh-cong/${res.order_id}`
    } catch (e) {
      if (e instanceof ApiFailure && e.payload.code === 'PRICE_CHANGED') {
        // Re-show the fresh quote so the shopper sees the new total before confirming again.
        setQuote((e.payload.quote as Quote) ?? quote)
        setError('Giá hoặc khuyến mãi vừa thay đổi. Vui lòng xem lại tổng tiền rồi xác nhận lần nữa.')
      } else if (e instanceof ApiFailure) {
        setError(e.payload.message)
        void loadPreview()
      } else setError('Không đặt được hàng.')
      setBusy(false)
    }
  }

  if (!quote && error) {
    return (
      <div className="card space-y-3 p-6 text-center">
        <p className="text-red-700">{error}</p>
        <Link href="/gio-hang" className="btn-secondary">Về giỏ hàng</Link>
      </div>
    )
  }
  if (!quote) return <p className="py-10 text-center text-leaf-700">Đang tính giá…</p>

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <section className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Địa chỉ giao hàng</h2>
            <button type="button" className="text-sm text-leaf-700 underline" onClick={() => setShowAddressForm((v) => !v)}>
              {showAddressForm ? 'Đóng' : 'Thêm địa chỉ'}
            </button>
          </div>
          {addresses.length === 0 && !showAddressForm && (
            <p className="text-sm text-leaf-700">Chưa có địa chỉ. Vui lòng thêm địa chỉ giao hàng.</p>
          )}
          <div className="space-y-2">
            {addresses.map((a) => (
              <label key={a.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${addressId === a.id ? 'border-leaf-400 bg-leaf-50' : 'border-leaf-100'}`}>
                <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1" />
                <span>
                  <span className="font-medium">{a.recipient_name}</span> · {a.phone}
                  <br />
                  <span className="text-leaf-700">{a.street_detail}, {a.ward}, {a.district}, {a.province}</span>
                  {a.is_default && <span className="badge ml-2 bg-leaf-100 text-leaf-700">Mặc định</span>}
                </span>
              </label>
            ))}
          </div>
          {showAddressForm && (
            <form onSubmit={addAddress} className="mt-3 grid gap-2 sm:grid-cols-2">
              <input name="recipient_name" className="input" placeholder="Tên người nhận" required />
              <input name="phone" className="input" placeholder="Số điện thoại" inputMode="tel" required />
              <input name="province" className="input" placeholder="Tỉnh/Thành" required />
              <input name="district" className="input" placeholder="Quận/Huyện" required />
              <input name="ward" className="input" placeholder="Phường/Xã" required />
              <input name="street_detail" className="input sm:col-span-2" placeholder="Số nhà, đường" required />
              <button className="btn-secondary sm:col-span-2">Lưu địa chỉ</button>
            </form>
          )}
        </section>

        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Kiện hàng sẽ được lấy từ</h2>
          <ul className="space-y-2 text-sm">
            {quote.lines.map((l) => (
              <li key={l.product_id} className="rounded-lg bg-leaf-50/70 p-3">
                <p className="font-medium">{l.product_name} · {qty(l.quantity)} {l.unit}</p>
                <ul className="mt-1 space-y-0.5 text-xs text-leaf-700">
                  {l.allocations.map((a) => (
                    <li key={a.batch_id}>
                      Lô {a.batch_code} — {qty(a.qty)} {l.unit}
                      {a.discount_percent > 0 && (
                        <span className="ml-1 text-clay-700">(cận hạn −{a.discount_percent}%: −{vnd(a.discount_vnd)})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-leaf-600">
            Hệ thống ưu tiên lô nhập trước; phần lấy từ lô cận hạn được giảm giá riêng và hiển thị minh bạch.
          </p>
        </section>

        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Thanh toán</h2>
          <div className="space-y-2 text-sm">
            {[
              { v: 'COD' as const, label: 'Thanh toán khi nhận hàng (COD)' },
              { v: 'BANK_TRANSFER' as const, label: 'Chuyển khoản ngân hàng (Admin xác nhận thủ công)' },
            ].map((o) => (
              <label key={o.v} className="flex items-center gap-2">
                <input type="radio" name="method" checked={method === o.v} onChange={() => setMethod(o.v)} />
                {o.label}
              </label>
            ))}
          </div>
          <label className="label mt-3" htmlFor="note">Ghi chú cho người bán</label>
          <textarea id="note" className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: giao ngoài giờ hành chính" />
        </section>
      </div>

      <aside className="card h-fit space-y-3 p-4">
        <h2 className="font-semibold">Xác nhận đơn</h2>
        <div className="flex gap-2">
          <input className="input" placeholder="Mã khuyến mãi" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
          <button type="button" className="btn-secondary shrink-0" onClick={() => loadPreview(promoCode || undefined)}>Áp dụng</button>
        </div>
        {quote.available_promotions.length > 0 && (
          <ul className="space-y-1 text-xs text-leaf-700">
            {quote.available_promotions.map((p) => (
              <li key={p.code}>
                <button type="button" className="underline" onClick={() => { setPromoCode(p.code); void loadPreview(p.code) }}>
                  {p.code}
                </button>{' '}
                — {p.name} ({p.type === 'PERCENT' ? `−${p.value}%` : `−${vnd(p.value)}`})
              </li>
            ))}
          </ul>
        )}
        <dl className="space-y-1.5 border-t border-leaf-100 pt-2 text-sm">
          <div className="flex justify-between"><dt className="text-leaf-600">Tiền hàng</dt><dd>{vnd(quote.subtotal_vnd)}</dd></div>
          {quote.promotion_discount_vnd > 0 && (
            <div className="flex justify-between text-leaf-700"><dt>Mã {quote.promotion?.code}</dt><dd>−{vnd(quote.promotion_discount_vnd)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-leaf-600">Phí giao</dt><dd>{quote.ship_fee_vnd === 0 ? 'Miễn phí' : vnd(quote.ship_fee_vnd)}</dd></div>
          <div className="flex justify-between border-t border-leaf-100 pt-2 text-base font-semibold"><dt>Tổng cộng</dt><dd>{vnd(quote.total_vnd)}</dd></div>
        </dl>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button type="button" className="btn-primary w-full" disabled={busy || !addressId} onClick={submit}>
          {busy ? 'Đang đặt…' : 'Xác nhận đặt hàng'}
        </button>
        <p className="text-xs text-leaf-600">
          Bằng việc đặt hàng, bạn đồng ý nhận hàng theo lô đã hiển thị. Tồn kho được giữ chỗ ngay khi xác nhận.
        </p>
      </aside>
    </div>
  )
}
