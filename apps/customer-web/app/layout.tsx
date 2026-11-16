import type { Metadata } from 'next'
import { currentUser } from '@/lib/session'
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  return (
    <html lang="vi">
      <body className="flex min-h-dvh flex-col bg-[#fbfcfb]">
        <CartProvider authed={user?.role === 'CUSTOMER'}>
          <SiteHeader user={user} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  )
}
