'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@agrimarket/ui'
import { useCart } from '@/components/cart-provider'
import type { SessionUser } from '@/lib/session'

const NAV: Array<{ href: string; label: string; category?: boolean }> = [
  { href: '/san-pham', label: 'Tất cả danh mục' },
  { href: '/danh-muc/trai-cay', label: 'Trái cây', category: true },
  { href: '/danh-muc/rau-cu', label: 'Rau củ', category: true },
  { href: '/danh-muc/gao-ngu-coc', label: 'Gạo & ngũ cốc', category: true },
  { href: '/danh-muc/dac-san', label: 'Đặc sản', category: true },
]

/** Site header: search is the primary action, so it owns the middle of the bar. */
export function SiteHeader({ user }: { user: SessionUser | null }) {
  const { count } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [barOpen, setBarOpen] = useState(true)
  const [q, setQ] = useState('')

  async function logout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1'}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-agri-csrf': '1' },
    })
    window.location.href = '/'
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(q.trim() ? `/tim-kiem?q=${encodeURIComponent(q.trim())}` : '/san-pham')
  }

  return (
    <header className="sticky top-0 z-40">
      {barOpen && (
        <div className="bg-brand-800 text-brand-50">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 text-xs">
            <Icon name="truck" className="h-3.5 w-3.5 shrink-0" />
            <p className="min-w-0 flex-1 truncate">
              Giao nội tỉnh Hưng Yên — miễn phí cho đơn từ 500.000₫.{' '}
              <Link href="/chinh-sach/giao-hang" className="underline underline-offset-2 hover:text-white">
                Xem vùng giao
              </Link>
            </p>
            <button
              type="button"
              onClick={() => setBarOpen(false)}
              className="shrink-0 rounded p-0.5 hover:bg-white/15"
              aria-label="Ẩn thông báo"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-ink-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="AgriMarket — trang chủ">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Icon name="leaf" className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-semibold tracking-tight text-brand-800 sm:block">AgriMarket</span>
          </Link>

          <form onSubmit={submitSearch} className="relative hidden flex-1 items-center md:flex" role="search">
            <Icon name="search" className="pointer-events-none absolute left-3 h-4 w-4 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="field pl-9 pr-24"
              placeholder="Tìm nông sản, mã lô, nông trại…"
              aria-label="Tìm kiếm sản phẩm"
            />
            <button type="submit" className="btn-primary btn-sm absolute top-1.5 right-1.5">
              <Icon name="search" className="h-4 w-4" /> Tìm
            </button>
          </form>

          <nav className="ml-auto flex items-center gap-1" aria-label="Tài khoản">
            <Link href="/tim-kiem" className="btn-ghost hidden lg:inline-flex">
              <Icon name="qr" className="h-4 w-4" /> Tra cứu tem
            </Link>
            {user ? (
              <Link href="/tai-khoan" className="btn-ghost hidden sm:inline-flex">
                <Icon name="user" className="h-4 w-4" />
                <span className="max-w-32 truncate">{user.name ?? user.email}</span>
              </Link>
            ) : (
              <Link href="/dang-nhap" className="btn-ghost hidden sm:inline-flex">
                <Icon name="user" className="h-4 w-4" /> Đăng nhập
              </Link>
            )}
            <Link href="/tai-khoan/don-hang" className="btn-ghost hidden xl:inline-flex">
              <Icon name="orders" className="h-4 w-4" /> Đơn hàng
            </Link>
            <Link href="/gio-hang" className="btn-secondary relative" aria-label={`Giỏ hàng, ${count} sản phẩm`}>
              <Icon name="cart" className="h-4 w-4" />
              <span className="hidden sm:inline">Giỏ</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="btn-ghost md:hidden"
              aria-label="Mở menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
          </nav>
        </div>

        {/* category rail: always visible on desktop, folded into the drawer on mobile */}
        <div className="hidden border-t border-ink-100 md:block">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-1.5 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`btn-ghost btn-sm ${pathname === n.href ? 'text-brand-700' : ''}`}
              >
                <Icon name={n.category ? 'categories' : 'products'} className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
            <span className="ml-auto flex items-center gap-1 text-xs text-ink-500">
              <Icon name="shield" className="h-3.5 w-3.5 text-brand-600" /> Tem QR trên mọi lô hàng
            </span>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-b border-ink-100 bg-white px-4 py-3 shadow-[var(--shadow-card)] md:hidden">
          <form onSubmit={submitSearch} className="relative mb-3" role="search">
            <Icon name="search" className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="field pl-9"
              placeholder="Tìm nông sản…"
              aria-label="Tìm kiếm sản phẩm"
            />
          </form>
          <div className="grid gap-1 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-2 py-2 hover:bg-brand-50" onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
            <Link href="/tim-kiem" className="rounded-lg px-2 py-2 hover:bg-brand-50" onClick={() => setOpen(false)}>
              Tra cứu tem QR
            </Link>
            <Link href="/tai-khoan/don-hang" className="rounded-lg px-2 py-2 hover:bg-brand-50" onClick={() => setOpen(false)}>
              Đơn hàng của tôi
            </Link>
            <Link href="/tai-khoan" className="rounded-lg px-2 py-2 hover:bg-brand-50" onClick={() => setOpen(false)}>
              Tài khoản
            </Link>
            {user ? (
              <button type="button" onClick={logout} className="rounded-lg px-2 py-2 text-left text-rose-700 hover:bg-rose-50">
                Đăng xuất
              </button>
            ) : (
              <Link href="/dang-nhap" className="rounded-lg px-2 py-2 font-medium text-brand-700 hover:bg-brand-50" onClick={() => setOpen(false)}>
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
