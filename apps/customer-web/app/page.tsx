import Link from 'next/link'
import { mediaUrl } from '@/lib/config'
import { serverFetch } from '@/lib/api'
import { vnd, qty } from '@/lib/format'
import type { HomePayload } from '@agrimarket/core'
import { Icon, EmptyState, SectionHeader } from '@agrimarket/ui'
import { ProductCard } from '@/components/product-card'
import { HomeHero } from '@/components/home-hero'

interface ServiceArea {
  province: { name: string }
  ward_count: number
  serviceable_ward_count: number
  ship_fee_vnd: number
  free_ship_threshold_vnd: number
}

/** Seasonal split is presentation-only: summer stock first, then the pantry. */
const SEASONAL_CATEGORIES = ['trai-cay', 'rau-cu']

const SERVICES = [
  { icon: 'truck' as const, title: 'Giao trong 24 giờ', body: 'Nội tỉnh Hưng Yên' },
  { icon: 'shield' as const, title: 'Lô có kiểm nghiệm', body: 'Đạt mới được bán' },
  { icon: 'qr' as const, title: 'Tem QR từng lô', body: 'Quét ra hồ sơ nông trại' },
  { icon: 'orders' as const, title: 'Đổi trả 24 giờ', body: 'Nếu lô giao bị lỗi' },
]

const WHY = [
  {
    icon: 'pin' as const,
    title: 'Nông trại có địa chỉ',
    body: 'Tên nông trại, xã/phường và nhà cung cấp được công khai trên trang truy xuất của lô.',
  },
  {
    icon: 'shield' as const,
    title: 'Kiểm nghiệm trước khi bán',
    body: 'Lô chỉ được công khai và bán khi phiếu kiểm nghiệm đạt và không nằm trong diện thu hồi.',
  },
  {
    icon: 'truck' as const,
    title: 'Giao theo lô thực xuất',
    body: 'Đơn của bạn được phân bổ từ lô cụ thể; sau khi giao, mã lô hiện trong chi tiết đơn hàng.',
  },
]

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center text-[13px] font-semibold text-brand-700 hover:text-brand-600 hover:underline">
      {children}
    </Link>
  )
}

