'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * Filter/sort controls are client-side so the URL keeps exactly the params the shopper set —
 * a native GET form also submits the empty fields (`?q=&gia-tu=`).
 */
export function useParamPush() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  return (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    next.delete('page')
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }
}
