import { CartView } from '@/components/cart-view'

export const metadata = { title: 'Giỏ hàng' }

export default function CartPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Bước 1 / 2</p>
        <h1 className="display mt-2 text-[32px] leading-[1.1] text-ink-900 sm:text-[40px]">Giỏ hàng</h1>
        <p className="mt-2 text-[13.5px] text-ink-600">
          Giá và tồn được chốt lại từ đúng lô ở bước thanh toán.
        </p>
      </header>
      <CartView />
    </div>
  )
}
