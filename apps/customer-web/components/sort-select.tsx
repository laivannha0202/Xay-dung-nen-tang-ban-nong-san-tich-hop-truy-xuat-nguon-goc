'use client'

import { useParamPush } from '@/lib/params'

/** Sort is a toolbar control: change it, keep every filter. */
export function SortSelect({ options, current }: { options: Array<{ value: string; label: string }>; current: string }) {
  const push = useParamPush()
  return (
    <label className="flex items-center gap-2 text-[12.5px] text-ink-600">
      <span>Sắp xếp</span>
      <select
        value={current}
        onChange={(e) => push({ sort: e.target.value === 'newest' ? null : e.target.value })}
        className="h-9 rounded-lg border border-ink-300 bg-white px-2 text-[13px] text-ink-900 outline-none focus:border-brand-500"
        aria-label="Sắp xếp sản phẩm"
      >
        {options.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </label>
  )
}
