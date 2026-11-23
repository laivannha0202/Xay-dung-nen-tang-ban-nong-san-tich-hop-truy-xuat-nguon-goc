'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, ApiFailure } from '@/lib/api'
import { vnd } from '@/lib/format'
import { EmptyState, SectionHeader } from '@agrimarket/ui'
import { VoucherCard } from '@/components/voucher-card'
import { useCart } from '@/components/cart-provider'
import type { Voucher } from '@agrimarket/core'

interface WalletPayload {
  subtotal_vnd: number
  items: Voucher[]
}

const GROUPS: Array<{ key: 'usable' | 'short' | 'done'; title: string; hint: string }> = [
  { key: 'usable', title: 'Có thể sử dụng', hint: 'Đủ điều kiện với giỏ hàng hiện tại của bạn.' },
  { key: 'short', title: 'Chưa đủ điều kiện', hint: 'Thêm hàng để dùng được các mã này.' },
  { key: 'done', title: 'Đã hết hạn hoặc hết lượt', hint: 'Không còn dùng được — có thể bỏ lưu.' },
]

/** Wallet is server-owned: saving is a row in the API, so web and app see the same list. */
export function VoucherWallet() {
  const { cart } = useCart()
  const [data, setData] = useState<WalletPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      setData(await api<WalletPayload>('/me/promotions'))
      setError(null)
    } catch (e) {
      setError(e instanceof ApiFailure ? e.payload.message : 'Không tải được ví voucher.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton h-28" />)}
      </div>
    )
  }
  if (error) return <p className="error-text">{error}</p>

  const items = data?.items ?? []
  if (items.length === 0) {
    return (
      <EmptyState
        icon="promotion"
        title="Ví voucher đang trống"
        hint="Lưu mã ưu đãi để dùng nhanh khi thanh toán."
        action={<Link href="/uu-dai" className="btn-primary btn-sm">Xem ưu đãi AgriMarket</Link>}
      />
    )
  }

  const buckets = {
    usable: items.filter((v) => v.state === 'AVAILABLE'),
    short: items.filter((v) => v.state === 'MIN_SUBTOTAL' || v.state === 'UPCOMING'),
    done: items.filter((v) => v.state === 'EXPIRED' || v.state === 'PAUSED' || v.state === 'USED_UP'),
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-600">
        {items.length} voucher đã lưu
        {cart && cart.item_count > 0 && ` · giỏ hàng hiện tại ${vnd(cart.subtotal_vnd)}`}
      </p>
      {GROUPS.map((g) => {
        const list = buckets[g.key]
        if (list.length === 0) return null
        return (
          <section key={g.key} className="space-y-2.5">
            <SectionHeader title={`${g.title} (${list.length})`} hint={g.hint} />
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {list.map((v) => (
                <li key={v.id}>
                  <VoucherCard voucher={v} onSavedChange={() => void load()} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      <p className="text-xs text-ink-500">
        Voucher dùng được sẽ xuất hiện khi bạn thanh toán. Bỏ lưu không xoá chương trình và không ảnh hưởng lượt dùng.
      </p>
    </div>
  )
}
