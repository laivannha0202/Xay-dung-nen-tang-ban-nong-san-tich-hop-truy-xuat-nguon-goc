'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icon } from '@agrimarket/ui'
import { api, ApiFailure } from '@/lib/api'
import { useCart } from '@/components/cart-provider'
import { vnd, qty } from '@/lib/format'

interface ReorderItem {
  product_id: string
  product_name: string
  slug: string | null
  unit: string
  quantity: number
  base_price_vnd: number | null
  available: number
  unavailable_reason: string | null
}

interface ReorderResult {
  items: ReorderItem[]
  skipped: ReorderItem[]
}

/**
 * "Mua lại": the API re-reads price, stock and product status. Anything that cannot be
 * bought today is shown as skipped with the reason — never silently added at an old price.
 */
export function BuyAgain({ orderId }: { orderId: string }) {
  const { setQuantity } = useCart()
  const [preview, setPreview] = useState<ReorderResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setBusy(true)
    setError(null)
    try {
      const r = await api<ReorderResult>(`/me/orders/${orderId}/reorder`)
      setPreview(r)
    } catch (e) {
      setError(e instanceof ApiFailure ? e.payload.message : 'Không kiểm tra được đơn cũ.')
    } finally {
      setBusy(false)
    }
  }

  async function addAll() {
    if (!preview) return
    setBusy(true)
    try {
      // Each line is set to its own quantity after the server's stock cap; the server
      // rejects anything above availability, so no silent overselling.
      for (const item of preview.items) await setQuantity(item.product_id, item.quantity)
      setDone(`${preview.items.length} sản phẩm đã thêm vào giỏ — kiểm tra lại giá và lô trước khi đặt.`)
      setPreview(null)
    } catch (e) {
      setError(e instanceof ApiFailure ? e.payload.message : 'Không thêm được vào giỏ.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card-pad space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold text-ink-900">Mua lại đơn này</h2>
          <p className="page-sub mt-0.5">Giá, tồn kho và trạng thái sản phẩm được kiểm tra lại hiện tại.</p>
        </div>
        {!preview && (
          <button type="button" className="btn-secondary ml-auto" onClick={load} disabled={busy}>
            <Icon name="cart" className="h-4 w-4" /> {busy ? 'Đang kiểm tra…' : 'Mua lại'}
          </button>
        )}
      </div>

      {done && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{done} <Link href="/gio-hang" className="font-semibold underline">Mở giỏ hàng</Link></p>}
      {error && <p className="error-text" role="alert">{error}</p>}

      {preview && (
        <>
          {preview.items.length === 0 ? (
            <p className="text-sm text-ink-600">Không có sản phẩm nào trong đơn còn mua được.</p>
          ) : (
            <ul className="divide-y divide-ink-100 rounded-lg border border-ink-200">
              {preview.items.map((i) => (
                <li key={i.product_id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                  {i.slug ? (
                    <Link href={`/san-pham/${i.slug}`} className="min-w-0 flex-1 font-medium text-ink-900 hover:underline">{i.product_name}</Link>
                  ) : (
                    <span className="min-w-0 flex-1 font-medium text-ink-900">{i.product_name}</span>
                  )}
                  <span className="tabular-nums text-ink-700">{qty(i.quantity)} {i.unit}</span>
                  <span className="tabular-nums text-ink-900">{i.base_price_vnd === null ? '—' : vnd(i.base_price_vnd)}</span>
                  {i.unavailable_reason && <span className="text-xs text-sand-700">{i.unavailable_reason}</span>}
                </li>
              ))}
            </ul>
          )}

          {preview.skipped.length > 0 && (
            <div className="rounded-lg bg-sand-50 px-3 py-2 text-xs text-sand-700">
              <p className="font-medium">Không thêm được:</p>
              <ul className="mt-1 space-y-0.5">
                {preview.skipped.map((i) => (
                  <li key={i.product_id}>{i.product_name} — {i.unavailable_reason ?? 'không đủ hàng'}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" className="btn-buy" onClick={addAll} disabled={busy || preview.items.length === 0}>
              {busy ? 'Đang thêm…' : `Thêm ${preview.items.length} sản phẩm vào giỏ`}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setPreview(null)}>Đóng</button>
          </div>
        </>
      )}
    </section>
  )
}
