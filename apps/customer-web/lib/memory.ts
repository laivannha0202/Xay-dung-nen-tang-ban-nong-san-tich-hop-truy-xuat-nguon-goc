'use client'

/**
 * Shopper memory: search history, recently viewed product ids and favourites.
 * All three are per-device (localStorage) because the API has no such tables and a
 * guest must get the same help as a signed-in shopper. Nothing here is PII.
 */
const SEARCH_KEY = 'agri.search-history.v1'
const VIEWED_KEY = 'agri.viewed.v1'
const FAV_KEY = 'agri.favourites.v1'

const MAX_SEARCHES = 8
const MAX_VIEWED = 12

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function write(key: string, value: unknown[]) {
  try {
    if (value.length === 0) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode / quota: shopping still works, only the memory is lost */
  }
}

/** Newest first, de-duplicated, capped. */
const pushFront = <T,>(list: T[], value: T, max: number, same = (a: T, b: T) => a === b) =>
  [value, ...list.filter((v) => !same(v, value))].slice(0, max)

export const searchHistory = {
  read: () => read<string>(SEARCH_KEY),
  add(term: string) {
    const t = term.trim()
    if (t.length < 2) return
    write(SEARCH_KEY, pushFront(read<string>(SEARCH_KEY), t, MAX_SEARCHES, (a, b) => a.toLowerCase() === b.toLowerCase()))
  },
  remove(term: string) {
    write(SEARCH_KEY, read<string>(SEARCH_KEY).filter((t) => t !== term))
  },
  clear: () => write(SEARCH_KEY, []),
}

export const recentlyViewed = {
  read: () => read<string>(VIEWED_KEY),
  add(productId: string) {
    write(VIEWED_KEY, pushFront(read<string>(VIEWED_KEY), productId, MAX_VIEWED))
  },
}

export const favourites = {
  read: () => read<string>(FAV_KEY),
  has: (id: string) => read<string>(FAV_KEY).includes(id),
  toggle(id: string): boolean {
    const list = read<string>(FAV_KEY)
    const next = list.includes(id)
    write(FAV_KEY, next ? list.filter((x) => x !== id) : pushFront(list, id, 100))
    return !next
  },
}
