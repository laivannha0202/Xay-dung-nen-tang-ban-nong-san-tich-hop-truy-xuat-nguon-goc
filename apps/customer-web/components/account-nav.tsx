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

export function AccountNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Khu vực tài khoản" className="-mx-1 overflow-x-auto px-1">
      <ul className="flex gap-1.5 pb-1">
        {LINKS.map((l) => {
          // Detail routes (`/don-hang/[id]`) keep their section tab lit.
          const on = l.href === '/tai-khoan' ? pathname === l.href : pathname.startsWith(l.href)
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={on ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
                  on ? 'bg-brand-600 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-100 hover:text-brand-700'
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
