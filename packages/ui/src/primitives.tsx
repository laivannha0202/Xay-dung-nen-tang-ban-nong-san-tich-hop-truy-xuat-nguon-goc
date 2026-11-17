import type { ReactNode } from 'react'
import { STATUS_LABEL, TONE_CLASS, toneFor, type Tone } from '@agrimarket/core'
import { Icon, type IconName } from './icons'

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge ${TONE_CLASS[tone]}`}>{children}</span>
}

/**
 * Colour and wording both come from the shared status map, so callers pass the raw enum
 * value and a Vietnamese label is never forgotten.
 */
export function StatusPill({ value, label }: { value: string | null | undefined; label?: string }) {
  const text = label ?? (value ? (STATUS_LABEL[value] ?? value) : '—')
  return <Badge tone={toneFor(value)}>{text}</Badge>
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  breadcrumb?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 space-y-1">
        {breadcrumb && <div className="text-xs text-ink-500">{breadcrumb}</div>}
        <h1 className="page-title">{title}</h1>
        {description && <div className="page-sub">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function SectionHeader({
  title,
  hint,
  action,
}: {
  title: string
  hint?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({
  title,
  hint,
  action,
  icon = 'leaf',
}: {
  title: string
  hint?: string
  action?: ReactNode
  icon?: IconName
}) {
  return (
    <div className="grid place-items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Icon name={icon} />
      </span>
      <p className="font-medium text-ink-800">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink-500">{hint}</p>}
      {action}
    </div>
  )
}

export function Kpi({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  href,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: IconName
  tone?: Tone
  href?: string
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">{label}</p>
        {icon && (
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${TONE_CLASS[tone]}`}>
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="kpi-value mt-2">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </>
  )
  return href ? (
    <a href={href} className="card-pad card-hover block">
      {body}
    </a>
  ) : (
    <div className="card-pad">{body}</div>
  )
}

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function Alert({ tone = 'warning', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${TONE_CLASS[tone]}`}>
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** URL-driven pager: the server renders it, so every list page stays shareable. */
export function Pager({
  page,
  pageCount,
  makeHref,
  total,
}: {
  page: number
  pageCount: number
  makeHref: (page: number) => string
  total?: number
}) {
  if (pageCount <= 1) return total === undefined ? null : <p className="text-xs text-ink-500">{total} bản ghi</p>
  const numbers = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pageCount || Math.abs(n - page) <= 1,
  )
  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-2" aria-label="Phân trang">
      {page > 1 && (
        <a className="btn-secondary btn-sm" href={makeHref(page - 1)}>
          <Icon name="chevronRight" className="h-4 w-4 rotate-180" /> Trước
        </a>
      )}
      {numbers.map((n, idx) => (
        <span key={n} className="flex items-center gap-1.5">
          {idx > 0 && n - numbers[idx - 1]! > 1 && <span className="px-1 text-ink-400">…</span>}
          <a
            href={makeHref(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`grid h-8 min-w-8 place-items-center rounded-lg border px-2 text-sm ${
              n === page ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300'
            }`}
          >
            {n}
          </a>
        </span>
      ))}
      {page < pageCount && (
        <a className="btn-secondary btn-sm" href={makeHref(page + 1)}>
          Sau <Icon name="chevronRight" className="h-4 w-4" />
        </a>
      )}
    </nav>
  )
}
