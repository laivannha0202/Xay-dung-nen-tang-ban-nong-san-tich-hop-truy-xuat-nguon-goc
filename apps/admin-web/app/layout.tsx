import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'AgriMarket Admin', template: '%s — AgriMarket Admin' },
  description: 'Bảng điều khiển vận hành AgriMarket: đơn hàng, lô hàng, kiểm nghiệm, kho và khách hàng.',
}

export const viewport: Viewport = { themeColor: '#238B45' }

/** The gate and the shell live in `app/admin/layout.tsx`, so the login page stays reachable. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-dvh bg-ink-100 text-ink-900 antialiased">{children}</body>
    </html>
  )
}
