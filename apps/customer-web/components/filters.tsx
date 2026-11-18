'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icon } from '@agrimarket/ui'
import { useParamPush } from '@/lib/params'
import type { Category } from '@agrimarket/core'

export interface FilterValues {
  q: string
  categorySlug: string
  minPrice: string
  maxPrice: string
  inStock: boolean
  active: number
}

/**
 * Amazon-style filter rail: only the criteria the API supports. Submit is client-side so the
 * URL carries just the filled fields. Rendered twice (desktop rail, mobile disclosure) from one
 * source; on small screens the panel sits in the flow, never over the product grid.
 */
export function Filters({ categories, values }: { categories: Category[]; values: FilterValues }) {
  const push = useParamPush()
  const [categorySlug, setCategorySlug] = useState(values.categorySlug)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        const field = (k: string) => String(form.get(k) ?? '').trim()
        push({
          q: field('q') || null,
          'danh-muc': categorySlug || null,
          'gia-tu': field('gia-tu') || null,
          'gia-den': field('gia-den') || null,
          'con-hang': form.get('con-hang') ? 'true' : null,
        })
      }}
      className="space-y-4 text-[13px]"
    >
      <div>
        <label className="mb-1 block text-[12px] font-semibold text-ink-900" htmlFor="f-q">Từ khoá</label>
        <input id="f-q" name="q" defaultValue={values.q} placeholder="Tên sản phẩm" className="h-9 w-full rounded-lg border border-ink-300 px-2.5 text-[13px] outline-none focus:border-brand-500" />
      </div>

      <fieldset>
        <legend className="mb-1 block text-[12px] font-semibold text-ink-900">Danh mục</legend>
        <label className="flex cursor-pointer items-center gap-2 py-1 text-ink-700">
          <input type="radio" name="category" value="" checked={!categorySlug} onChange={() => setCategorySlug('')} className="h-3.5 w-3.5 accent-brand-500" />
          Tất cả
        </label>
        {categories.map((c) => (
          <label key={c.id} className="flex cursor-pointer items-center gap-2 py-1 text-ink-700">
            <input type="radio" name="category" value={c.slug} checked={c.slug === categorySlug} onChange={() => setCategorySlug(c.slug)} className="h-3.5 w-3.5 accent-brand-500" />
            {c.name}
            <span className="text-[11.5px] text-ink-500">({c.product_count})</span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className="mb-1 block text-[12px] font-semibold text-ink-900">Khoảng giá (₫)</legend>
        <div className="flex items-center gap-1.5">
          <input name="gia-tu" type="number" min="0" step="5000" defaultValue={values.minPrice} placeholder="Từ" aria-label="Giá từ" className="h-9 w-full rounded-lg border border-ink-300 px-2 text-[13px]" />
          <span className="text-ink-400">–</span>
          <input name="gia-den" type="number" min="0" step="5000" defaultValue={values.maxPrice} placeholder="Đến" aria-label="Giá đến" className="h-9 w-full rounded-lg border border-ink-300 px-2 text-[13px]" />
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2 text-ink-700">
        <input type="checkbox" name="con-hang" defaultChecked={values.inStock} className="h-4 w-4 rounded border-ink-300 accent-brand-500" />
        Chỉ còn hàng
      </label>

      <div className="flex gap-2 border-t border-ink-200 pt-3">
        <button type="submit" className="btn-buy btn-sm flex-1">Áp dụng</button>
        {values.active > 0 && (
          <Link href="/san-pham" className="btn-secondary btn-sm" aria-label="Xoá bộ lọc">
            <Icon name="close" className="h-3.5 w-3.5" /> Xoá
          </Link>
        )}
      </div>
    </form>
  )
}
