import Link from 'next/link'
import { currentCustomer } from '@/lib/session'
import { Icon, type IconName } from '@agrimarket/ui'

export const metadata = { title: 'Tài khoản của tôi' }

/** One card per job the shopper actually comes here to do. Every href is a route that exists. */
const CARDS: Array<{ href: string; title: string; hint: string; icon: IconName }> = [
  { href: '/tai-khoan/don-hang', title: 'Đơn hàng của tôi', hint: 'Xem đơn đã đặt, theo dõi giao hàng và mua lại.', icon: 'orders' },
  { href: '/tai-khoan/dia-chi', title: 'Địa chỉ giao hàng', hint: 'Thêm, sửa, xóa và chọn địa chỉ mặc định.', icon: 'pin' },
  { href: '/tai-khoan/ho-so', title: 'Hồ sơ cá nhân', hint: 'Cập nhật họ tên và số điện thoại liên hệ.', icon: 'user' },
  { href: '/tai-khoan/bao-mat', title: 'Đăng nhập & bảo mật', hint: 'Đổi mật khẩu và xem hướng dẫn bảo mật.', icon: 'shield' },
  { href: '/tai-khoan/danh-gia', title: 'Đánh giá của tôi', hint: 'Xem lại đánh giá đã gửi cho sản phẩm.', icon: 'review' },
  { href: '/tai-khoan/khieu-nai', title: 'Khiếu nại & hỗ trợ', hint: 'Theo dõi phản hồi và trạng thái xử lý.', icon: 'complaint' },
]

export default async function AccountPage() {
  const user = await currentCustomer()
  if (!user) return null
  const display = user.name ?? user.email
  const initial = display.trim().charAt(0).toUpperCase()

  return (
    <div className="space-y-5">
      <section className="card-pad flex flex-wrap items-center gap-4 sm:p-6">
        <span
          aria-hidden="true"
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-50 text-[26px] font-bold text-brand-700 ring-1 ring-brand-100"
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-600">Xin chào, {display.split(' ').at(-1)}</p>
          <h1 className="truncate text-xl font-bold text-ink-900 sm:text-2xl">{display}</h1>
          <p className="truncate text-sm text-ink-500">{user.email}</p>
          <p className="mt-1 text-sm text-ink-600">Quản lý đơn hàng và thông tin tài khoản của bạn.</p>
        </div>
      </section>

      <nav aria-label="Chức năng tài khoản">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="card-pad card-hover group flex h-full items-start gap-3 hover:shadow-[var(--shadow-card)]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100">
                  <Icon name={c.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink-900 group-hover:text-brand-700">{c.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-600">{c.hint}</span>
                  <span className="mt-2 inline-flex items-center gap-0.5 text-[13px] font-semibold text-brand-700">
                    Xem <Icon name="chevronRight" className="h-3.5 w-3.5" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
