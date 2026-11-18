import Link from 'next/link'
import { mediaUrl } from '@/lib/config'
import { Icon } from '@agrimarket/ui'

/**
 * Category tile: the photo is the whole tile, name and count sit on a bottom scrim so the
 * grid stays image-led instead of turning into five text blocks with a thumbnail above.
 */
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
    <Link href={href} className="group relative block overflow-hidden rounded-[var(--radius-panel)] bg-ivory-100">
      <span className="block aspect-4/3">
        {image ? (
          <img
            src={mediaUrl(image) ?? ''}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05] motion-reduce:transition-none"
          />
        ) : (
          <span className="grid h-full place-items-center text-brand-300"><Icon name="leaf" className="h-8 w-8" /></span>
        )}
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink-900/78 via-ink-900/28 to-transparent px-4 pt-10 pb-3.5">
        <span className="block text-[15px] font-semibold text-white">{name}</span>
        <span className="mt-0.5 block text-[12px] text-white/80">{count} sản phẩm</span>
      </span>
    </Link>
  )
}
