'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandLogo, Icon } from '@agrimarket/ui'
import { useCart } from '@/components/cart-provider'
import { DeliveryPicker } from '@/components/delivery-picker'
import { SearchBox } from '@/components/search-box'
import type { SessionUser } from '@/lib/session'

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1'

const NAV: Array<{ href: string; label: string }> = [
  { href: '/san-pham', label: 'Tất cả sản phẩm' },
  { href: '/danh-muc/trai-cay', label: 'Trái cây' },
  { href: '/danh-muc/rau-cu', label: 'Rau củ' },
  { href: '/danh-muc/gao-ngu-coc', label: 'Gạo & ngũ cốc' },
  { href: '/danh-muc/dac-san', label: 'Đặc sản Hưng Yên' },
]

/** Three jobs of a store header: find something, know where it ships, reach the basket. */
export function SiteHeader({ user }: { user: SessionUser | null }) {
  const { count } = useCart()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  async function logout() {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2 py-1" aria-label="AgriMarket — trang chủ">
          <BrandLogo size="md" />
          <span className="hidden text-[19px] leading-none font-bold tracking-tight text-brand-700 lg:block">
            AgriMarket
          </span>
        </Link>

        <DeliveryPicker />

        <SearchBox />

        <nav className="flex shrink-0 items-center gap-0.5" aria-label="Tài khoản và giỏ hàng">
          <Link href={user ? '/tai-khoan' : '/dang-nhap'} className="hidden items-start rounded-lg px-2 py-1.5 leading-tight hover:bg-ink-100 sm:flex sm:flex-col">
            <span className="text-[11px] text-ink-500">Xin chào, {user?.name?.split(' ').at(-1) ?? 'khách'}</span>
            <span className="text-[13px] font-semibold text-ink-900">Tài khoản</span>
          </Link>
          <Link href="/tai-khoan/don-hang" className="hidden items-start rounded-lg px-2 py-1.5 leading-tight hover:bg-ink-100 md:flex md:flex-col">
            <span className="text-[11px] text-ink-500">Theo dõi</span>
            <span className="text-[13px] font-semibold text-ink-900">Đơn hàng</span>
          </Link>
          <Link
            href="/gio-hang"
            className="relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-ink-100"
            aria-label={`Giỏ hàng, ${count} sản phẩm`}
          >
            <span className="relative">
              <Icon name="cart" className="h-6 w-6 text-ink-900" />
              <span className="absolute -top-1.5 -right-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            </span>
            <span className="hidden text-[13px] font-semibold text-ink-900 sm:block">Giỏ</span>
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg text-ink-800 hover:bg-ink-100 md:hidden"
            aria-label="Mở menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} className="h-5 w-5" />
          </button>
        </nav>
      </div>

      {/* category rail: the aisle signs, one line, scrollable on narrow screens */}
      <div className="border-t border-ink-200 bg-ink-100/70">
        <div className="mx-auto flex max-w-[1440px] items-center gap-0.5 overflow-x-auto px-3 sm:px-5">
          <Link
            href="/san-pham"
            className="flex shrink-0 items-center gap-1.5 py-2 pr-2 text-[13px] font-semibold text-ink-900 hover:text-brand-700"
          >
            <Icon name="menu" className="h-4 w-4" /> Danh mục
          </Link>
          {NAV.slice(1).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? 'page' : undefined}
              className={`shrink-0 rounded-md px-2.5 py-2 text-[13px] whitespace-nowrap hover:text-brand-700 ${
                pathname === n.href ? 'font-semibold text-brand-700' : 'text-ink-700'
              }`}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/san-pham?sort=newest"
            className="shrink-0 rounded-md px-2.5 py-2 text-[13px] font-semibold whitespace-nowrap text-sand-700 hover:text-sand-700/80"
          >
            Hàng mới về
          </Link>
          <Link
            href="/tim-kiem"
            className="ml-auto hidden shrink-0 items-center gap-1 px-2.5 py-2 text-[12.5px] whitespace-nowrap text-ink-600 hover:text-brand-700 lg:flex"
          >
            <Icon name="qr" className="h-3.5 w-3.5" /> Tra cứu nguồn gốc
          </Link>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-200 bg-white px-3 py-3 shadow-[var(--shadow-card)] md:hidden">
          <div className="grid gap-0.5 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-2 py-2.5 hover:bg-ink-100" onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
            <Link href="/tai-khoan/don-hang" className="rounded-lg px-2 py-2.5 hover:bg-ink-100" onClick={() => setOpen(false)}>
              Đơn hàng của tôi
            </Link>
            <Link href="/tim-kiem" className="rounded-lg px-2 py-2.5 hover:bg-ink-100" onClick={() => setOpen(false)}>
              Tra cứu nguồn gốc
            </Link>
            {user ? (
              <button type="button" onClick={logout} className="rounded-lg px-2 py-2.5 text-left text-rose-700 hover:bg-rose-50">
                Đăng xuất
              </button>
            ) : (
              <Link href="/dang-nhap" className="rounded-lg px-2 py-2.5 font-semibold text-brand-700 hover:bg-ink-100" onClick={() => setOpen(false)}>
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
