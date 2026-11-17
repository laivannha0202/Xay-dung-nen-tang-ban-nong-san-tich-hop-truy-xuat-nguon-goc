import Link from 'next/link'
import { mediaUrl } from '@/lib/config'
import { serverFetch } from '@/lib/api'
import { vnd, qty } from '@/lib/format'
import type { HomePayload } from '@agrimarket/core'
import { Icon, EmptyState, SectionHeader } from '@agrimarket/ui'
import { ProductCard } from '@/components/product-card'

interface ServiceArea {
  province: { name: string }
  ward_count: number
  serviceable_ward_count: number
  ship_fee_vnd: number
  free_ship_threshold_vnd: number
}

/** Seasonal split is presentation-only: summer stock first, then the pantry. */
const SEASONAL_CATEGORIES = ['trai-cay', 'rau-cu']

const TRUST = [
  { icon: 'truck' as const, text: 'Miễn phí giao đơn từ 500.000₫' },
  { icon: 'shield' as const, text: 'Lô đạt kiểm nghiệm mới được bán' },
  { icon: 'qr' as const, text: 'Truy xuất bằng mã QR trên bao bì' },
  { icon: 'orders' as const, text: 'Đổi trả trong 24 giờ nếu lô lỗi' },
]

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[13px] font-semibold text-brand-700 hover:text-brand-600 hover:underline">
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
  const banner = '/images/banners/hero-farm.jpg'

  return (
    <div className="space-y-10">
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-900">
        <img
          src={banner}
          alt="Luống rau trong nhà màng của nông trại đối tác AgriMarket"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#092e1b]/95 via-[#092e1b]/75 to-[#092e1b]/15" />
        <div className="relative grid items-center gap-8 px-5 py-8 sm:px-10 sm:py-11 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-brand-50 ring-1 ring-white/25 ring-inset">
              <Icon name="shield" className="h-3.5 w-3.5" /> Mỗi lô một mã QR truy xuất
            </p>
            <h1 className="mt-4 text-[2.1rem] leading-[1.08] font-bold tracking-tight text-white sm:text-[2.5rem] lg:text-[2.75rem]">
              Nông sản tươi, rõ nguồn gốc
              <span className="block text-brand-200">từ nông trại đến bàn ăn</span>
            </h1>
            <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-brand-50/90">
              Xem nông trại, mùa vụ, nhật ký canh tác và kết quả kiểm nghiệm dư lượng thuốc bảo vệ thực vật của đúng
              lô hàng bạn mua — trước khi bấm đặt.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/san-pham" className="btn-lg btn inline-flex bg-white font-semibold text-brand-800 hover:bg-brand-50">
                Mua nông sản <Icon name="chevronRight" className="h-4 w-4" />
              </Link>
              <Link
                href="/tim-kiem"
                className="btn-lg btn inline-flex border border-white/40 text-white hover:bg-white/10"
              >
                <Icon name="qr" className="h-4 w-4" /> Tra cứu tem QR
              </Link>
            </div>
            <dl className="mt-7 flex flex-wrap gap-2.5">
              {[
                ['Sản phẩm', data.stats.products],
                ['Lô đã công khai', data.stats.batches],
                ['Danh mục', data.categories.length],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl bg-white/10 px-3.5 py-2 ring-1 ring-white/15 ring-inset">
                  <dt className="text-[10.5px] tracking-wide text-brand-100 uppercase">{label}</dt>
                  <dd className="text-xl font-bold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="hidden gap-3 lg:grid">
            {promo.slice(0, 2).map((p) => (
              <Link
                key={p.id}
                href={`/san-pham/${p.slug}`}
                className="flex items-center gap-3 rounded-2xl bg-white/97 p-3 shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none"
              >
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                  {p.image ? (
                    <img src={mediaUrl(p.image) ?? ''} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-brand-300"><Icon name="leaf" /></span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink-900">{p.name}</span>
                  <span className="block text-sm font-bold text-brand-800">
                    {vnd(p.base_price_vnd)}<span className="text-xs font-normal text-ink-500">/{p.unit}</span>
                  </span>
                  <span className="mt-1 inline-block rounded-full bg-sand-50 px-2 py-0.5 text-[10.5px] font-semibold text-sand-700 ring-1 ring-sand-200 ring-inset">
                    Lô cận hạn giảm giá
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- trust strip ---------- */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST.map((t) => (
          <li key={t.text} className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-[12.5px] font-medium text-ink-700">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Icon name={t.icon} className="h-4 w-4" />
            </span>
            {t.text}
          </li>
        ))}
      </ul>

      {/* ---------- categories ---------- */}
      {data.categories.length > 0 && (
        <section>
          <SectionHeader
            title="Danh mục nổi bật"
            hint="Nông sản Hưng Yên theo nhóm hàng, tất cả đều bán theo lô."
            action={<SectionLink href="/san-pham">Xem tất cả →</SectionLink>}
          />
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {data.categories.map((c) => (
              <Link key={c.id} href={`/danh-muc/${c.slug}`} className="group overflow-hidden rounded-2xl border border-ink-200 bg-white transition-shadow hover:shadow-[var(--shadow-card)]">
                <span className="relative block aspect-16/10 overflow-hidden bg-brand-50">
                  {c.image ? (
                    <img
                      src={mediaUrl(c.image) ?? ''}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-brand-300"><Icon name="leaf" className="h-7 w-7" /></span>
                  )}
                </span>
                <span className="block px-3 py-2.5">
                  <span className="block truncate text-sm font-semibold text-ink-900 group-hover:text-brand-700">{c.name}</span>
                  <span className="text-xs text-ink-500">{c.product_count} sản phẩm</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- promotions ---------- */}
      {promo.length > 0 && (
        <section>
          <SectionHeader
            title="Ưu đãi theo lô cận hạn"
            hint="Giảm giá chỉ áp cho đúng số lượng còn lại của lô sắp hết hạn — giá trên trang sản phẩm là giá tham khảo."
            action={<SectionLink href="/san-pham?con-hang=true&sort=price_asc">Xem thêm →</SectionLink>}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {promo.map((p) => <ProductCard key={`promo-${p.id}`} product={p} />)}
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.featured.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ---------- traceability ---------- */}
      <section className="overflow-hidden rounded-3xl border border-ink-200 bg-white">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-60">
            <img
              src="/images/banners/trace-lab.jpg"
              alt="Ruộng lúa xanh của nông trại đối tác"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute bottom-3 left-3 rounded-lg bg-white/92 px-2.5 py-1 text-xs font-semibold text-brand-800">
              Hồ sơ lô hàng công khai
            </span>
          </div>
          <div className="p-6 sm:p-9">
            <p className="badge bg-brand-50 text-brand-700 ring-brand-200">
              <Icon name="qr" className="h-3.5 w-3.5" /> Truy xuất nguồn gốc
            </p>
            <h2 className="mt-3 text-2xl leading-snug font-bold tracking-tight text-ink-900 sm:text-[26px]">
              Quét tem trên bao bì, xem đúng hồ sơ của lô bạn mua
            </h2>
            <ol className="mt-5 space-y-3">
              {[
                'Nông trại, xã/phường và nhà cung cấp được công khai',
                'Mùa vụ, ngày gieo và nhật ký canh tác đầy đủ',
                'Kết quả kiểm nghiệm dư lượng thuốc BVTV của phòng lab',
                'Cảnh báo thu hồi — nếu có — hiển thị ngay đầu trang',
              ].map((text, i) => (
                <li key={text} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                    {i + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/tim-kiem" className="btn-primary">Tra cứu mã tem</Link>
              <Link href="/chinh-sach/doi-tra" className="btn-secondary">Chính sách đổi trả</Link>
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {seasonal.map((p) => <ProductCard key={`season-${p.id}`} product={p} />)}
          </div>
        </section>
      )}

      {/* ---------- why us ---------- */}
      <section className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        <div className="grid md:grid-cols-3">
          {[
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
          ].map((f) => (
            <div key={f.title} className="border-ink-100 p-6 md:border-r md:last:border-r-0">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name={f.icon} />
              </span>
              <p className="mt-3 font-semibold text-ink-900">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- delivery area ---------- */}
      <section className="grid gap-5 rounded-2xl border border-sand-200 bg-sand-50/70 p-6 sm:p-8 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="badge bg-white text-sand-700 ring-sand-200">
            <Icon name="truck" className="h-3.5 w-3.5" /> Vùng giao hàng
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900">
            Giao nội tỉnh {area?.province.name ?? 'Hưng Yên'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            AgriMarket hiện giao tới {area?.serviceable_ward_count ?? '—'} xã/phường thuộc{' '}
            {area?.province.name ?? 'Hưng Yên'}. Phí giao {vnd(area?.ship_fee_vnd ?? 20_000)}, miễn phí cho đơn từ{' '}
            {vnd(area?.free_ship_threshold_vnd ?? 500_000)}. Đơn ngoài vùng sẽ được chặn ngay khi thanh toán, không
            phát sinh phí ẩn.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/san-pham" className="btn-primary">Đặt hàng hôm nay</Link>
            <Link href="/chinh-sach/giao-hang" className="btn-secondary">Xem vùng giao hàng</Link>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-2 self-center text-sm">
          {[
            ['Số xã/phường', area?.serviceable_ward_count ?? '—'],
            ['Phí giao', vnd(area?.ship_fee_vnd ?? 20_000)],
            ['Miễn phí từ', freeShip],
            ['Thời gian', 'Trong ngày'],
          ].map(([label, value]) => (
            <li key={label} className="rounded-xl bg-white px-3 py-2 ring-1 ring-sand-200 ring-inset">
              <span className="block text-[10.5px] tracking-wide text-ink-500 uppercase">{label}</span>
              <span className="font-semibold text-ink-900">{value}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- pantry / newest ---------- */}
      <section>
        <SectionHeader
          title="Mới về kho"
          hint="Sản phẩm vừa được đưa lên kệ từ các lô đủ điều kiện bán."
          action={<SectionLink href="/san-pham?sort=newest">Xem tất cả →</SectionLink>}
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {data.newest.map((p) => <ProductCard key={`new-${p.id}`} product={p} />)}
        </div>
        <p className="mt-3 text-xs text-ink-500">
          Tồn kho hiển thị là số lượng còn bán được từ các lô đã công khai: {qty(data.stats.batches)} lô đang mở.
        </p>
      </section>
    </div>
  )
}
