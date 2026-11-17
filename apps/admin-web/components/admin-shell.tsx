'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@agrimarket/ui'

interface Section {
  group: string
  items: Array<{ href: string; label: string; icon: IconName }>
}

const NAV: Section[] = [
  {
    group: 'Tổng quan',
    items: [
      { href: '/admin', label: 'Bảng điều khiển', icon: 'dashboard' },
      { href: '/admin/bao-cao', label: 'Báo cáo', icon: 'report' },
    ],
  },
  {
    group: 'Hàng hoá',
    items: [
      { href: '/admin/san-pham', label: 'Sản phẩm', icon: 'products' },
      { href: '/admin/danh-muc', label: 'Danh mục', icon: 'categories' },
      { href: '/admin/khuyen-mai', label: 'Khuyến mãi', icon: 'promotion' },
      { href: '/admin/kho', label: 'Kho & tồn', icon: 'warehouse' },
    ],
  },
  {
    group: 'Nguồn gốc',
    items: [
      { href: '/admin/nha-cung-cap', label: 'Nhà cung cấp', icon: 'supplier' },
      { href: '/admin/mua-vu', label: 'Mùa vụ', icon: 'season' },
      { href: '/admin/lo-hang', label: 'Lô hàng', icon: 'batch' },
      { href: '/admin/ma-qr', label: 'Mã QR', icon: 'qr' },
      { href: '/admin/thu-hoi', label: 'Thu hồi', icon: 'recall' },
    ],
  },
  {
    group: 'Bán hàng',
    items: [
      { href: '/admin/don-hang', label: 'Đơn hàng', icon: 'orders' },
      { href: '/admin/thanh-toan', label: 'Thanh toán', icon: 'payment' },
      { href: '/admin/khach-hang', label: 'Khách hàng', icon: 'customer' },
      { href: '/admin/danh-gia', label: 'Đánh giá', icon: 'review' },
      { href: '/admin/khieu-nai', label: 'Khiếu nại', icon: 'complaint' },
    ],
  },
  {
    group: 'Hệ thống',
    items: [{ href: '/admin/cai-dat', label: 'Cài đặt', icon: 'settings' }],
  },
]

const ALL_ITEMS = NAV.flatMap((s) => s.items)

/** Resolves the active page title from the nav map, so the header needs no per-page wiring. */
function titleFor(pathname: string): string {
  const hit = ALL_ITEMS.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0]
  return hit?.label ?? 'Quản trị'
}

export function AdminShell({ user, children }: { user: { name: string | null; email: string }; children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const title = titleFor(pathname)
  const root = ALL_ITEMS.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)).sort(
    (a, b) => a.href.length - b.href.length,
  )[0]

  async function logout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1'}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-agri-csrf': '1' },
    })
    window.location.href = '/dang-nhap'
  }

  return (
    <div className="flex min-h-dvh bg-ink-50">
      {/* backdrop only exists while the drawer is open on small screens */}
      {open && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[262px] shrink-0 flex-col border-r border-ink-200 bg-white transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-linear-to-br from-brand-500 to-brand-700 text-white">
            <Icon name="leaf" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold tracking-tight text-ink-900">AgriMarket</p>
            <p className="text-[10.5px] font-medium tracking-wide text-ink-500 uppercase">Bảng điều khiển</p>
          </div>
          <button type="button" className="btn-ghost btn-sm ml-auto lg:hidden" onClick={() => setOpen(false)} aria-label="Đóng">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto px-2.5 pb-3" aria-label="Chức năng quản trị">
          {NAV.map((section) => (
            <div key={section.group}>
              <p className="px-2.5 pb-1 pt-1 text-[10.5px] font-semibold tracking-[0.06em] text-ink-400 uppercase">
                {section.group}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors ${
                          active
                            ? 'bg-brand-50 font-semibold text-brand-800'
                            : 'font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                        }`}
                      >
                        {active && (
                          <span aria-hidden className="absolute top-1.5 bottom-1.5 -left-2.5 w-[3px] rounded-r bg-brand-600" />
                        )}
                        <Icon name={item.icon} className={`h-4 w-4 ${active ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600'}`} />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-ink-200 p-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-ink-50 px-2.5 py-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {(user.name ?? user.email).slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink-900">{user.name ?? 'Quản trị viên'}</p>
              <p className="truncate text-[11px] text-ink-500">{user.email}</p>
            </div>
            <button type="button" onClick={logout} className="btn-ghost btn-sm" aria-label="Đăng xuất">
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-200 bg-white/95 px-4 py-2.5 backdrop-blur sm:px-5">
          <button type="button" className="btn-ghost btn-sm lg:hidden" onClick={() => setOpen(true)} aria-label="Mở menu">
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[12.5px]">
            <Link href="/admin" className="text-ink-500 hover:text-brand-700">AgriMarket</Link>
            <Icon name="chevronRight" className="h-3 w-3 shrink-0 text-ink-300" />
            {root && root.label !== title && (
              <>
                <Link href={root.href} className="text-ink-500 hover:text-brand-700">{root.label}</Link>
                <Icon name="chevronRight" className="h-3 w-3 shrink-0 text-ink-300" />
              </>
            )}
            <span className="truncate font-semibold text-ink-900">{title}</span>
          </nav>
          <a
            href={process.env.NEXT_PUBLIC_CUSTOMER_WEB ?? 'http://localhost:3000'}
            className="btn-secondary btn-sm ml-auto"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="home" className="h-4 w-4" /> <span className="hidden sm:inline">Xem cửa hàng</span>
          </a>
        </header>
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-5">{children}</main>
      </div>
    </div>
  )
}
