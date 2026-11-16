'use client'

import Link from 'next/link'
import { useCart } from './cart-provider'
import type { SessionUser } from '@/lib/session'

export function Header({ user }: { user: SessionUser | null }) {
  const { count } = useCart()

  async function logout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1'}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-agri-csrf': '1' },
    })
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-30 border-b border-leaf-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-leaf-700">
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-600 text-white">🌿</span>
          AgriMarket
        </Link>
        <nav className="ml-4 hidden items-center gap-1 text-sm sm:flex">
          <Link className="btn-ghost" href="/san-pham">Sản phẩm</Link>
          <Link className="btn-ghost" href="/tim-kiem">Tra cứu tem</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user?.role !== 'ADMIN' && (
            <Link href="/gio-hang" className="btn-secondary relative">
              Giỏ hàng
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-leaf-600 px-1 text-xs text-white">
                  {count}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/tai-khoan" className="btn-ghost hidden sm:inline-flex">
                {user.name ?? user.email}
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="btn-secondary">Quản trị</Link>
              )}
              <button type="button" onClick={logout} className="btn-ghost">Đăng xuất</button>
            </div>
          ) : (
            <>
              <Link href="/dang-nhap" className="btn-secondary">Đăng nhập</Link>
              <Link href="/dang-ky" className="btn-primary hidden sm:inline-flex">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
