import Link from 'next/link'
import { mediaUrl } from '@/lib/config'
import { Icon } from '@agrimarket/ui'

/** Aisle tile: round photo, name under it — the supermarket "shop by department" row. */
export function CategoryTile({
  href,
  name,
  image,
  count,
}: {
  href: string
  name: string
  image: string | null
  count: number
}) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-2 rounded-[var(--radius-card)] p-2 text-center hover:bg-ink-100">
      <span className="grid aspect-square w-full max-w-28 place-items-center overflow-hidden rounded-full bg-ink-100 ring-1 ring-ink-200">
        {image ? (
          <img
            src={mediaUrl(image) ?? ''}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <Icon name="leaf" className="h-7 w-7 text-ink-400" />
        )}
      </span>
      <span className="text-[13px] leading-tight font-semibold text-ink-900 group-hover:text-brand-700">{name}</span>
      <span className="text-[11.5px] text-ink-500">{count} sản phẩm</span>
    </Link>
  )
}
