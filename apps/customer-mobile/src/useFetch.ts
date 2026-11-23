import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Fetches once per key change; returns data, error, reload, reset.
 *
 * `pending` is true from the moment the key changes until that result lands, so a screen can
 * hold the button that submits the old result. Only the latest request may write: a stale
 * response (voucher A after the shopper already picked B) is dropped, never set over the
 * newer one.
 */
export function useFetch<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [tick, setTick] = useState(0)
  const reload = useCallback(() => setTick((n) => n + 1), [])
  const reset = useCallback(() => {
    setData(null)
    setError(null)
  }, [])
  const latest = useRef(0)
  useEffect(() => {
    const own = ++latest.current
    setPending(true)
    void load().then(
      (v) => {
        if (own !== latest.current) return
        setData(v)
        setError(null)
        setPending(false)
      },
      (e: Error) => {
        if (own !== latest.current) return
        setError(e.message)
        setPending(false)
      },
    )
    return () => {
      latest.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  return { data, error, pending, reload, reset }
}