export default async function HomePage() {
  const [data, area] = await Promise.all([
    serverFetch<HomePayload>('/home', undefined, 60),
    serverFetch<ServiceArea>('/locations/service-area', undefined, 300),
  ])
  if (!data) {
    return <EmptyState title="Chưa có dữ liệu sản phẩm" hint="Máy chủ chưa trả về danh mục nào đang bán." icon="products" />
  }

  // featured/newest overlap, so dedupe by id or React sees duplicate keys.
  const dedupe = (list: HomePayload['featured']) => [...new Map(list.map((p) => [p.id, p])).values()]
  const promo = dedupe([...data.featured, ...data.newest]).filter((p) => p.has_batch_promo).slice(0, 4)
  const seasonal = data.newest
    .filter((p) => p.in_stock && SEASONAL_CATEGORIES.includes(p.category_slug ?? ''))
    .slice(0, 4)
  const freeShip = vnd(area?.free_ship_threshold_vnd ?? 500_000)
  const { stats } = data

  return (
    <div className="space-y-14 sm:space-y-16">
      <HomeHero
        stats={[
          { label: 'Sản phẩm đang bán', value: stats.products },
          { label: 'Lô đã công khai', value: stats.batches },
          { label: 'Nhóm hàng', value: data.categories.length },
        ]}
        promo={promo.slice(0, 2).map((p) => (
          <Link
            key={p.id}
            href={`/san-pham/${p.slug}`}
            className="flex items-center gap-3 rounded-2xl bg-white/97 p-3 shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none"
          >
            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ivory-100">
              {p.image ? (
                <img src={mediaUrl(p.image) ?? ''} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-brand-300"><Icon name="leaf" /></span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink-900">{p.name}</span>
              <span className="block text-sm font-bold text-brand-700">
                {vnd(p.base_price_vnd)}<span className="text-xs font-normal text-ink-500">/{p.unit}</span>
              </span>
              <span className="mt-1 inline-block rounded-full bg-sand-50 px-2 py-0.5 text-[10.5px] font-semibold text-sand-700 ring-1 ring-sand-200 ring-inset">
                Lô cận hạn giảm giá
              </span>
            </span>
          </Link>
        ))}
      />

      {/* ---------- service strip: one hairline row, no card boxes ---------- */}
      <ul className="grid gap-x-4 gap-y-5 border-y border-ink-200/70 py-5 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((s) => (
          <li key={s.title} className="flex items-center gap-3">
            <Icon name={s.icon} className="h-5 w-5 shrink-0 text-brand-600" />
            <span>
              <span className="block text-[13.5px] font-semibold text-ink-900">{s.title}</span>
              <span className="block text-xs text-ink-600">{s.body}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* ---------- categories ---------- */}
      {data.categories.length > 0 && (
        <section>
          <SectionHeader
            title="Mua theo nhóm hàng"
            hint="Nông sản Hưng Yên theo nhóm, tất cả đều bán theo lô có tem truy xuất."
            action={<SectionLink href="/san-pham">Xem tất cả →</SectionLink>}
          />
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-5">
            {data.categories.map((c) => (
              <Link key={c.id} href={`/danh-muc/${c.slug}`} className="group">
                <span className="relative block aspect-4/3 overflow-hidden rounded-2xl bg-ivory-100">
                  {c.image ? (
                    <img
                      src={mediaUrl(c.image) ?? ''}
                      alt={c.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-brand-300"><Icon name="leaf" className="h-7 w-7" /></span>
                  )}
                </span>
                <span className="mt-2.5 block truncate text-[14px] font-semibold text-ink-900 group-hover:text-brand-700">{c.name}</span>
                <span className="text-xs text-ink-600">{c.product_count} sản phẩm</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- top rated ---------- */}
      <section>
        <SectionHeader
          title="Khách đánh giá cao"
          hint="Xếp theo điểm đánh giá đã được duyệt của khách đã nhận hàng."
          action={<SectionLink href="/san-pham?sort=rating">Xem tất cả →</SectionLink>}
        />
        {data.featured.length === 0 ? (
          <EmptyState title="Chưa có sản phẩm nào còn hàng" hint="Các lô đang chờ kiểm nghiệm hoặc đã hết hàng." icon="products" />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
            {data.featured.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ---------- promotions ---------- */}
      {promo.length > 0 && (
        <section>
          <SectionHeader
            title="Ưu đãi theo lô cận hạn"
            hint="Giảm giá chỉ áp cho đúng số lượng còn lại của lô sắp hết hạn — giá trên trang sản phẩm là giá tham khảo."
            action={<SectionLink href="/san-pham?con-hang=true&sort=price_asc">Xem thêm →</SectionLink>}
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
            {promo.map((p) => <ProductCard key={`promo-${p.id}`} product={p} />)}
          </div>
        </section>
      )}

      {/* ---------- traceability ---------- */}
      <section className="overflow-hidden rounded-3xl bg-ink-900 text-ivory-50">
        <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative min-h-60 lg:min-h-full">
            <img
              src="/images/banners/trace-lab.jpg"
              alt="Ruộng lúa xanh của nông trại đối tác"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-10">
            <p className="flex items-center gap-2 text-[12.5px] font-semibold tracking-wide text-brand-300 uppercase">
              <Icon name="qr" className="h-4 w-4" /> Truy xuất nguồn gốc
            </p>
            <h2 className="mt-3 text-[26px] leading-[1.16] font-bold tracking-tight sm:text-[32px]">
              Quét tem trên bao bì, xem đúng hồ sơ của lô bạn mua
            </h2>
            <ol className="mt-7 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                'Nông trại, xã/phường và nhà cung cấp được công khai',
                'Mùa vụ, ngày gieo và nhật ký canh tác đầy đủ',
                'Kết quả kiểm nghiệm dư lượng thuốc BVTV của phòng lab',
                'Cảnh báo thu hồi — nếu có — hiển thị ngay đầu trang',
              ].map((text, i) => (
                <li key={text} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ivory-100/85">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link href="/tim-kiem" className="btn bg-brand-500 font-semibold text-ink-900 hover:bg-brand-400">
                Tra cứu mã tem
              </Link>
              <Link href="/chinh-sach/doi-tra" className="btn border border-white/25 text-ivory-50 hover:bg-white/10">
                Chính sách đổi trả
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- seasonal ---------- */}
      {seasonal.length > 0 && (
        <section>
          <SectionHeader
            title="Nông sản theo mùa"
            hint="Rau quả đang vào vụ, bán theo lô có tem truy xuất."
            action={<SectionLink href="/san-pham?sort=newest">Xem tất cả →</SectionLink>}
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
            {seasonal.map((p) => <ProductCard key={`season-${p.id}`} product={p} />)}
          </div>
        </section>
      )}

      {/* ---------- why us: editorial 3-up, icon-less headings ---------- */}
      <section className="grid gap-x-10 gap-y-7 border-t border-ink-200/70 pt-8 md:grid-cols-3">
        {WHY.map((f) => (
          <div key={f.title}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <Icon name={f.icon} className="h-5 w-5" />
            </span>
            <p className="mt-3.5 text-[15px] font-semibold text-ink-900">{f.title}</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">{f.body}</p>
          </div>
        ))}
      </section>

      {/* ---------- delivery area ---------- */}
      <section className="grid gap-6 rounded-3xl bg-ivory-100 p-6 sm:p-9 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-[12.5px] font-semibold tracking-wide text-brand-700 uppercase">Vùng giao hàng</p>
          <h2 className="mt-2.5 text-[24px] font-bold tracking-tight text-ink-900 sm:text-[28px]">
            Giao nội tỉnh {area?.province.name ?? 'Hưng Yên'}
          </h2>
          <p className="mt-2.5 max-w-[52ch] text-[14px] leading-relaxed text-ink-700">
            AgriMarket hiện giao tới {area?.serviceable_ward_count ?? '—'} xã/phường thuộc{' '}
            {area?.province.name ?? 'Hưng Yên'}. Phí giao {vnd(area?.ship_fee_vnd ?? 20_000)}, miễn phí cho đơn từ{' '}
            {freeShip}. Đơn ngoài vùng sẽ được chặn ngay khi thanh toán, không phát sinh phí ẩn.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/san-pham" className="btn-primary">Đặt hàng hôm nay</Link>
            <Link href="/chinh-sach/giao-hang" className="btn-secondary">Xem vùng giao hàng</Link>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 self-center border-t border-ivory-200 pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-6">
          {[
            ['Số xã/phường', area?.serviceable_ward_count ?? '—'],
            ['Phí giao', vnd(area?.ship_fee_vnd ?? 20_000)],
            ['Miễn phí từ', freeShip],
            ['Thời gian', '24 giờ làm việc'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] tracking-wide text-ink-600 uppercase">{label}</dt>
              <dd className="mt-0.5 text-[15px] font-semibold text-ink-900">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- newest ---------- */}
      <section>
        <SectionHeader
          title="Mới về kho"
          hint="Sản phẩm vừa được đưa lên kệ từ các lô đủ điều kiện bán."
          action={<SectionLink href="/san-pham?sort=newest">Xem tất cả →</SectionLink>}
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
          {data.newest.map((p) => <ProductCard key={`new-${p.id}`} product={p} />)}
        </div>
        <p className="mt-4 text-xs text-ink-600">
          Tồn kho hiển thị là số lượng còn bán được từ các lô đã công khai: {qty(data.stats.batches)} lô đang mở.
        </p>
      </section>
    </div>
  )
}
