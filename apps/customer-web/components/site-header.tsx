'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@agrimarket/ui'
import { useCart } from '@/components/cart-provider'
import { DeliveryPicker } from '@/components/delivery-picker'
import type { SessionUser } from '@/lib/session'

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1'

const NAV: Array<{ href: string; label: string }> = [
  { href: '/san-pham', label: 'Tất cả danh mục' },
  { href: '/danh-muc/trai-cay', label: 'Trái cây' },
  { href: '/danh-muc/rau-cu', label: 'Rau củ' },
  { href: '/danh-muc/gao-ngu-coc', label: 'Gạo & ngũ cốc' },
  { href: '/danh-muc/dac-san', label: 'Đặc sản' },
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
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
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
          <div className="mx-auto flex max-w-[1280px] items-center gap-2 overflow-hidden px-4 py-1.5 text-[12.5px] sm:px-6 lg:px-10">
            <p className="min-w-0 flex-1 truncate">
              Nông sản Hưng Yên, bán theo lô có tem truy xuất ·{' '}
              <Link href="/chinh-sach/giao-hang" className="font-semibold text-white underline underline-offset-2">
                Miễn phí giao đơn từ 500.000₫
              </Link>
            </p>
            <span className="hidden items-center gap-5 text-brand-100 sm:flex">
              <span className="flex items-center gap-1"><Icon name="shield" className="h-3.5 w-3.5" /> Kiểm nghiệm trước khi bán</span>
              <span className="flex items-center gap-1"><Icon name="qr" className="h-3.5 w-3.5" /> Tem QR từng lô</span>
            </span>
            <button
              type="button"
              onClick={() => setBarOpen(false)}
              className="ml-1 grid h-11 w-11 shrink-0 place-items-center rounded hover:bg-white/15"
              aria-label="Ẩn thông báo"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-2 sm:px-6 lg:px-10">
          <Link href="/" className="flex h-11 shrink-0 items-center gap-2.5" aria-label="AgriMarket — trang chủ">
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-linear-to-br from-brand-500 to-brand-600 text-white">
              <Icon name="leaf" className="h-5 w-5" />
            </span>
            <span className="hidden text-[20px] font-bold tracking-tight text-brand-700 sm:block">AgriMarket</span>
          </Link>

          <form onSubmit={submitSearch} className="relative order-3 flex w-full flex-1 items-center md:order-none md:w-auto" role="search">
            <Icon name="search" className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-11 w-full rounded-xl border border-ink-200 bg-ink-100/50 pr-18 pl-10 text-[14.5px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              placeholder="Tìm nhãn lồng, cam sành, gạo ST25…"
              aria-label="Tìm kiếm sản phẩm"
            />
            <button type="submit" className="absolute inset-y-0 right-0 grid w-16 place-items-center rounded-r-xl bg-brand-600 text-[13px] font-semibold text-white hover:bg-brand-700">
              Tìm
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1.5">
            <DeliveryPicker />
            <Link href="/tim-kiem" className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold text-brand-600 hover:bg-brand-50 lg:inline-flex">
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
            <Link
              href="/gio-hang"
              className="relative inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 text-[13.5px] font-semibold text-ink-800 transition-colors hover:border-brand-300 hover:text-brand-700"
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
        <div className="hidden border-t border-ink-100 md:block">
          <div className="mx-auto flex max-w-[1280px] items-center gap-1 px-4 sm:px-6 lg:px-10">
            {NAV.map((n) => {
              const on = pathname === n.href
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? 'page' : undefined}
                  className={`inline-flex items-center rounded-lg px-3 py-2.5 text-[13.5px] transition-colors ${
                    on ? 'bg-brand-50 font-semibold text-brand-700' : 'font-medium text-ink-700 hover:bg-ink-50 hover:text-brand-700'
                  }`}
                >
                  {n.label}
                </Link>
              )
            })}
            <Link href="/san-pham?sort=newest" className="inline-flex items-center rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-sand-700 hover:bg-sand-50">
              Lô cận hạn
            </Link>
            <span className="ml-auto flex items-center gap-1.5 text-[12.5px] text-ink-500">
              <Icon name="shield" className="h-3.5 w-3.5 text-brand-600" /> Lô đạt kiểm nghiệm mới được bán
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
