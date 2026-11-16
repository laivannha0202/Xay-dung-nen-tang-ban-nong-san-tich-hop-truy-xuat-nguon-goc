'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@agrimarket/ui'
import { useCart } from '@/components/cart-provider'
import type { SessionUser } from '@/lib/session'

const NAV = [
  { href: '/san-pham', label: 'Sản phẩm' },
  { href: '/danh-muc/trai-cay', label: 'Trái cây' },
  { href: '/danh-muc/rau-cu', label: 'Rau củ' },
  { href: '/danh-muc/gao-ngu-coc', label: 'Gạo & ngũ cốc' },
]

/** Site header: search is the primary action, so it owns the middle of the bar. */
export function SiteHeader({ user }: { user: SessionUser | null }) {
  const { count } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
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
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
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
            className="field pl-9"
            placeholder="Tìm nông sản, mã lô, nông trại…"
            aria-label="Tìm kiếm sản phẩm"
          />
          <button type="submit" className="btn-primary absolute right-1.5 top-1.5 btn-sm">Tìm</button>
        </form>

        <nav className="ml-auto flex items-center gap-1">
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
          <Link href="/san-pham" className="btn-ghost btn-sm">
            <Icon name="categories" className="h-4 w-4" /> Tất cả danh mục
          </Link>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`btn-ghost btn-sm ${pathname === n.href ? 'text-brand-700' : ''}`}>
              {n.label}
            </Link>
          ))}
          <span className="ml-auto text-xs text-ink-500">Miễn phí giao hàng cho đơn từ 500.000₫</span>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white px-4 py-3 md:hidden">
          <form onSubmit={submitSearch} className="relative mb-3" role="search">
            <Icon name="search" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="field pl-9" placeholder="Tìm nông sản…" />
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
            <Link href="/tai-khoan" className="rounded-lg px-2 py-2 hover:bg-brand-50" onClick={() => setOpen(false)}>
              Tài khoản
            </Link>
            {user && (
              <button type="button" onClick={logout} className="rounded-lg px-2 py-2 text-left text-rose-700 hover:bg-rose-50">
                Đăng xuất
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
