'use client'

import { useState } from 'react'
import { api, ApiFailure } from '@/lib/api'
import { vnd } from '@/lib/format'
import { Icon } from '@agrimarket/ui'
import type { Voucher } from '@agrimarket/core'

/**
 * Checkout voucher picker: the shopper's wallet first, then the public board, then a code
 * they typed. Every pick re-quotes on the server with the *current* address, so the fee and
 * the discount can never come from two different carts.
 */
export function VoucherPicker({
  current,
  vouchers,
  subtotal,
  busy,
  onApply,
  onRemove,
  error,
}: {
  current: { code: string; name: string } | null
  vouchers: Voucher[]
  subtotal: number
  busy: boolean
  onApply: (code: string) => void
  onRemove: () => void
  error: string | null
}) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')

  const saved = vouchers.filter((v) => v.saved)
  const usable = vouchers.filter((v) => v.state === 'AVAILABLE')
  const others = vouchers.filter((v) => v.state !== 'AVAILABLE')

  function pick(code: string) {
    setOpen(false)
    setTyped('')
    onApply(code)
  }

  return (
    <section className="surface p-5 sm:p-6" aria-labelledby="voucher-heading">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="voucher-heading" className="text-[15px] font-semibold text-ink-900">
            Voucher AgriMarket
          </h2>
          <p className="mt-0.5 text-xs text-ink-600">Chọn mã đã lưu, mã đang chạy, hoặc nhập mã khác.</p>
        </div>
        {current ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-mono text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
              <Icon name="check" className="h-3.5 w-3.5" />
              {current.code}
            </span>
            <button type="button" className="btn-ghost btn-sm text-rose-700" disabled={busy} onClick={onRemove}>
              Gỡ mã
            </button>
          </div>
        ) : (
          <button type="button" className="btn-secondary btn-sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <Icon name="promotion" className="h-4 w-4" />
            {open ? 'Đóng danh sách' : 'Chọn voucher'}
          </button>
        )}
      </div>

      {!open && !current && usable.length > 0 && (
        <p className="mt-2 text-xs text-brand-700">
          {usable.length} voucher dùng được cho đơn {vnd(subtotal)} — bấm “Chọn voucher” để xem.
        </p>
      )}

      {open && (
        <div className="mt-3 space-y-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (typed.trim()) pick(typed.trim().toUpperCase())
            }}
          >
            <label className="sr-only" htmlFor="voucher-code">Mã khuyến mãi</label>
            <input
              id="voucher-code"
              className="input"
              placeholder="Nhập mã khuyến mãi"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value.toUpperCase())}
            />
            <button type="submit" className="btn-secondary shrink-0" disabled={busy || !typed.trim()}>
              Áp dụng
            </button>
          </form>

          {saved.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-ink-800">Trong ví của bạn</p>
              <ul className="space-y-1.5">
                {saved.map((v) => (
                  <li key={v.id}>
                    <VoucherOption v={v} busy={busy} onPick={pick} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {usable.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-ink-800">Ưu đãi đang chạy</p>
              <ul className="space-y-1.5">
                {usable.filter((v) => !v.saved).map((v) => (
                  <li key={v.id}>
                    <VoucherOption v={v} busy={busy} onPick={pick} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {others.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-ink-700">
                Mã chưa dùng được ({others.length})
              </summary>
              <ul className="mt-1.5 space-y-1.5">
                {others.map((v) => (
                  <li key={v.id}>
                    <VoucherOption v={v} busy={busy} onPick={pick} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      )}
    </section>
  )
}

function VoucherOption({ v, busy, onPick }: { v: Voucher; busy: boolean; onPick: (code: string) => void }) {
  const usable = v.state === 'AVAILABLE'
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-2 ${
        usable ? 'border-brand-200 bg-brand-50/60' : 'border-ink-200 bg-white'
      }`}
    >
      <span className="font-mono text-xs font-semibold text-ink-900">{v.code}</span>
      <span className="min-w-0 flex-1 truncate text-xs text-ink-700">{v.name}</span>
      <span className="text-xs font-semibold tabular-nums text-ink-900">
        {v.type === 'PERCENT' ? `−${v.value}%` : `−${vnd(v.value)}`}
      </span>
      {usable ? (
        <button
          type="button"
          className="rounded bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          disabled={busy}
          onClick={() => onPick(v.code)}
        >
          Dùng · −{vnd(v.discount_vnd)}
        </button>
      ) : (
        <span className="w-full text-[11px] text-ink-600">
          {v.reason}
          {v.remaining_vnd > 0 && ` Thêm ${vnd(v.remaining_vnd)} là dùng được.`}
        </span>
      )}
    </div>
  )
}
