import Link from 'next/link'
import { currentUser } from '@/lib/session'
import { CartProvider } from '@/components/cart-provider'
import { Header } from '@/components/header'
import './globals.css'

export const metadata = {
  title: 'AgriMarket — Nông sản truy xuất nguồn gốc',
  description:
    'Nông sản tươi sạch, mỗi lô hàng có mã QR tra cứu nguồn gốc: nông trại, nhật ký canh tác, kiểm nghiệm và chứng nhận.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  return (
    <html lang="vi">
      <body className="min-h-dvh">
        <CartProvider authed={user?.role === 'CUSTOMER'}>
          <Header user={user} />
          <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
          <footer className="mt-12 border-t border-leaf-100 bg-leaf-50/50">
            <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-leaf-800 sm:grid-cols-3">
              <div>
                <p className="font-semibold">AgriMarket</p>
                <p className="mt-1 text-leaf-700">Nông sản theo lô, minh bạch từ nông trại tới bàn ăn.</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Mua sắm</p>
                <Link className="block hover:underline" href="/san-pham">Tất cả sản phẩm</Link>
                <Link className="block hover:underline" href="/tim-kiem">Tra cứu mã tem QR</Link>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Hỗ trợ</p>
                <Link className="block hover:underline" href="/tai-khoan/don-hang">Đơn hàng của tôi</Link>
                <Link className="block hover:underline" href="/tai-khoan/khieu-nai">Khiếu nại</Link>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  )
}
