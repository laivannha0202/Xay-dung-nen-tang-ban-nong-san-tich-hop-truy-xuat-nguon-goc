'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Icon } from './icons'

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className = '',
}: {
  tabs: Array<{ value: T; label: string; count?: number }>
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={`flex gap-1 overflow-x-auto ${className}`} role="tablist">
      {tabs.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={`chip whitespace-nowrap ${active ? 'chip-active' : ''}`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-white/20' : 'bg-ink-100'}`}>{t.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-pop)]">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <h2 className="font-semibold text-ink-900">{title}</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm" aria-label="Đóng">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-4 text-sm">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-100 px-4 py-3">{footer}</div>}
      </div>
    </div>
  )
}

/** Two-step destructive action: the modal owns the confirmation so it can show the reason field. */
export function ConfirmButton({
  label,
  question,
  reasonLabel,
  onConfirm,
  className = 'btn-danger btn-sm',
}: {
  label: string
  question: string
  reasonLabel?: string
  onConfirm: (reason: string) => Promise<void>
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm(reason.trim())
      setOpen(false)
      setReason('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Thao tác thất bại.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      <Modal
        open={open}
        title={label}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={busy}>
              Hủy
            </button>
            <button type="button" className="btn-danger" onClick={run} disabled={busy}>
              {busy ? 'Đang xử lý…' : 'Xác nhận'}
            </button>
          </>
        }
      >
        <p>{question}</p>
        {reasonLabel && (
          <label className="mt-3 block">
            <span className="label">{reasonLabel}</span>
            <textarea
              className="input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </label>
        )}
        {error && <p className="error-text mt-2" role="alert">{error}</p>}
      </Modal>
    </>
  )
}
