import Link from 'next/link'
import { mediaUrl } from '@/lib/config'
import { serverFetch } from '@/lib/api'
import { vnd } from '@/lib/format'
import type { HomePayload } from '@agrimarket/core'
import { Icon, EmptyState, SectionHeader } from '@agrimarket/ui'
import { ProductCard } from '@/components/product-card'

export default async function HomePage() {
  const data = await serverFetch<HomePayload>('/home', undefined, 60)
  if (!data) {
    return <EmptyState title="Chưa có dữ liệu sản phẩm" hint="Máy chủ chưa trả về danh mục nào đang bán." />
  }

  const promo = [...data.featured, ...data.newest].filter((p) => p.has_batch_promo).slice(0, 4)
  const heroImage = mediaUrl(data.featured[0]?.image ?? data.newest[0]?.image ?? null)

  return (
    <div className="space-y-12">
      {/* ---------- hero ---------- */}
      <section className="overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-sand-50">
        <div className="grid items-center gap-6 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="badge bg-white text-brand-700 ring-brand-200">
              <Icon name="shield" className="h-3.5 w-3.5" /> Truy xuất tới từng lô hàng
            </p>
            <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-ink-900 sm:text-4xl lg:text-[2.6rem]">
              Nông sản tươi, rõ nguồn gốc
              <span className="block text-brand-700">từ nông trại đến bàn ăn</span>
            </h1>
            <p className="mt-3 max-w-xl text-ink-600">
              Mỗi lô hàng có mã QR riêng: xem nông trại, mùa vụ, nhật ký canh tác, kết quả kiểm nghiệm dư lượng thuốc
              bảo vệ thực vật và chứng nhận trước khi bạn quyết định mua.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/san-pham" className="btn-primary btn-lg">
                Mua nông sản <Icon name="chevronRight" className="h-4 w-4" />
              </Link>
              <Link href="/tim-kiem" className="btn-secondary btn-lg">
                <Icon name="qr" className="h-4 w-4" /> Tra cứu tem QR
              </Link>
            </div>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-ink-500">Sản phẩm</dt>
                <dd className="text-2xl font-semibold text-ink-900">{data.stats.products}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Lô đã công khai</dt>
                <dd className="text-2xl font-semibold text-ink-900">{data.stats.batches}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Danh mục</dt>
                <dd className="text-2xl font-semibold text-ink-900">{data.categories.length}</dd>
              </div>
            </dl>
          </div>
          <div className="relative hidden aspect-4/3 overflow-hidden rounded-xl border border-white bg-brand-50 shadow-[var(--shadow-card)] lg:block">
            {heroImage ? (
              <img src={heroImage} alt="Nông sản đang bán tại AgriMarket" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-brand-300">
                <Icon name="leaf" className="h-16 w-16" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- categories ---------- */}
      {data.categories.length > 0 && (
        <section>
          <SectionHeader
            title="Danh mục nổi bật"
            action={<Link href="/san-pham" className="text-sm text-brand-700 hover:underline">Xem tất cả</Link>}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.categories.map((c) => (
              <Link
                key={c.id}
                href={`/danh-muc/${c.slug}`}
                className="card card-hover flex items-center gap-3 p-3"
              >
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                  {c.image ? (
                    <img src={mediaUrl(c.image) ?? ''} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-brand-300">
                      <Icon name="leaf" className="h-6 w-6" />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
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
            hint="Giảm giá chỉ áp cho đúng số lượng còn lại của lô sắp hết hạn — giá hiển thị ở trang sản phẩm là giá tham khảo."
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
          <EmptyState title="Chưa có sản phẩm nào còn hàng" hint="Các lô đang chờ kiểm nghiệm hoặc đã hết hàng." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ---------- newest ---------- */}
      <section>
        <SectionHeader
          title="Mới về kho"
          hint="Sản phẩm vừa được đưa lên kệ từ các lô đủ điều kiện bán."
          action={<Link href="/san-pham?sort=newest" className="text-sm text-brand-700 hover:underline">Xem tất cả</Link>}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.newest.map((p) => <ProductCard key={`new-${p.id}`} product={p} />)}
        </div>
      </section>

      {/* ---------- provenance explainer ---------- */}
      <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <div className="grid gap-0 md:grid-cols-3">
          {[
            {
              icon: 'pin' as const,
              title: 'Nông trại có địa chỉ',
              body: 'Tên nông trại, xã/huyện/tỉnh và nhà cung cấp được công khai trên trang truy xuất của lô.',
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 bg-ink-50/60 px-6 py-3 text-sm text-ink-600">
          <span>Miễn phí giao hàng cho đơn từ {vnd(500_000)}.</span>
          <Link href="/chinh-sach/giao-hang" className="text-brand-700 hover:underline">Chính sách giao hàng</Link>
        </div>
      </section>
    </div>
  )
}
