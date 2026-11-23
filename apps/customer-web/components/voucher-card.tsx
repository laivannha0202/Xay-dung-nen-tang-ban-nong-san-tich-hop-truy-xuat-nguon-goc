'use client'

import { useState } from 'react'
import { api, ApiFailure } from '@/lib/api'
import { vnd, dateVN } from '@/lib/format'
import { Icon } from '@agrimarket/ui'
import type { Voucher } from '@agrimarket/core'

/** Ticket-shaped voucher card shared by the offer board, the wallet and checkout. */
export function VoucherCard({
  voucher,
  onSavedChange,
  onUse,
  canSave = true,
  useLabel = 'Dùng ngay',
}: {
  voucher: Voucher
  /** Re-read the list after a save/unsave; the server owns `saved`, never local state alone. */
  onSavedChange?: (code: string, saved: boolean) => void
  /** False for a guest: the wallet is per account, so there is nowhere to save it. */
  canSave?: boolean
  onUse?: (code: string) => void
  useLabel?: string
}) {
  const [saved, setSaved] = useState(voucher.saved)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const usable = voucher.state === 'AVAILABLE'
  const dead = voucher.state === 'EXPIRED' || voucher.state === 'PAUSED' || voucher.state === 'USED_UP'

  async function toggleSave() {
    setBusy(true)
    setError(null)
    try {
      if (saved) {
        await api(`/me/promotions/${voucher.id}`, { method: 'DELETE' })
        setSaved(false)
        onSavedChange?.(voucher.code, false)
      } else {
        await api(`/me/promotions/${voucher.id}`, { method: 'POST' })
        setSaved(true)
        onSavedChange?.(voucher.code, true)
      }
    } catch (e) {
      setError(e instanceof ApiFailure ? e.payload.message : 'Không lưu được voucher.')
    } finally {
      setBusy(false)
    }
  }

  const value = voucher.type === 'PERCENT' ? `${voucher.value}%` : vnd(voucher.value)

  return (
    <article
      className={`flex min-w-0 overflow-hidden rounded-[var(--radius-card)] border bg-white ${
        dead ? 'border-ink-200 opacity-70' : 'border-brand-200'
      }`}
    >
      <div className="grid w-24 shrink-0 place-items-center bg-buy-100 px-2 py-4 text-center sm:w-28">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-sand-700 uppercase">Giảm</p>
          <p className="mt-0.5 text-lg leading-tight font-bold break-words text-ink-900">{value}</p>
          {voucher.type === 'AMOUNT' && <p className="text-[11px] text-ink-600">tiền hàng</p>}
        </div>
      </div>
      <div className="min-w-0 flex-1 border-l border-dashed border-brand-200 p-3 sm:p-4">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-ink-900">{voucher.name}</h3>
            <p className="mt-1 inline-flex items-center gap-1 rounded bg-ink-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-ink-800">
              <Icon name="promotion" className="h-3 w-3 text-brand-600" />
              {voucher.code}
            </p>
          </div>
          {voucher.saved && (
            <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
              Đã lưu
            </span>
          )}
        </div>

        <p className="mt-2 text-xs leading-snug text-ink-600">
          {voucher.min_subtotal_vnd > 0 ? `Đơn từ ${vnd(voucher.min_subtotal_vnd)}` : 'Mọi đơn hàng'}
          {voucher.usage_limit !== null && ` · ${voucher.usage_limit.toLocaleString('vi-VN')} lượt/tháng`}
        </p>
        <p className="text-xs text-ink-500">
          {usable ? 'Hạn dùng' : 'Thời gian'} {dateVN(voucher.start_at)} – {dateVN(voucher.end_at)}
        </p>
        {!usable && voucher.reason && (
          <p className={`mt-1.5 text-xs font-medium ${dead ? 'text-rose-700' : 'text-sand-700'}`}>{voucher.reason}</p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {onUse && (
            <button
              type="button"
              className={usable ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              disabled={!usable}
              onClick={() => onUse(voucher.code)}
            >
              {usable ? `${useLabel} · −${vnd(voucher.discount_vnd)}` : 'Chưa dùng được'}
            </button>
          )}
          {canSave && (
            <button
              type="button"
              className={saved ? 'btn-ghost btn-sm' : 'btn-secondary btn-sm'}
              disabled={busy || dead}
              onClick={() => void toggleSave()}
            >
              <Icon name={saved ? 'check' : 'heart'} className="h-3.5 w-3.5" />
              {busy ? 'Đang lưu…' : saved ? 'Bỏ lưu' : 'Lưu voucher'}
            </button>
          )}
        </div>
        {error && <p className="error-text mt-1.5">{error}</p>}
      </div>
    </article>
  )
}
