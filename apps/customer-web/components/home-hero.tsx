import Link from 'next/link'
import { Icon } from '@agrimarket/ui'

/**
 * Storefront hero: one promise, one CTA, produce photo. Fixed 320–420px band so the first
 * product row is already visible on a 900px viewport — a storefront, not a cover page.
 */
export function HomeHero({ freeShipLabel }: { freeShipLabel: string }) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-hero)] bg-ink-100">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <div className="flex flex-col justify-center gap-4 px-5 py-7 sm:px-9 sm:py-9 lg:py-10">
          <p className="w-fit rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-brand-700 ring-1 ring-brand-200">
            {freeShipLabel}
          </p>
          <h1 className="max-w-[18ch] text-[30px] leading-[1.1] font-bold tracking-[-0.02em] text-ink-900 sm:text-[38px] lg:text-[42px]">
            Nông sản tươi, giá tốt mỗi ngày
          </h1>
          <p className="max-w-[44ch] text-[14.5px] leading-relaxed text-ink-700">
            Trái cây, rau củ và đặc sản Hưng Yên chọn lọc từ nông trại đối tác — giao tận cửa trong tỉnh.
          </p>
          <div className="mt-1 flex flex-wrap gap-2.5">
            <Link href="/san-pham" className="btn btn-lg bg-buy-500 text-ink-900 hover:bg-buy-600">
              Mua ngay <Icon name="chevronRight" className="h-4 w-4" />
            </Link>
            <Link href="#uu-dai" className="btn btn-lg border border-ink-300 bg-white text-ink-800 hover:border-ink-400">
              Xem ưu đãi
            </Link>
          </div>
        </div>
        <div className="relative hidden min-h-[320px] lg:block lg:min-h-[380px]">
          <img
            src="/images/banners/hero-market.jpg"
            alt="Quầy trái cây và rau củ tươi tại cửa hàng"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}
