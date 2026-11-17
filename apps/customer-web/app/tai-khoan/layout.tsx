import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentCustomer } from '@/lib/session'
import { ADMIN_WEB } from '@/lib/config'
import { Icon } from '@agrimarket/ui'

const LINKS = [
  { href: '/tai-khoan', label: 'Hồ sơ', icon: 'user' as const },
  { href: '/tai-khoan/don-hang', label: 'Đơn hàng', icon: 'orders' as const },
  { href: '/tai-khoan/danh-gia', label: 'Đánh giá', icon: 'review' as const },
  { href: '/tai-khoan/khieu-nai', label: 'Khiếu nại', icon: 'complaint' as const },
]

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await currentCustomer()
  if (!user) redirect('/dang-nhap?next=/tai-khoan')

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 text-brand-700">
          <Icon name="user" />
        </span>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-ink-900">{user.name ?? user.email}</h1>
          <p className="truncate text-xs text-ink-500">{user.email}</p>
        </div>
        {user.role === 'ADMIN' && (
          <a href={`${ADMIN_WEB}/admin`} className="btn-secondary btn-sm ml-auto">
            <Icon name="dashboard" className="h-4 w-4" /> Trang quản trị
          </a>
        )}
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-ink-100 pb-2" aria-label="Khu vực tài khoản">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="btn-ghost btn-sm whitespace-nowrap">
            <Icon name={l.icon} className="h-4 w-4" /> {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
