'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from './cart-provider'
import { vnd, qty } from '@/lib/format'

export function CartView() {
  const { cart, loading, setQuantity, clear } = useCart()
  const [busy, setBusy] = useState<string | null>(null)

  if (loading && !cart) return <p className="py-10 text-center text-leaf-700">Đang tải giỏ hàng…</p>
  if (!cart) {
    return (
      <div className="card p-8 text-center">
        <p className="text-leaf-800">Bạn cần đăng nhập để xem giỏ hàng.</p>
        <Link href="/dang-nhap?next=/gio-hang" className="btn-primary mt-3">Đăng nhập</Link>
      </div>
    )
  }
  if (cart.items.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-leaf-800">Giỏ hàng đang trống.</p>
        <Link href="/san-pham" className="btn-primary mt-3">Chọn nông sản</Link>
      </div>
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

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <ul className="card divide-y divide-leaf-50">
        {cart.items.map((item) => (
          <li key={item.product_id} className="flex flex-wrap items-center gap-3 p-4">
            <img
              src={item.image ?? ''}
              alt={item.name}
              className="h-16 w-16 rounded-lg bg-leaf-50 object-cover"
            />
            <div className="min-w-40 flex-1">
              <Link href={`/san-pham/${item.slug}`} className="font-medium hover:underline">{item.name}</Link>
              <p className="text-xs text-leaf-600">
                {vnd(item.base_price_vnd)}/{item.unit} · còn {qty(item.available)} {item.unit}
              </p>
              {!item.is_available && <p className="text-xs text-red-700">Hiện không đủ hàng để mua.</p>}
            </div>
            <div className="flex items-center rounded-lg border border-leaf-200">
              <button type="button" className="px-3 py-1.5" disabled={busy === item.product_id} onClick={() => update(item.product_id, Math.max(0, item.quantity - 1))}>−</button>
              <span className="w-12 text-center text-sm">{qty(item.quantity)}</span>
              <button type="button" className="px-3 py-1.5" disabled={busy === item.product_id} onClick={() => update(item.product_id, item.quantity + 1)}>+</button>
            </div>
            <p className="w-24 text-right font-medium">{vnd(item.line_total_vnd)}</p>
            <button type="button" className="text-xs text-red-700 underline" disabled={busy === item.product_id} onClick={() => update(item.product_id, 0)}>
              Xóa
            </button>
          </li>
        ))}
      </ul>

      <aside className="card h-fit space-y-3 p-4">
        <h2 className="font-semibold">Tạm tính</h2>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-leaf-600">Tiền hàng</dt><dd>{vnd(cart.subtotal_vnd)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-leaf-600">Phí giao (ước tính)</dt>
            <dd>{cart.ship_fee_estimate_vnd === 0 ? 'Miễn phí' : vnd(cart.ship_fee_estimate_vnd)}</dd>
          </div>
          <div className="flex justify-between border-t border-leaf-100 pt-2 text-base font-semibold">
            <dt>Tổng</dt><dd>{vnd(cart.total_estimate_vnd)}</dd>
          </div>
        </dl>
        <Link href="/thanh-toan" className="btn-primary w-full">Tiến hành đặt hàng</Link>
        <button type="button" onClick={clear} className="btn-ghost w-full text-sm">Xóa toàn bộ giỏ</button>
        <p className="text-xs text-leaf-600">
          Giá và lô hàng được xác nhận lại ở bước thanh toán. Miễn phí giao từ {vnd(500000)}.
        </p>
      </aside>
    </div>
  )
}
