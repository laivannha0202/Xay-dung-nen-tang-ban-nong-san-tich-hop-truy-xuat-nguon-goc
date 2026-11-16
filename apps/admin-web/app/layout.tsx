import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'AgriMarket Admin', template: '%s — AgriMarket Admin' },
  description: 'Bảng điều khiển vận hành AgriMarket: đơn hàng, lô hàng, kiểm nghiệm, kho và khách hàng.',
}

/** The gate and the shell live in `app/admin/layout.tsx`, so the login page stays reachable. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-dvh bg-ink-50/50">{children}</body>
    </html>
  )
}
