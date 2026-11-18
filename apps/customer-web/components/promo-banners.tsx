import Link from 'next/link'
import { Icon } from '@agrimarket/ui'
import type { Category } from '@agrimarket/core'

/**
 * Shopping banners, each pointing at a real category that exists in the catalogue. No promo
 * claim is written here that the API cannot back up (no "giảm 50%", no fake deadlines).
 */
const BANNERS = [
  { slug: 'trai-cay', file: 'trai-cay.jpg', title: 'Trái cây tươi mỗi ngày', note: 'Cam sành, nhãn lồng, xoài cát — chọn lô đang bán' },
  { slug: 'rau-cu', file: 'rau-cu.jpg', title: 'Rau củ thu hoạch trong ngày', note: 'Rau ăn lá, củ quả và nấm tươi từ nhà màng' },
  { slug: 'dac-san', file: 'dac-san.jpg', title: 'Đặc sản Hưng Yên', note: 'Mật ong, gạo nếp, tương bần và quà biếu' },
]

export function PromoBanners({ categories }: { categories: Category[] }) {
  const shown = BANNERS.flatMap((b) => {
    const category = categories.find((c) => c.slug === b.slug)
    return category ? [{ ...b, category }] : []
  })
  if (shown.length === 0) return null

  return (
    <section aria-label="Mua theo nhóm hàng" className="grid gap-3 sm:grid-cols-3">
      {shown.map((b) => (
        <Link
          key={b.slug}
          href={`/danh-muc/${b.slug}`}
          className="group relative flex min-h-[132px] items-end overflow-hidden rounded-[var(--radius-card)] bg-ink-100 ring-1 ring-ink-200 sm:min-h-[168px]"
        >
          <img
            src={`/images/banners/${b.file}`}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
          />
          <div className="relative w-full bg-gradient-to-t from-ink-900/85 via-ink-900/35 to-transparent px-3.5 pt-8 pb-3 text-white">
            <p className="text-[15px] leading-tight font-bold">{b.title}</p>
            <p className="mt-0.5 text-[11.5px] text-white/85">{b.note}</p>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold">
              {b.category.product_count} sản phẩm <Icon name="chevronRight" className="h-3 w-3" />
            </span>
          </div>
        </Link>
      ))}
    </section>
  )
}
