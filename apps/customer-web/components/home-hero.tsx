'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icon } from '@agrimarket/ui'

/**
 * Three static hero concepts. The user picks one with plain buttons — no autoplay timer,
 * so nothing moves under a thumb while someone reads or taps "Mua nông sản".
 */
const CONCEPTS = [
  {
    id: 'fresh-daily',
    image: '/images/banners/concept-fresh-daily.jpg',
    alt: 'Giỏ rau củ vừa thu hoạch: bí, dưa chuột và cà chua',
    overline: 'Nông sản tươi mỗi ngày',
    title: 'Rau củ, trái cây vào vụ',
    highlight: 'bán theo lô, có tem truy xuất',
    body: 'Mỗi lô từ nông trại đối tác có tem truy xuất và phiếu kiểm nghiệm đạt trước khi lên kệ.',
    cta: { href: '/san-pham', label: 'Mua nông sản' },
    secondary: { href: '/san-pham?sort=newest', label: 'Hàng mới về', icon: 'leaf' as const },
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
    <section className="overflow-hidden rounded-3xl bg-brand-900">
      <div className="relative">
        <img src={c.image} alt={c.alt} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-r from-[#092e1b]/95 via-[#092e1b]/72 to-[#092e1b]/10" />
        <div className="relative grid items-center gap-8 px-5 py-8 sm:px-10 sm:py-11 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-xl">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Chọn banner">
              {CONCEPTS.map((x, i) => (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  className={`rounded-full px-3 py-1 text-[11.5px] font-medium ring-1 ring-inset transition-colors ${
                    i === active
                      ? 'bg-white text-brand-800 ring-white'
                      : 'bg-white/10 text-brand-50 ring-white/25 hover:bg-white/20'
                  }`}
                >
                  {x.overline}
                </button>
              ))}
            </div>
            <h1 className="mt-4 text-[2.1rem] leading-[1.08] font-bold tracking-tight text-white sm:text-[2.5rem] lg:text-[2.75rem]">
              {c.title}
              <span className="block text-brand-200">{c.highlight}</span>
            </h1>
            <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-brand-50/90">{c.body}</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href={c.cta.href} className="btn-lg btn inline-flex bg-white font-semibold text-brand-800 hover:bg-brand-50">
                {c.cta.label} <Icon name="chevronRight" className="h-4 w-4" />
              </Link>
              <Link href={c.secondary.href} className="btn-lg btn inline-flex border border-white/40 text-white hover:bg-white/10">
                <Icon name={c.secondary.icon} className="h-4 w-4" /> {c.secondary.label}
              </Link>
            </div>
            <dl className="mt-7 flex flex-wrap gap-2.5">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl bg-white/10 px-3.5 py-2 ring-1 ring-white/15 ring-inset">
                  <dt className="text-[10.5px] tracking-wide text-brand-100 uppercase">{s.label}</dt>
                  <dd className="text-xl font-bold text-white">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="hidden gap-3 lg:grid">{promo}</div>
        </div>
      </div>
    </section>
  )
}
