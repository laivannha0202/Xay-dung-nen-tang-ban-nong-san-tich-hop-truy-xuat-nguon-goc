import Link from 'next/link'
import { serverFetch } from '@/lib/api'
import { vnd, qty } from '@/lib/format'
import type { HomePayload } from '@agrimarket/core'
import { Icon, EmptyState, SectionHeader } from '@agrimarket/ui'
import type { IconName } from '@agrimarket/ui'
import { ProductCard } from '@/components/product-card'
import { CategoryTile } from '@/components/category-tile'
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

/** The four promises, stated once, directly under the hero. */
const TRUST: Array<{ icon: IconName; title: string; body: string }> = [
  { icon: 'qr', title: 'Tem QR từng lô', body: 'Quét ra hồ sơ nông trại, nhật ký canh tác' },
  { icon: 'shield', title: 'Kiểm nghiệm trước khi bán', body: 'Lô đạt mới được công khai' },
  { icon: 'truck', title: 'Giao nội tỉnh 24 giờ', body: 'Hưng Yên, chốt phí theo xã/phường' },
  { icon: 'orders', title: 'Đổi trả nếu giao lỗi', body: 'Báo trong 24 giờ qua chi tiết đơn' },
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
    <div className="space-y-12 sm:space-y-16">
      <HomeHero
        stats={[
          { label: 'Sản phẩm đang bán', value: stats.products },
          { label: 'Lô đã công khai', value: stats.batches },
          { label: 'Nhóm hàng', value: data.categories.length },
        ]}
      />

      {/* ---------- trust badges: the promise row sits immediately under the hero ---------- */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST.map((t) => (
          <li
            key={t.title}
            className="flex items-start gap-3 rounded-[var(--radius-card)] border border-ink-100 bg-white p-4"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
              <Icon name={t.icon} className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-semibold text-ink-900">{t.title}</span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-600">{t.body}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* ---------- categories ---------- */}
      {data.categories.length > 0 && (
        <section>
          <SectionHeader
            display
            title="Mua theo nhóm hàng"
            hint="Nông sản Hưng Yên theo nhóm, tất cả đều bán theo lô có tem truy xuất."
            action={<SectionLink href="/san-pham">Xem tất cả →</SectionLink>}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.categories.map((c) => (
              <CategoryTile
                key={c.id}
                href={`/danh-muc/${c.slug}`}
                name={c.name}
                image={c.image}
                count={c.product_count}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---------- top rated ---------- */}
      <section>
        <SectionHeader
          display
          title="Khách đánh giá cao"
          hint="Xếp theo điểm đánh giá đã được duyệt của khách đã nhận hàng."
          action={<SectionLink href="/san-pham?sort=rating">Xem tất cả →</SectionLink>}
        />
        {data.featured.length === 0 ? (
          <EmptyState title="Chưa có sản phẩm nào còn hàng" hint="Các lô đang chờ kiểm nghiệm hoặc đã hết hàng." icon="products" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.featured.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ---------- promotions ---------- */}
      {promo.length > 0 && (
        <section>
          <SectionHeader
            display
            title="Ưu đãi theo lô cận hạn"
            hint="Giảm giá chỉ áp cho đúng số lượng còn lại của lô sắp hết hạn — giá trên trang sản phẩm là giá tham khảo."
            action={<SectionLink href="/san-pham?con-hang=true&sort=price_asc">Xem thêm →</SectionLink>}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {promo.map((p) => <ProductCard key={`promo-${p.id}`} product={p} />)}
          </div>
        </section>
      )}

      {/* ---------- traceability: the one dark editorial band on the page ---------- */}
      <section className="overflow-hidden rounded-[var(--radius-hero)] bg-brand-900 text-ivory-50">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-60 lg:min-h-full">
            <img
              src="/images/banners/trace-lab.jpg"
              alt="Ruộng lúa xanh của nông trại đối tác"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-10 lg:p-12">
            <p className="flex items-center gap-2 text-[11.5px] font-semibold tracking-[0.14em] text-brand-300 uppercase">
              <Icon name="qr" className="h-4 w-4" /> Truy xuất nguồn gốc
            </p>
            <h2 className="display mt-4 max-w-[20ch] text-[26px] leading-[1.1] text-white sm:text-[34px]">
              Quét tem trên bao bì, xem đúng hồ sơ lô bạn mua
            </h2>
            <ol className="mt-8 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                'Nông trại, xã/phường và nhà cung cấp được công khai',
                'Mùa vụ, ngày gieo và nhật ký canh tác đầy đủ',
                'Kết quả kiểm nghiệm dư lượng thuốc BVTV của phòng lab',
                'Cảnh báo thu hồi — nếu có — hiển thị ngay đầu trang',
              ].map((text, i) => (
                <li key={text} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ivory-100/85">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500 text-[11px] font-bold text-brand-900">
                    {i + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ol>
            <div className="mt-9 flex flex-wrap gap-2.5">
              <Link href="/tim-kiem" className="btn bg-brand-500 font-semibold text-brand-900 hover:bg-brand-400">
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
            display
            title="Nông sản theo mùa"
            hint="Rau quả đang vào vụ, bán theo lô có tem truy xuất."
            action={<SectionLink href="/san-pham?sort=newest">Xem tất cả →</SectionLink>}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {seasonal.map((p) => <ProductCard key={`season-${p.id}`} product={p} />)}
          </div>
        </section>
      )}

      {/* ---------- why us: editorial 3-up ---------- */}
      <section className="grid gap-x-10 gap-y-8 border-t border-ink-200/70 pt-9 md:grid-cols-3">
        {WHY.map((f) => (
          <div key={f.title}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <Icon name={f.icon} className="h-5 w-5" />
            </span>
            <p className="display mt-3.5 text-[17px] text-ink-900">{f.title}</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">{f.body}</p>
          </div>
        ))}
      </section>

      {/* ---------- delivery area ---------- */}
      <section className="grid gap-6 rounded-[var(--radius-hero)] bg-ivory-100 p-6 sm:p-10 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="eyebrow">Vùng giao hàng</p>
          <h2 className="display mt-3 text-[26px] leading-tight text-ink-900 sm:text-[32px]">
            Giao nội tỉnh {area?.province.name ?? 'Hưng Yên'}
          </h2>
          <p className="mt-3 max-w-[52ch] text-[14px] leading-relaxed text-ink-700">
            AgriMarket hiện giao tới {area?.serviceable_ward_count ?? '—'} xã/phường thuộc{' '}
            {area?.province.name ?? 'Hưng Yên'}. Phí giao {vnd(area?.ship_fee_vnd ?? 20_000)}, miễn phí cho đơn từ{' '}
            {freeShip}. Đơn ngoài vùng sẽ được chặn ngay khi thanh toán, không phát sinh phí ẩn.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/san-pham" className="btn-primary">Đặt hàng hôm nay</Link>
            <Link href="/chinh-sach/giao-hang" className="btn-secondary">Xem vùng giao hàng</Link>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 self-center border-t border-ivory-200 pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-8">
          {[
            ['Số xã/phường', area?.serviceable_ward_count ?? '—'],
            ['Phí giao', vnd(area?.ship_fee_vnd ?? 20_000)],
            ['Miễn phí từ', freeShip],
            ['Thời gian', '24 giờ làm việc'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] tracking-wide text-ink-600 uppercase">{label}</dt>
              <dd className="mt-1 text-[15px] font-semibold text-ink-900 tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- newest ---------- */}
      <section>
        <SectionHeader
          display
          title="Mới về kho"
          hint="Sản phẩm vừa được đưa lên kệ từ các lô đủ điều kiện bán."
          action={<SectionLink href="/san-pham?sort=newest">Xem tất cả →</SectionLink>}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.newest.map((p) => <ProductCard key={`new-${p.id}`} product={p} />)}
        </div>
        <p className="mt-4 text-xs text-ink-600">
          Tồn kho hiển thị là số lượng còn bán được từ các lô đã công khai: {qty(data.stats.batches)} lô đang mở.
        </p>
      </section>
    </div>
  )
}
