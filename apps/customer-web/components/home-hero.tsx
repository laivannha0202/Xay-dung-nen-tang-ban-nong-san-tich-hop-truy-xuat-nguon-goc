import Link from 'next/link'
import { Icon } from '@agrimarket/ui'

/**
 * One hero, one message. V6 keeps the reference's two-column shape: pale panel on the left
 * carrying the headline and two CTAs, produce photography bleeding to the panel edge on the
 * right, and a floating QR card so the traceability promise is visible above the fold.
 *
 * An earlier tablist of three hero concepts was removed — three competing headlines is not
 * editorial, it is a carousel without autoplay.
 */
export function HomeHero({ stats }: { stats: Array<{ label: string; value: number | string }> }) {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-hero)] bg-mint-50">
      <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="px-6 pt-10 pb-9 sm:px-10 sm:py-14 lg:py-16 lg:pr-6 lg:pl-14">
          <p className="eyebrow flex items-center gap-2">
            <span className="h-px w-6 bg-brand-600" aria-hidden />
            Nông sản Hưng Yên
          </p>

          <h1 className="display mt-5 max-w-[16ch] text-[36px] leading-[1.03] text-ink-900 sm:text-[48px] lg:text-[58px]">
            Chọn theo lô, <span className="text-brand-700">biết rõ nông trại</span>
          </h1>

          <p className="mt-5 max-w-[42ch] text-[15px] leading-relaxed text-ink-700 sm:text-base">
            Mỗi lô có tem QR truy xuất tới nông trại, nhật ký canh tác và phiếu kiểm nghiệm đạt
            trước khi lên kệ. Giao nội tỉnh Hưng Yên trong 24 giờ.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/san-pham" className="btn btn-lg bg-brand-600 font-semibold text-white hover:bg-brand-700">
              Mua nông sản <Icon name="chevronRight" className="h-4 w-4" />
            </Link>
            <Link
              href="/tim-kiem"
              className="btn btn-lg border border-brand-600/25 bg-white/70 text-brand-800 backdrop-blur-sm hover:border-brand-600 hover:bg-white"
            >
              <Icon name="qr" className="h-4 w-4" /> Tra cứu mã tem
            </Link>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-9 gap-y-4 border-t border-brand-600/15 pt-5">
            {stats.map((s) => (
              <div key={s.label}>
                <dd className="text-[19px] leading-none font-semibold tracking-tight text-ink-900 tabular-nums">{s.value}</dd>
                <dt className="mt-1.5 text-[12px] text-ink-600">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative min-h-72 sm:min-h-96 lg:min-h-[34rem]">
          <img
            src="/images/banners/concept-fresh-daily.jpg"
            alt="Giỏ rau củ vừa thu hoạch của nông trại đối tác AgriMarket"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute right-4 bottom-4 left-4 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur-sm sm:right-6 sm:bottom-6 sm:left-auto sm:max-w-[18rem]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <Icon name="qr" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold text-ink-900">Tem QR từng lô</span>
              <span className="block text-xs text-ink-600">Quét là ra hồ sơ nông trại</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
