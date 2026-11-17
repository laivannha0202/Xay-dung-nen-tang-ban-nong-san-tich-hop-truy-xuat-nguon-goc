import type { ReactNode } from 'react'
import { Icon } from '@agrimarket/ui'

/**
 * One toolbar for every admin list route: a text search, optional filter fields and a
 * submit button, all in the same order and size so the eye does not re-learn each page.
 * Rendered as a plain GET form — filters stay shareable URLs and survive a reload.
 */
export function Toolbar({
  action,
  search,
  placeholder,
  submitLabel = 'Lọc',
  children,
}: {
  action: string
  search?: { name: string; value?: string }
  placeholder?: string
  submitLabel?: string
  children?: ReactNode
}) {
  return (
    <form className="toolbar" action={action}>
      {search && (
        <label>
          <span className="sr-only">Tìm kiếm</span>
          <span className="relative block">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              name={search.name}
              defaultValue={search.value ?? ''}
              placeholder={placeholder ?? 'Tìm kiếm'}
              className="input toolbar-input pl-8"
            />
          </span>
        </label>
      )}
      {children}
      <button className="btn-secondary btn-sm" type="submit">
        {submitLabel}
      </button>
    </form>
  )
}
