'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icon } from '@agrimarket/ui'

/**
 * Three static hero concepts. The user picks one with plain buttons — no autoplay timer,
 * so nothing moves under a thumb while someone reads or taps "Mua nông sản".
 *
 * V5: the panel is ivory, not a dark veil over a photo. Every banner below is graded to
 * >150 mean luminance by `.audit/v5/grade` so dark text reads without an overlay.
 */
const CONCEPTS = [
  {
    id: 'fresh-daily',
    image: '/images/banners/concept-fresh-daily.jpg',
    alt: 'Giỏ rau củ vừa thu hoạch: bí, dưa chuột và cà chua',
    overline: 'Nông sản tươi mỗi ngày',
    title: 'Chọn theo lô,',
    highlight: 'biết rõ nông trại',
    body: 'Mỗi lô từ nông trại đối tác có tem truy xuất và phiếu kiểm nghiệm đạt trước khi lên kệ.',
    cta: { href: '/san-pham', label: 'Mua nông sản' },
    secondary: { href: '/tim-kiem', label: 'Tra cứu mã tem', icon: 'qr' as const },
  },
  {
    id: 'hung-yen',
    image: '/images/banners/concept-hung-yen.jpg',
    alt: 'Chùm nhãn lồng Hưng Yên vừa hái',
    overline: 'Đặc sản Hưng Yên',
    title: 'Nhãn lồng, cam sành',
    highlight: 'đúng mùa, đúng nông trại',
    body: 'Đặc sản theo mùa vụ của tỉnh: mỗi lô ghi rõ nông trại, xã/phường thu hoạch và ngày đóng gói.',
    cta: { href: '/danh-muc/trai-cay', label: 'Xem đặc sản' },
    secondary: { href: '/tim-kiem', label: 'Tra cứu tem QR', icon: 'qr' as const },
  },
  {
    id: 'farm-to-table',
    image: '/images/banners/concept-farm-to-table.jpg',
    alt: 'Ruộng xà lách của nông trại đối tác AgriMarket',
    overline: 'Từ nông trại đến bàn ăn',
    title: 'Xem đúng hồ sơ lô hàng',
    highlight: 'trước khi bấm đặt',
    body: 'Nhật ký canh tác, mùa vụ và kết quả kiểm nghiệm dư lượng thuốc BVTV của chính lô bạn mua.',
    cta: { href: '/tim-kiem', label: 'Tra cứu mã tem' },
    secondary: { href: '/san-pham', label: 'Mua nông sản', icon: 'products' as const },
  },
]

export function HomeHero({
  stats,
  promo,
}: {
  stats: Array<{ label: string; value: number | string }>
  promo: React.ReactNode
}) {
  const [active, setActive] = useState(0)
  const c = CONCEPTS[active]!

  return (
    <section className="overflow-hidden rounded-3xl border border-ivory-200 bg-ivory-100">
      <div className="grid lg:grid-cols-[1.02fr_0.98fr]">
        <div className="px-5 pt-8 pb-7 sm:px-10 sm:py-11 lg:pr-5 lg:pl-12">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chọn banner">
            {CONCEPTS.map((x, i) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={`flex min-h-11 items-center rounded-full border px-4 text-[12.5px] font-medium transition-colors ${
                  i === active
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-ivory-200 bg-transparent text-ink-700 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                {x.overline}
              </button>
            ))}
          </div>

          <h1 className="mt-5 max-w-[15ch] text-[34px] leading-[1.06] font-bold tracking-[-0.035em] text-ink-900 sm:text-[46px] lg:text-[56px]">
            {c.title}
            <span className="block text-brand-600">{c.highlight}</span>
          </h1>
          <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-ink-700 sm:text-base">{c.body}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={c.cta.href} className="btn btn-lg bg-brand-600 font-semibold text-white hover:bg-brand-700">
              {c.cta.label} <Icon name="chevronRight" className="h-4 w-4" />
            </Link>
            <Link href={c.secondary.href} className="btn btn-lg border border-ink-200 bg-white text-ink-900 hover:border-brand-300 hover:text-brand-700">
              <Icon name={c.secondary.icon} className="h-4 w-4" /> {c.secondary.label}
            </Link>
          </div>

          <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-3 border-t border-ivory-200 pt-5">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-[12.5px] text-ink-600">{s.label}</dt>
                <dd className="text-[15px] font-semibold text-ink-900">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative min-h-64 lg:min-h-[26rem]">
          <img src={c.image} alt={c.alt} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur-sm sm:bottom-6 sm:left-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon name="qr" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold text-ink-900">Tem QR từng lô</span>
              <span className="block text-xs text-ink-600">Quét là ra hồ sơ nông trại</span>
            </span>
          </div>
          {/* the promo cards ride the photo edge on wide screens only */}
          <div className="absolute right-4 bottom-4 hidden w-64 flex-col gap-3 xl:flex">{promo}</div>
        </div>
      </div>
    </section>
  )
}
