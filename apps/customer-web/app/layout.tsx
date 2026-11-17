import type { Metadata, Viewport } from 'next'
import { currentCustomer } from '@/lib/session'
import { CartProvider } from '@/components/cart-provider'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'AgriMarket — Nông sản truy xuất nguồn gốc',
    template: '%s — AgriMarket',
  },
  description:
    'Mua nông sản tươi theo lô, mỗi tem QR tra cứu được nông trại, nhật ký canh tác, kết quả kiểm nghiệm và chứng nhận.',
}

export const viewport: Viewport = {
  themeColor: '#166534',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentCustomer()
  return (
    <html lang="vi">
      <body className="flex min-h-dvh flex-col bg-ink-50 text-ink-900 antialiased">
        <CartProvider authed={Boolean(user)}>
          <SiteHeader user={user} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:py-6">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  )
}
