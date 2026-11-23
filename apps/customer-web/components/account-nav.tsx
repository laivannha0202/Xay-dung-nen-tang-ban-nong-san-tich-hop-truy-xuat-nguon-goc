'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@agrimarket/ui'

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/tai-khoan', label: 'Tổng quan', icon: 'dashboard' },
  { href: '/tai-khoan/don-hang', label: 'Đơn hàng', icon: 'orders' },
  { href: '/tai-khoan/ho-so', label: 'Hồ sơ', icon: 'user' },
  { href: '/tai-khoan/dia-chi', label: 'Địa chỉ', icon: 'pin' },
  { href: '/tai-khoan/bao-mat', label: 'Bảo mật', icon: 'shield' },
  { href: '/tai-khoan/danh-gia', label: 'Đánh giá', icon: 'review' },
  { href: '/tai-khoan/khieu-nai', label: 'Khiếu nại', icon: 'complaint' },
]

/** Section switcher for every account page; scrolls on narrow screens instead of wrapping. */
export function AccountNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Khu vực tài khoản" className="-mx-3 overflow-x-auto border-b border-ink-200 px-3 sm:mx-0 sm:overflow-visible sm:px-0">
      <ul className="flex gap-1">
        {LINKS.map((l) => {
          // Detail routes (`/don-hang/[id]`) keep their section tab lit.
          const on = l.href === '/tai-khoan' ? pathname === l.href : pathname.startsWith(l.href)
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={on ? 'page' : undefined}
                className={`-mb-px inline-flex min-h-11 items-center gap-1.5 border-b-2 px-3 text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
                  on
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-ink-600 hover:border-ink-300 hover:text-ink-900'
                }`}
              >
                <Icon name={l.icon} className="h-4 w-4" />
                {l.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Same back-link and label on every account subpage. */
export function AccountBreadcrumb() {
  return (
    <Link href="/tai-khoan" className="inline-flex items-center gap-1 text-xs font-medium text-ink-600 hover:text-brand-700">
      <Icon name="chevronRight" className="h-3 w-3 rotate-180" />
      Tài khoản của tôi
    </Link>
  )
}
