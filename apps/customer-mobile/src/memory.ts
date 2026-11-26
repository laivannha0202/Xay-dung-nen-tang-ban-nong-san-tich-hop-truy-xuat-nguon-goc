import { useSyncExternalStore } from 'react'
import { storage } from './storage'

/**
 * Shopper memory — same keys and same per-device scope as the website (`agri.favourites.v1`,
 * `agri.viewed.v1` in customer-web/lib/memory.ts). Ids only, so nothing private is stored and
 * the API decides today's price, stock and whether the product still exists.
 * ponytail: per device, like the web; add a `user_favourites` table if cross-device sync is asked for.
 */
const FAV_KEY = 'agri.favourites.v1'
const VIEWED_KEY = 'agri.viewed.v1'
const MAX_FAV = 100
const MAX_VIEWED = 12

interface Snapshot {
  favourites: string[]
  viewed: string[]
}

let snap: Snapshot = { favourites: [], viewed: [] }
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

const read = async (key: string): Promise<string[]> => {
  try {
    const raw = await storage.get(key)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

const write = (key: string, list: string[]) => {
  void storage.set(key, JSON.stringify(list)).catch(() => {
    /* device storage unavailable: this session still remembers, only the next launch forgets */
  })
}

let hydrating: Promise<void> | null = null
export const hydrateMemory = () =>
  (hydrating ??= (async () => {
    const [favourites, viewed] = await Promise.all([read(FAV_KEY), read(VIEWED_KEY)])
    snap = { favourites, viewed }
    notify()
  })())

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  void hydrateMemory()
  return () => {
    listeners.delete(fn)
  }
}

export const useMemory = () => useSyncExternalStore(subscribe, () => snap)

/** Newest first, de-duplicated, capped — mirrors the website's pushFront. */
const pushFront = (list: string[], id: string, max: number) => [id, ...list.filter((x) => x !== id)].slice(0, max)

export const favourites = {
  /** Flips one id, notifies every heart on screen, and persists. Returns the new state. */
  toggle(id: string): boolean {
    const on = snap.favourites.includes(id)
    const next = on ? snap.favourites.filter((x) => x !== id) : pushFront(snap.favourites, id, MAX_FAV)
    snap = { ...snap, favourites: next }
    notify()
    write(FAV_KEY, next)
    return !on
  },
}

export const recentlyViewed = {
  add(id: string) {
    const next = pushFront(snap.viewed, id, MAX_VIEWED)
    if (next.join() === snap.viewed.join()) return
    snap = { ...snap, viewed: next }
    notify()
    write(VIEWED_KEY, next)
  },
}
