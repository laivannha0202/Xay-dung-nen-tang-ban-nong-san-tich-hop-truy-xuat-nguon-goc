'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@agrimarket/ui'
import { filterWards } from '@agrimarket/core'
import { useWards } from '@/components/ward-picker'

const KEY = 'agri.ward.v1'

/**
 * Header delivery selector. The service area is province-wide (Hưng Yên) and the
 * checkout re-validates the ward, so this only personalises the storefront and is
 * stored locally — no account write.
 */
export function DeliveryPicker() {
  const { wards } = useWards()
  const [ward, setWard] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => setWard(localStorage.getItem(KEY)), [])
  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const options = useMemo(() => (wards ? filterWards(wards, q) : []), [wards, q])

  function pick(name: string) {
    setWard(name)
    localStorage.setItem(KEY, name)
    setOpen(false)
    setQ('')
  }

  return (
    <div className="relative hidden md:block" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors hover:bg-brand-50"
      >
        <Icon name="pin" className="h-4 w-4 shrink-0 text-brand-600" />
        <span className="leading-tight">
          <span className="block text-[10.5px] tracking-wide text-ink-500 uppercase">Giao tới</span>
          <span className="block max-w-32 truncate text-[13px] font-semibold text-ink-900">{ward ?? 'Hưng Yên'}</span>
        </span>
      </button>
      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-72 rounded-xl border border-ink-200 bg-white p-3 shadow-[var(--shadow-pop)]">
          <p className="text-xs font-semibold text-ink-900">Chọn xã/phường nhận hàng</p>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Gõ tên xã/phường…"
            aria-label="Tìm xã/phường"
            className="field mt-2"
          />
          <ul role="listbox" className="mt-2 max-h-72 overflow-auto">
            {!wards && <li className="px-2 py-2 text-sm text-ink-500">Đang tải 104 xã/phường…</li>}
            {wards && (
              <li aria-hidden="true" className="sticky top-0 bg-white px-2 py-1 text-[11px] text-ink-500">
                {options.length} xã/phường
              </li>
            )}
            {options.map((w) => (
              <li key={w.code} role="option" aria-selected={w.name === ward}>
                <button
                  type="button"
                  onClick={() => pick(w.name)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-brand-50 hover:text-brand-800 ${
                    w.name === ward ? 'font-semibold text-brand-700' : 'text-ink-700'
                  }`}
                >
                  {w.name}
                  {w.name === ward && <span aria-hidden="true">✓</span>}
                </button>
              </li>
            ))}
            {wards && options.length === 0 && <li className="px-2 py-2 text-sm text-ink-500">Không tìm thấy.</li>}
          </ul>
          <p className="mt-2 border-t border-ink-100 pt-2 text-[11px] text-ink-500">
            AgriMarket giao toàn tỉnh Hưng Yên. Địa chỉ chính xác nhập ở bước thanh toán.
          </p>
        </div>
      )}
    </div>
  )
}
