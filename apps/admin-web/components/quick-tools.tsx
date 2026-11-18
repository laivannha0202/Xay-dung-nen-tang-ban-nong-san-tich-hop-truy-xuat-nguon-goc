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

/** Browser print is enough for a packing slip; no PDF library, no server round trip. */
export function PrintButton({ label = 'In phiếu' }: { label?: string }) {
  return (
    <button type="button" className="btn-secondary btn-sm" onClick={() => window.print()}>
      <Icon name="print" className="h-3.5 w-3.5" /> {label}
    </button>
  )
}
