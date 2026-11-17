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
    <nav className="flex gap-1 overflow-x-auto border-b border-ink-100 pb-2" aria-label="Khu vực tài khoản">
      {LINKS.map((l) => {
        const active = pathname === l.href
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={`btn-sm whitespace-nowrap ${active ? 'bg-brand-100 text-brand-800' : 'btn-ghost'}`}
          >
            <Icon name={l.icon} className="h-4 w-4" /> {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
