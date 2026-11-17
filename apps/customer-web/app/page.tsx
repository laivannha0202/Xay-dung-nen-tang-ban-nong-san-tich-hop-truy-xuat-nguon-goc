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
    .slice(0, 8)
  const banner = '/images/banners/hero-farm.jpg'

  return (
    <div className="space-y-12">
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden rounded-2xl border border-brand-100 bg-brand-900">
        <img
          src={banner}
          alt="Luống rau trong nhà màng của nông trại đối tác AgriMarket"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/80 to-brand-900/30" />
        <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-brand-50 ring-1 ring-white/25 ring-inset">
              <Icon name="shield" className="h-3.5 w-3.5" /> Mỗi lô một mã QR truy xuất
            </p>
            <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.7rem]">
              Nông sản tươi, rõ nguồn gốc
              <span className="block text-brand-200">từ nông trại đến bàn ăn</span>
            </h1>
            <p className="mt-3 text-brand-50/90">
              Xem nông trại, mùa vụ, nhật ký canh tác và kết quả kiểm nghiệm dư lượng thuốc bảo vệ thực vật của đúng lô
              hàng bạn mua — trước khi bấm đặt.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/san-pham" className="btn-primary btn-lg bg-white text-brand-800 hover:bg-brand-50 active:bg-brand-100">
                Mua nông sản <Icon name="chevronRight" className="h-4 w-4" />
              </Link>
              <Link href="/tim-kiem" className="btn-lg btn inline-flex border border-white/40 text-white hover:bg-white/10">
                <Icon name="qr" className="h-4 w-4" /> Tra cứu tem QR
              </Link>
            </div>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 text-sm">
              {[
                ['Sản phẩm', data.stats.products],
                ['Lô đã công khai', data.stats.batches],
                ['Danh mục', data.categories.length],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15 ring-inset">
                  <dt className="text-[11px] tracking-wide text-brand-100 uppercase">{label}</dt>
                  <dd className="text-2xl font-semibold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="hidden gap-3 lg:grid">
            {promo.slice(0, 2).map((p) => (
              <Link
                key={p.id}
                href={`/san-pham/${p.slug}`}
                className="flex items-center gap-3 rounded-xl bg-white/95 p-3 shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-0.5"
              >
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                  {p.image ? (
                    <img src={mediaUrl(p.image) ?? ''} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-brand-300"><Icon name="leaf" /></span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-900">{p.name}</span>
                  <span className="block text-sm font-semibold text-brand-800">
                    {vnd(p.base_price_vnd)}<span className="text-xs font-normal text-ink-500">/{p.unit}</span>
                  </span>
                  <span className="badge mt-1 bg-sand-50 text-sand-700 ring-sand-500/20">
                    <Icon name="promotion" className="h-3 w-3" /> Lô cận hạn giảm giá
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-white/15 px-6 py-3 text-sm text-brand-50">
          <span className="flex items-center gap-2">
            <Icon name="truck" className="h-4 w-4" /> Miễn phí giao hàng cho đơn từ {vnd(500_000)}
          </span>
          <Link href="/chinh-sach/giao-hang" className="underline underline-offset-2 hover:text-white">
            Chính sách giao hàng
          </Link>
        </div>
      </section>

      {/* ---------- categories ---------- */}
      {data.categories.length > 0 && (
        <section>
          <SectionHeader
            title="Danh mục nổi bật"
            action={<Link href="/san-pham" className="text-sm text-brand-700 hover:underline">Xem tất cả</Link>}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.categories.map((c) => (
              <Link key={c.id} href={`/danh-muc/${c.slug}`} className="card card-hover group overflow-hidden">
                <span className="relative block aspect-16/9 overflow-hidden bg-brand-50">
                  {c.image ? (
                    <img
                      src={mediaUrl(c.image) ?? ''}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-brand-300"><Icon name="leaf" className="h-7 w-7" /></span>
                  )}
                </span>
                <span className="block p-3">
                  <span className="block truncate font-medium text-ink-900">{c.name}</span>
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
            action={<Link href="/san-pham?con-hang=true&sort=price_asc" className="text-sm text-brand-700 hover:underline">Xem thêm</Link>}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {promo.map((p) => <ProductCard key={`promo-${p.id}`} product={p} />)}
          </div>
        </section>
      )}

      {/* ---------- top rated ---------- */}
      <section>
        <SectionHeader
          title="Khách đánh giá cao"
          hint="Xếp theo điểm đánh giá đã được duyệt của khách đã nhận hàng."
          action={<Link href="/san-pham?sort=rating" className="text-sm text-brand-700 hover:underline">Xem tất cả</Link>}
        />
        {data.featured.length === 0 ? (
          <EmptyState title="Chưa có sản phẩm nào còn hàng" hint="Các lô đang chờ kiểm nghiệm hoặc đã hết hàng." icon="products" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ---------- seasonal ---------- */}
      {seasonal.length > 0 && (
        <section>
          <SectionHeader
            title="Nông sản theo mùa"
            hint="Rau quả đang vào vụ, thu hoạch trong tuần và giao trong ngày ở Hưng Yên."
            action={<Link href="/san-pham?sort=newest" className="text-sm text-brand-700 hover:underline">Xem tất cả</Link>}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {seasonal.map((p) => <ProductCard key={`season-${p.id}`} product={p} />)}
          </div>
        </section>
      )}

      {/* ---------- traceability ---------- */}
      <section className="overflow-hidden rounded-2xl border border-brand-100 bg-white">
        <div className="grid md:grid-cols-2">
          <div className="relative min-h-56">
            <img
              src="/images/banners/trace-lab.jpg"
              alt="Ruộng lúa xanh của nông trại đối tác"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-brand-800">
              Hồ sơ lô hàng công khai
            </span>
          </div>
          <div className="p-6 sm:p-8">
            <p className="badge bg-brand-50 text-brand-700 ring-brand-200">
              <Icon name="qr" className="h-3.5 w-3.5" /> Truy xuất nguồn gốc
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">
              Quét tem trên bao bì, xem đúng hồ sơ của lô bạn mua
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-700">
              {[
                ['pin', 'Nông trại, xã/phường và nhà cung cấp'],
                ['season', 'Mùa vụ, ngày gieo và nhật ký canh tác'],
                ['shield', 'Kết quả kiểm nghiệm dư lượng thuốc BVTV'],
                ['recall', 'Cảnh báo thu hồi nếu lô có sự cố'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-start gap-2">
                  <Icon name={icon as 'pin'} className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                  {text}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/tim-kiem" className="btn-primary">Tra cứu mã tem</Link>
              <Link href="/chinh-sach/doi-tra" className="btn-secondary">Chính sách đổi trả</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- why us ---------- */}
      <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <div className="grid gap-0 md:grid-cols-3">
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
              <p className="mt-1 text-sm text-ink-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- delivery area ---------- */}
      <section className="grid gap-4 rounded-2xl border border-sand-200 bg-sand-50/70 p-6 sm:p-8 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="badge bg-white text-sand-700 ring-sand-500/20">
            <Icon name="truck" className="h-3.5 w-3.5" /> Vùng giao hàng
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">
            Giao nội tỉnh {area?.province.name ?? 'Hưng Yên'} trong ngày
          </h2>
          <p className="mt-2 text-sm text-ink-700">
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
        <ul className="grid grid-cols-2 gap-2 self-center text-sm sm:grid-cols-3 md:grid-cols-2">
          {[
            ['Số xã/phường', area?.serviceable_ward_count ?? '—'],
            ['Phí giao', vnd(area?.ship_fee_vnd ?? 20_000)],
            ['Miễn phí từ', vnd(area?.free_ship_threshold_vnd ?? 500_000)],
            ['Thời gian', 'Trong ngày'],
          ].map(([label, value]) => (
            <li key={label} className="rounded-xl bg-white px-3 py-2 ring-1 ring-sand-200 ring-inset">
              <span className="block text-[11px] tracking-wide text-ink-500 uppercase">{label}</span>
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
          action={<Link href="/san-pham?sort=newest" className="text-sm text-brand-700 hover:underline">Xem tất cả</Link>}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.newest.map((p) => <ProductCard key={`new-${p.id}`} product={p} />)}
        </div>
        <p className="mt-3 text-xs text-ink-500">
          Tồn kho hiển thị là số lượng còn bán được từ các lô đã công khai: {qty(data.stats.batches)} lô đang mở.
        </p>
      </section>
    </div>
  )
}
