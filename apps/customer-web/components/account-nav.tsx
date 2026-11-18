'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@agrimarket/ui'

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/tai-khoan', label: 'Hồ sơ', icon: 'user' },
  { href: '/tai-khoan/don-hang', label: 'Đơn hàng', icon: 'orders' },
  { href: '/tai-khoan/danh-gia', label: 'Đánh giá', icon: 'review' },
  { href: '/tai-khoan/khieu-nai', label: 'Khiếu nại', icon: 'complaint' },
]

export function AccountNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Khu vực tài khoản">
      {LINKS.map((l) => {
        const active = pathname === l.href
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
              active ? 'bg-brand-600 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-100 hover:text-brand-700'
            }`}
          >
            <Icon name={l.icon} className="h-4 w-4" /> {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
