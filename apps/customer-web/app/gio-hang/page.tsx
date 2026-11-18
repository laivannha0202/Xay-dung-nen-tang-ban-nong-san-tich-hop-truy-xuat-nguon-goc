import { CartView } from '@/components/cart-view'

export const metadata = { title: 'Giỏ hàng' }

export default function CartPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900 sm:text-[32px]">Giỏ hàng</h1>
      <CartView />
    </div>
  )
}
