import { CartView } from '@/components/cart-view'

export const metadata = { title: 'Giỏ hàng' }

export default function CartPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Giỏ hàng</h1>
      <CartView />
    </div>
  )
}
