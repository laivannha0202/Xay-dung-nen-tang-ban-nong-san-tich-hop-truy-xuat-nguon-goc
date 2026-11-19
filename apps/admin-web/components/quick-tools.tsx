'use client'

import { useState } from 'react'
import { Icon } from '@agrimarket/ui'

/** Copies a code/phone so the operator never retypes a UUID or a tracking number. */
export function CopyButton({ value, label = 'Sao chép', className = 'btn-ghost btn-sm' }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className={className}
      title={value}
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(
          () => {
            setDone(true)
            setTimeout(() => setDone(false), 1500)
          },
          () => undefined,
        )
      }}
    >
      <Icon name={done ? 'check' : 'copy'} className="h-3.5 w-3.5" />
      <span className="sr-only">{label}</span>
    </button>
  )
}

/** Opens the print-only document route: no admin chrome, A4 print CSS, rows never split pages. */
export function PrintButton({ href, label = 'In phiếu' }: { href?: string; label?: string }) {
  const cls = 'btn-secondary btn-sm'
  const body = (
    <>
      <Icon name="print" className="h-3.5 w-3.5" /> {label}
    </>
  )
  // No href: already on the print sheet, so just open the browser dialog.
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <button type="button" className={cls} onClick={() => window.print()}>
      {body}
    </button>
  )
}
