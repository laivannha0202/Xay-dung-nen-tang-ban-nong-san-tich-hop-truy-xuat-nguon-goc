'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from './cart-provider'
import { vnd, qty, FREE_SHIPPING_FROM_VND } from '@/lib/format'
import { mediaUrl } from '@/lib/config'
import { Icon, EmptyState } from '@agrimarket/ui'

export function CartView() {
  const { cart, loading, setQuantity, clear, authed } = useCart()
  const [busy, setBusy] = useState<string | null>(null)

  if (loading && !cart) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton h-20" />)}
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Giỏ hàng đang trống"
        hint="Chọn nông sản theo lô, mỗi lô có mã truy xuất riêng."
        icon="cart"
        action={<Link href="/san-pham" className="btn-primary mt-2">Chọn nông sản</Link>}
      />
    )
  }

  async function update(productId: string, next: number) {
    setBusy(productId)
    try {
      await setQuantity(productId, next)
    } finally {
      setBusy(null)
    }
  }

  const untilFree = FREE_SHIPPING_FROM_VND - cart.subtotal_vnd

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <ul className="card divide-y divide-ink-100">
        {cart.items.map((item) => (
          <li key={item.product_id} className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-50">
              {item.image ? (
                <img src={mediaUrl(item.image) ?? ''} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-brand-300">
                  <Icon name="leaf" className="h-5 w-5" />
                </span>
              )}
            </span>
            <div className="min-w-40 flex-1">
              <Link href={`/san-pham/${item.slug}`} className="font-medium text-ink-900 hover:underline">{item.name}</Link>
              <p className="text-xs text-ink-500">
                {vnd(item.base_price_vnd)}/{item.unit} · còn {qty(item.available)} {item.unit}
              </p>
              {!item.is_available && <p className="mt-0.5 text-xs text-rose-700">Không đủ hàng cho số lượng này.</p>}
            </div>
            <div className="flex items-center rounded-lg border border-ink-200">
              <button
                type="button"
                className="px-3 py-1.5 text-ink-600 disabled:opacity-40"
                aria-label={`Giảm ${item.name}`}
                disabled={busy === item.product_id}
                onClick={() => update(item.product_id, Math.max(0, item.quantity - 1))}
              >
                −
              </button>
              <span className="w-10 text-center text-sm" aria-live="polite">{qty(item.quantity)}</span>
              <button
                type="button"
                className="px-3 py-1.5 text-ink-600 disabled:opacity-40"
                aria-label={`Tăng ${item.name}`}
                disabled={busy === item.product_id || item.quantity >= item.available}
                onClick={() => update(item.product_id, item.quantity + 1)}
              >
                +
              </button>
            </div>
            <p className="w-24 text-right font-medium text-ink-900">{vnd(item.line_total_vnd)}</p>
            <button
              type="button"
              className="btn-ghost btn-sm text-rose-700"
              aria-label={`Xoá ${item.name}`}
              disabled={busy === item.product_id}
              onClick={() => update(item.product_id, 0)}
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <aside className="card-pad h-fit space-y-3 lg:sticky lg:top-32">
        <h2 className="font-semibold text-ink-900">Tạm tính</h2>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-600">Tiền hàng ({cart.item_count} món)</dt>
            <dd className="font-medium">{vnd(cart.subtotal_vnd)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">Phí giao (ước tính)</dt>
            <dd>{cart.ship_fee_estimate_vnd === 0 ? <span className="text-brand-700">Miễn phí</span> : vnd(cart.ship_fee_estimate_vnd)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-semibold">
            <dt>Tổng</dt>
            <dd>{vnd(cart.total_estimate_vnd)}</dd>
          </div>
        </dl>

        {untilFree > 0 && (
          <p className="rounded-lg bg-sand-50 px-2.5 py-2 text-xs text-sand-700">
            Thêm {vnd(untilFree)} để được miễn phí giao hàng.
          </p>
        )}

        {authed ? (
          <Link href="/thanh-toan" className="btn-primary w-full">Tiến hành đặt hàng</Link>
        ) : (
          <Link href="/dang-nhap?next=/gio-hang" className="btn-primary w-full">Đăng nhập để đặt hàng</Link>
        )}
        <button type="button" onClick={clear} className="btn-ghost w-full text-sm">Xoá toàn bộ giỏ</button>
        <p className="text-xs text-ink-500">
          {authed
            ? `Giá và lô được xác nhận lại ở bước thanh toán. Miễn phí giao từ ${vnd(FREE_SHIPPING_FROM_VND)}.`
            : 'Giỏ đang lưu trên thiết bị này. Đăng nhập để kiểm tra lại giá, tồn và gộp vào giỏ tài khoản.'}
        </p>
        <p className="text-xs text-ink-500">
          {'Chỉ giao trong tỉnh Hưng Yên — '}
          {cart.service_area ? `${cart.service_area.serviceable_ward_count}/${cart.service_area.ward_count} xã/phường đang phục vụ.` : 'phí giao được chốt theo xã/phường bạn chọn.'}
        </p>
      </aside>
    </div>
  )
}
