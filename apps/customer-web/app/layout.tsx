import type { Metadata, Viewport } from 'next'
import { currentCustomer } from '@/lib/session'
import { CartProvider } from '@/components/cart-provider'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'AgriMarket — Nông sản tươi giao tận cửa',
    template: '%s — AgriMarket',
  },
  description:
    'Mua trái cây, rau củ, gạo và đặc sản Hưng Yên. Giao hàng nội tỉnh, mỗi gói có tem tra nguồn gốc khi cần.',
}

export const viewport: Viewport = {
  themeColor: '#238B45',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentCustomer()
  return (
    <html lang="vi">
      <body className="flex min-h-dvh flex-col bg-white text-ink-900 antialiased">
        <CartProvider authed={Boolean(user)}>
          <SiteHeader user={user} />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-4 sm:px-5 sm:py-5">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  )
}
