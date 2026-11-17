'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Ward } from '@agrimarket/core'
import { api } from '@/lib/api'

/** Matches the server's diacritic-insensitive form (packages are tiny; no library). */
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()

let cache: Ward[] | null = null

/** All 104 wards ship once per session; filtering is local so typing never waits on the network. */
export function useWards() {
  const [wards, setWards] = useState<Ward[] | null>(cache)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (cache) return
    let alive = true
    api<{ data: Ward[] }>('/locations/wards')
      .then((r) => {
        cache = r.data
        if (alive) setWards(r.data)
      })
      .catch(() => alive && setError('Không tải được danh sách xã/phường.'))
    return () => {
      alive = false
    }
  }, [])
  return { wards, error, reload: () => { cache = null; setWards(null) } }
}

/**
 * Searchable ward combobox. The province is fixed (Hưng Yên) so the shopper only
 * types a commune name — no district step exists after the 2025 merger.
 */
export function WardPicker({
  value,
  onChange,
  id = 'ward',
  invalid,
}: {
  value: string
  onChange: (code: string, ward: Ward | null) => void
  id?: string
  invalid?: boolean
}) {
  const { wards, error } = useWards()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  const selected = wards?.find((w) => w.code === value) ?? null
  const options = useMemo(() => {
    if (!wards) return []
    const q = normalize(query)
    const list = q ? wards.filter((w) => normalize(w.name).includes(q)) : wards
    return list.slice(0, 60)
  }, [wards, query])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function choose(w: Ward) {
    onChange(w.code, w)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative" ref={box}>
      <label className="label" htmlFor={id}>Xã/Phường (Hưng Yên)</label>
      <input
        id={id}
        className="input"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        autoComplete="off"
        placeholder={selected ? selected.name : 'Gõ tên xã/phường, VD: pho hien'}
        value={open ? query : selected?.name ?? ''}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setActive((i) => Math.min(i + 1, options.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter' && open && options[active]) {
            e.preventDefault()
            choose(options[active]!)
          } else if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-ink-200 bg-white py-1 shadow-lg"
        >
          {error && <li className="px-3 py-2 text-sm error-text">{error}</li>}
          {!wards && !error && <li className="px-3 py-2 text-sm text-ink-500">Đang tải danh sách…</li>}
          {wards && options.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-500">Không có xã/phường khớp “{query}”.</li>
          )}
          {options.map((w, i) => (
            <li key={w.code} role="option" aria-selected={w.code === value}>
              <button
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm ${
                  i === active ? 'bg-brand-50 text-ink-900' : 'text-ink-700 hover:bg-ink-50'
                }`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(w)}
              >
                {w.name}
                {/* Code is a visual hint only; keep it out of the option's accessible name. */}
                <span aria-hidden="true" className="ml-2 text-xs text-ink-400">{w.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
