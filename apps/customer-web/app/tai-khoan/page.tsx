import Link from 'next/link'
import { currentCustomer } from '@/lib/session'
import { Icon, type IconName } from '@agrimarket/ui'

export const metadata = { title: 'Tài khoản của tôi' }

type Card = { href: string; title: string; hint: string; icon: IconName }

/** One card per job the shopper actually comes here to do. Every href is a route that exists. */
const CARDS: Card[] = [
  { href: '/tai-khoan/don-hang', title: 'Đơn hàng của tôi', hint: 'Theo dõi đơn, xem chi tiết và mua lại.', icon: 'orders' },
  { href: '/tai-khoan/voucher', title: 'Ví voucher', hint: 'Xem và dùng mã giảm giá đã lưu.', icon: 'promotion' },
  { href: '/tai-khoan/dia-chi', title: 'Địa chỉ giao hàng', hint: 'Thêm, sửa, xóa và chọn địa chỉ mặc định.', icon: 'pin' },
  { href: '/tai-khoan/ho-so', title: 'Hồ sơ cá nhân', hint: 'Cập nhật họ tên và số điện thoại.', icon: 'user' },
  { href: '/tai-khoan/bao-mat', title: 'Đăng nhập & bảo mật', hint: 'Đổi mật khẩu và bảo vệ tài khoản.', icon: 'shield' },
  { href: '/tai-khoan/danh-gia', title: 'Đánh giá của tôi', hint: 'Xem lại đánh giá đã gửi.', icon: 'review' },
  { href: '/tai-khoan/khieu-nai', title: 'Khiếu nại & hỗ trợ', hint: 'Theo dõi phản hồi và trạng thái xử lý.', icon: 'complaint' },
]

/** First letter of the first and last name word — no avatar upload to store. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? words.at(-1)![0] : '')).toUpperCase() || '?'
}

export default async function AccountPage() {
  const user = await currentCustomer()
  if (!user) return null
  const display = user.name ?? user.email

  return (
    <div className="space-y-5">
      <section className="card-pad flex items-center gap-4 py-5 sm:gap-5">
        <span
          aria-hidden="true"
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-50 text-[22px] font-bold text-brand-700 ring-1 ring-brand-100"
        >
          {initials(display)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Tài khoản của tôi</p>
          <h1 className="mt-0.5 truncate text-xl font-bold text-ink-900 sm:text-2xl">{display}</h1>
          <p className="truncate text-sm text-ink-600">{user.email}</p>
        </div>
        <Link
          href="/tai-khoan/ho-so"
          className="hidden shrink-0 items-center gap-1 rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
        >
          Sửa hồ sơ <Icon name="chevronRight" className="h-3.5 w-3.5" />
        </Link>
      </section>

      <nav aria-label="Chức năng tài khoản">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="group flex h-full items-start gap-3 rounded-[var(--radius-card)] border border-ink-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40 sm:p-5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-100">
                  <Icon name={c.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink-900 group-hover:text-brand-700">{c.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-600">{c.hint}</span>
                </span>
                <Icon
                  name="chevronRight"
                  className="mt-2 h-4 w-4 shrink-0 text-ink-400 transition-colors group-hover:text-brand-700"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
