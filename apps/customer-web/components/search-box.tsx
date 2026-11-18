'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@agrimarket/ui'
import { api } from '@/lib/api'
import { searchHistory } from '@/lib/memory'

interface Suggestion {
  products: Array<{ id: string; name: string; slug: string; unit: string; base_price_vnd: number; in_stock: boolean }>
  categories: Array<{ id: string; slug: string; name: string }>
}

const EMPTY: Suggestion = { products: [], categories: [] }

/**
 * Header search: types as you go, remembers past terms on this device, and lands on the
 * results page. Suggestions are products + aisles from the API; the history is local.
 */
export function SearchBox() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Suggestion>(EMPTY)
  const [history, setHistory] = useState<string[]>([])
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => setHistory(searchHistory.read()), [])

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setData(EMPTY)
      return
    }
    const t = setTimeout(() => {
      void api<Suggestion>(`/search/suggest?q=${encodeURIComponent(term)}`)
        .then(setData)
        .catch(() => setData(EMPTY))
    }, 180)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    function away(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [])

  function go(term: string) {
    const t = term.trim()
    if (!t) return
    searchHistory.add(t)
    setHistory(searchHistory.read())
    setOpen(false)
    router.push(`/san-pham?q=${encodeURIComponent(t)}`)
  }

  const showHistory = q.trim().length < 2 && history.length > 0
  const showResults = q.trim().length >= 2 && (data.products.length > 0 || data.categories.length > 0)

  return (
    <div ref={box} className="relative flex min-w-0 flex-1 items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          go(q)
        }}
        className="flex min-w-0 flex-1 items-center"
        role="search"
      >
        <div className="relative flex min-w-0 flex-1 items-center">
          <Icon name="search" className="pointer-events-none absolute left-3 h-4 w-4 text-ink-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            className="h-10 w-full rounded-l-lg border border-r-0 border-ink-300 bg-white pr-3 pl-9 text-[14px] text-ink-900 outline-none placeholder:text-ink-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="Tìm cam sành, nhãn lồng, gạo ST25…"
            aria-label="Tìm kiếm sản phẩm"
            aria-expanded={open}
            aria-controls="search-suggestions"
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>
        <button
          type="submit"
          className="grid h-10 w-11 shrink-0 place-items-center rounded-r-lg bg-buy-500 text-ink-900 transition-colors hover:bg-buy-600 sm:w-12"
          aria-label="Tìm kiếm"
        >
          <Icon name="search" className="h-5 w-5" />
        </button>
      </form>

      {open && (showHistory || showResults) && (
        <div
          id="search-suggestions"
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-[var(--radius-panel)] border border-ink-200 bg-white p-2 shadow-[var(--shadow-card)]"
        >
          {showHistory && (
            <div className="p-1">
              <div className="flex items-center justify-between px-1 pb-1">
                <p className="text-[11.5px] font-semibold tracking-wide text-ink-500 uppercase">Tìm gần đây</p>
                <button
                  type="button"
                  className="text-[11.5px] text-ink-500 hover:text-brand-700"
                  onClick={() => {
                    searchHistory.clear()
                    setHistory([])
                  }}
                >
                  Xoá
                </button>
              </div>
              {history.map((term) => (
                <div key={term} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => go(term)}
                    className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13.5px] text-ink-800 hover:bg-ink-100"
                  >
                    <Icon name="clock" className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                    <span className="truncate">{term}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Xoá từ khoá ${term}`}
                    className="grid h-7 w-7 place-items-center rounded text-ink-400 hover:text-rose-700"
                    onClick={() => {
                      searchHistory.remove(term)
                      setHistory(searchHistory.read())
                    }}
                  >
                    <Icon name="close" className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showResults && (
            <>
              {data.categories.length > 0 && (
                <div className="border-t border-ink-100 p-1 first:border-t-0">
                  <p className="px-1 pb-1 text-[11.5px] font-semibold tracking-wide text-ink-500 uppercase">Danh mục</p>
                  {data.categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        router.push(`/danh-muc/${c.slug}`)
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13.5px] text-ink-800 hover:bg-ink-100"
                    >
                      <Icon name="categories" className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {data.products.length > 0 && (
                <div className="border-t border-ink-100 p-1">
                  <p className="px-1 pb-1 text-[11.5px] font-semibold tracking-wide text-ink-500 uppercase">Sản phẩm</p>
                  {data.products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        router.push(`/san-pham/${p.slug}`)
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-ink-100"
                    >
                      <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-800">{p.name}</span>
                      {!p.in_stock && <span className="shrink-0 text-[11px] text-rose-700">Hết hàng</span>}
                      <span className="shrink-0 text-[12px] text-ink-500 tabular-nums">
                        {p.base_price_vnd.toLocaleString('vi-VN')}₫/{p.unit}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => go(q)}
                    className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-[13px] font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    Xem tất cả kết quả cho “{q.trim()}”
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
