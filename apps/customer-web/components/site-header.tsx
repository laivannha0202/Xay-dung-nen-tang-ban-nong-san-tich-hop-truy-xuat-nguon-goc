'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@agrimarket/ui'
import { useCart } from '@/components/cart-provider'
import { DeliveryPicker } from '@/components/delivery-picker'
import type { SessionUser } from '@/lib/session'

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1'

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
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-agri-csrf': '1' },
    })
    window.location.href = '/'
  }

  /** Product keywords belong on the catalog; QR tokens keep their own page. */
  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    router.push(term ? `/san-pham?q=${encodeURIComponent(term)}` : '/san-pham')
  }

  return (
    <header className="sticky top-0 z-40 shadow-[0_1px_0_var(--color-ink-200)]">
      {barOpen && (
        <div className="bg-brand-800 text-brand-50">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 text-xs">
            <Icon name="truck" className="h-3.5 w-3.5 shrink-0" />
            <p className="min-w-0 flex-1 truncate">
              Giao nội tỉnh Hưng Yên trong ngày — miễn phí cho đơn từ 500.000₫.{' '}
              <Link href="/chinh-sach/giao-hang" className="underline underline-offset-2 hover:text-white">
                Xem vùng giao
              </Link>
            </p>
            <span className="hidden items-center gap-4 sm:flex">
              <span className="flex items-center gap-1"><Icon name="shield" className="h-3.5 w-3.5" /> Kiểm nghiệm trước khi bán</span>
              <span className="flex items-center gap-1"><Icon name="qr" className="h-3.5 w-3.5" /> Tem QR từng lô</span>
            </span>
            <button
              type="button"
              onClick={() => setBarOpen(false)}
              className="ml-1 shrink-0 rounded p-0.5 hover:bg-white/15"
              aria-label="Ẩn thông báo"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-ink-200/70 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="AgriMarket — trang chủ">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-linear-to-br from-brand-500 to-brand-700 text-white">
              <Icon name="leaf" className="h-5 w-5" />
            </span>
            <span className="hidden text-[19px] font-bold tracking-tight text-brand-800 sm:block">AgriMarket</span>
          </Link>

          <form onSubmit={submitSearch} className="relative hidden flex-1 items-center md:flex" role="search">
            <Icon name="search" className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-11 w-full rounded-xl border border-ink-200 bg-ink-50 pr-24 pl-10 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              placeholder="Tìm nông sản, mã lô, nông trại…"
              aria-label="Tìm kiếm sản phẩm"
            />
            <button type="submit" className="absolute right-1.5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-[13px] font-semibold text-white hover:bg-brand-700">
              <Icon name="search" className="h-3.5 w-3.5" /> Tìm
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1">
            <DeliveryPicker />
            <Link href="/tim-kiem" className="btn-ghost hidden lg:inline-flex">
              <Icon name="qr" className="h-4 w-4" /> Tra cứu tem
            </Link>
            {user ? (
              <Link href="/tai-khoan" className="btn-ghost hidden sm:inline-flex">
                <Icon name="user" className="h-4 w-4" />
                <span className="max-w-28 truncate">{user.name ?? user.email}</span>
              </Link>
            ) : (
              <Link href="/dang-nhap" className="btn-ghost hidden sm:inline-flex">
                <Icon name="user" className="h-4 w-4" /> Đăng nhập
              </Link>
            )}
            <Link href="/tai-khoan/don-hang" className="btn-ghost hidden xl:inline-flex">
              <Icon name="orders" className="h-4 w-4" /> Đơn hàng
            </Link>
            <Link
              href="/gio-hang"
              className="relative inline-flex h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800 transition-colors hover:border-brand-300 hover:text-brand-700"
              aria-label={`Giỏ hàng, ${count} sản phẩm`}
            >
              <Icon name="cart" className="h-4 w-4" />
              <span className="hidden sm:inline">Giỏ</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-sand-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
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
          </div>
        </div>

        {/* category rail: always visible on desktop, folded into the drawer on mobile */}
        <div className="hidden border-t border-ink-100 bg-white md:block">
          <div className="mx-auto flex max-w-7xl items-center gap-0.5 px-4 py-1 text-[13.5px]">
            {NAV.map((n) => {
              const on = pathname === n.href
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${
                    on ? 'bg-brand-50 font-semibold text-brand-700' : 'font-medium text-ink-700 hover:bg-ink-50 hover:text-brand-700'
                  }`}
                >
                  <Icon name={n.category ? 'categories' : 'products'} className="h-3.5 w-3.5" />
                  {n.label}
                </Link>
              )
            })}
            <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-500">
              <Icon name="shield" className="h-3.5 w-3.5 text-brand-500" /> Tem QR trên mọi lô hàng
            </span>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-b border-ink-200 bg-white px-4 py-3 shadow-[var(--shadow-card)] md:hidden">
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
