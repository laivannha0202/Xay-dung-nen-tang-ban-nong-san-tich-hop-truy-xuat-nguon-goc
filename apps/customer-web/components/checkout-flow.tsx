'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api, ApiFailure } from '@/lib/api'
import { vnd, qty, dateVN } from '@/lib/format'
import { useCart } from './cart-provider'
import { addressLine } from './address-book'
import { WardPicker } from './ward-picker'
import type { Address } from '@agrimarket/core'
import { Icon, Badge, SectionHeader, EmptyState, Alert } from '@agrimarket/ui'

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
  ship_fee_final: boolean
  address_status: 'MISSING' | 'OUTSIDE_SERVICE_AREA' | 'NEEDS_UPDATE' | 'OK'
  ward_name: string | null
  available_promotions: Array<{ code: string; name: string; type: string; value: number; min_subtotal_vnd: number }>
}

const ADDRESS_ERROR: Record<Quote['address_status'], string | null> = {
  OK: null,
  MISSING: 'Chọn địa chỉ giao hàng trong tỉnh Hưng Yên để chốt phí giao.',
  OUTSIDE_SERVICE_AREA: 'AgriMarket chỉ giao trong tỉnh Hưng Yên. Chọn xã/phường khác hoặc thêm địa chỉ mới.',
  NEEDS_UPDATE: 'Địa chỉ này nhập trước khi cập nhật địa giới. Vui lòng chọn lại xã/phường.',
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
  const [wardCode, setWardCode] = useState('')
  const [addressError, setAddressError] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ name: string | null; phone: string | null } | null>(null)

  const loadPreview = useCallback(
    async (code?: string, addrId?: string) => {
      try {
        const q = await api<Quote>('/checkout/preview', {
          method: 'POST',
          body: JSON.stringify({ promotion_code: code ?? null, address_id: addrId || null }),
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
      let addrId: string | undefined
      try {
        const [list, me] = await Promise.all([
          api<Address[]>('/me/addresses'),
          api<{ name: string | null; phone: string | null }>('/me'),
        ])
        if (!alive) return
        setAddresses(list)
        setProfile({ name: me.name, phone: me.phone })
        const def = list.find((a) => a.is_default && a.ward_code) ?? list.find((a) => a.ward_code) ?? list[0]
        if (def) {
          setAddressId(def.id)
          addrId = def.id
        }
      } catch {
        /* logged-out users are handled by the caller page */
      }
      // The quote always reflects the address that is actually selected: changing it
      // re-quotes, so the fee the shopper confirms is the fee the order is charged.
      await loadPreview(undefined, addrId)
    })()
    return () => {
      alive = false
    }
  }, [loadPreview])

  async function addAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    if (!wardCode) {
      setAddressError('Chọn xã/phường nhận hàng trong tỉnh Hưng Yên.')
      return
    }
    try {
      const created = await api<{ id: string }>('/me/addresses', {
        method: 'POST',
        body: JSON.stringify({ ...Object.fromEntries(form.entries()), ward_code: wardCode }),
      })
      const list = await api<Address[]>('/me/addresses')
      setAddresses(list)
      setAddressId(created.id)
      setShowAddressForm(false)
      setAddressError(null)
      setWardCode('')
      await loadPreview(promoCode || undefined, created.id)
    } catch (err) {
      setAddressError(err instanceof ApiFailure ? err.payload.message : 'Không thêm được địa chỉ.')
    }
  }

  async function chooseAddress(id: string) {
    setAddressId(id)
    await loadPreview(promoCode || undefined, id)
  }

  async function submit() {
    if (!quote || !addressId || quote.address_status !== 'OK') return
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
      <div className="surface space-y-3 p-6 text-center">
        <p className="error-text">{error}</p>
        <Link href="/gio-hang" className="btn-secondary">Về giỏ hàng</Link>
      </div>
    )
  }
  if (!quote) {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="skeleton h-40" />
          <div className="skeleton h-32" />
        </div>
        <div className="skeleton h-64" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="space-y-4">
        <section className="surface p-5 sm:p-6">
          <SectionHeader
            title="1 · Địa chỉ giao hàng"
            hint="Chọn nơi nhận hàng cho đơn này."
            action={
              <button type="button" className="btn-ghost btn-sm" onClick={() => setShowAddressForm((v) => !v)}>
                <Icon name={showAddressForm ? 'close' : 'plus'} className="h-4 w-4" />
                {showAddressForm ? 'Đóng' : 'Thêm địa chỉ'}
              </button>
            }
          />
          {addresses.length === 0 && !showAddressForm && (
            <EmptyState title="Chưa có địa chỉ" hint="Thêm địa chỉ giao hàng để tiếp tục đặt hàng." icon="pin" />
          )}
          <div className="space-y-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors ${
                  addressId === a.id ? 'border-brand-400 bg-brand-50' : 'border-ink-200 hover:border-ink-300'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={addressId === a.id}
                  onChange={() => void chooseAddress(a.id)}
                  className="mt-1 h-4 w-4"
                />
                <span className="min-w-0">
                  <span className="font-medium text-ink-900">{a.recipient_name}</span>
                  <span className="text-ink-600"> · {a.phone}</span>
                  <span className="mt-0.5 block text-ink-600">{addressLine(a)}</span>
                  {(a.is_default || a.needs_confirmation || a.in_service_area === false) && (
                    <span className="mt-1 flex flex-wrap gap-1">
                      {a.is_default && <Badge tone="info">Mặc định</Badge>}
                      {a.needs_confirmation && <Badge tone="warning">Cần chọn lại xã/phường</Badge>}
                      {a.in_service_area === false && <Badge tone="danger">Ngoài vùng giao</Badge>}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
          {showAddressForm && (
            <form onSubmit={addAddress} className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="co-province">Tỉnh/Thành</label>
                <input id="co-province" className="input bg-ink-50" value="Tỉnh Hưng Yên" readOnly aria-readonly />
              </div>
              <WardPicker value={wardCode} onChange={(code) => setWardCode(code)} id="co-ward" invalid={!wardCode} />
              <input
                name="recipient_name"
                className="input"
                placeholder="Tên người nhận"
                defaultValue={profile?.name ?? ''}
                required
              />
              <input
                name="phone"
                className="input"
                placeholder="Số điện thoại"
                inputMode="tel"
                defaultValue={profile?.phone ?? ''}
                required
              />
              <input
                name="street_detail"
                className="input sm:col-span-2"
                placeholder="Số nhà, đường, thôn/tổ dân phố"
                required
              />
              {addressError && <div className="sm:col-span-2"><Alert tone="danger">{addressError}</Alert></div>}
              <button className="btn-secondary sm:col-span-2">Lưu địa chỉ</button>
            </form>
          )}
        </section>

        <section className="surface p-5 sm:p-6">
          <SectionHeader
            title="2 · Thanh toán"
            hint="Hệ thống ưu tiên lô nhập trước; phần lấy từ lô cận hạn được giảm giá riêng và hiển thị minh bạch."
          />
          <div className="space-y-1.5 text-sm">
            {[
              { v: 'COD' as const, label: 'Thanh toán khi nhận hàng (COD)' },
              { v: 'BANK_TRANSFER' as const, label: 'Chuyển khoản ngân hàng (Admin xác nhận thủ công)' },
            ].map((o) => (
              <label key={o.v} className="flex items-center gap-2 text-ink-700">
                <input type="radio" name="method" checked={method === o.v} onChange={() => setMethod(o.v)} />
                {o.label}
              </label>
            ))}
          </div>
          <label className="label mt-4" htmlFor="note">Ghi chú cho người bán</label>
          <textarea
            id="note"
            className="input"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: giao ngoài giờ hành chính"
          />
        </section>

        <section className="surface p-5 sm:p-6">
          <SectionHeader title="3 · Xem lại" hint="Các lô hàng sẽ được lấy cho đơn của bạn." />
          <div className="overflow-x-auto rounded-lg border border-ink-100">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Lô</th>
                  <th className="text-right">Số lượng</th>
                  <th>Hạn dùng</th>
                  <th className="text-right">Giảm giá</th>
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((l) =>
                  l.allocations.map((a) => (
                    <tr key={`${l.product_id}-${a.batch_id}`}>
                      <td className="font-medium text-ink-900">{l.product_name}</td>
                      <td className="text-ink-600">{a.batch_code}</td>
                      <td className="text-right tabular-nums">
                        {qty(a.qty)} {l.unit}
                      </td>
                      <td className="text-ink-600">{dateVN(a.expiry_date)}</td>
                      <td className="text-right tabular-nums">
                        {a.discount_percent > 0 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Badge tone="warning">−{a.discount_percent}%</Badge>
                            <span className="text-ink-600">−{vnd(a.discount_vnd)}</span>
                          </span>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside className="surface h-fit space-y-4 p-5 lg:sticky lg:top-32">
        <h2 className="text-base font-semibold text-ink-900">Xác nhận đơn</h2>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Mã khuyến mãi"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          />
          <button type="button" className="btn-secondary shrink-0" onClick={() => loadPreview(promoCode || undefined)}>
            Áp dụng
          </button>
        </div>
        {quote.available_promotions.length > 0 && (
          <ul className="space-y-1 text-xs text-ink-600">
            {quote.available_promotions.map((p) => (
              <li key={p.code}>
                <button
                  type="button"
                  className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
                  onClick={() => {
                    setPromoCode(p.code)
                    void loadPreview(p.code)
                  }}
                >
                  {p.code}
                </button>{' '}
                — {p.name} ({p.type === 'PERCENT' ? `−${p.value}%` : `−${vnd(p.value)}`})
              </li>
            ))}
          </ul>
        )}
        <dl className="space-y-1.5 border-t border-ink-100 pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-600">Tiền hàng</dt>
            <dd className="tabular-nums text-ink-900">{vnd(quote.subtotal_vnd)}</dd>
          </div>
          {quote.promotion_discount_vnd > 0 && (
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-ink-600">
                Khuyến mãi
                {quote.promotion?.code && <Badge tone="success">{quote.promotion.code}</Badge>}
              </dt>
              <dd className="tabular-nums font-medium text-brand-700">−{vnd(quote.promotion_discount_vnd)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-ink-600">{quote.ship_fee_final ? 'Phí giao' : 'Phí giao (tạm tính)'}</dt>
            <dd className="tabular-nums text-ink-900">{quote.ship_fee_vnd === 0 ? 'Miễn phí' : vnd(quote.ship_fee_vnd)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-ink-100 pt-2.5 text-base font-semibold text-ink-900">
            <dt>Tổng cộng</dt>
            <dd className="tabular-nums">{vnd(quote.total_vnd)}</dd>
          </div>
        </dl>
        {quote.ward_name && (
          <p className="text-xs text-ink-600">Giao đến {quote.ward_name}, Tỉnh Hưng Yên {quote.ship_fee_final ? '' : '(chọn địa chỉ để chốt phí)'}</p>
        )}
        {error && <Alert tone="danger">{error}</Alert>}
        {!error && ADDRESS_ERROR[quote.address_status] && <Alert tone="warning">{ADDRESS_ERROR[quote.address_status]}</Alert>}
        <button
          type="button"
          className="btn-primary w-full"
          disabled={busy || quote.address_status !== 'OK'}
          onClick={submit}
        >
          {busy ? 'Đang đặt…' : 'Xác nhận đặt hàng'}
        </button>
        <p className="text-xs text-ink-600">
          Bằng việc đặt hàng, bạn đồng ý nhận hàng theo lô đã hiển thị. Tồn kho được giữ chỗ ngay khi xác nhận.
        </p>
      </aside>
    </div>
  )
}
