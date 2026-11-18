import { CartView } from '@/components/cart-view'

export const metadata = { title: 'Giỏ hàng' }

export default function CartPage() {
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-baseline gap-x-3 border-b border-ink-200 pb-3">
        <h1 className="text-[26px] leading-tight font-bold tracking-tight text-ink-900">Giỏ hàng</h1>
        <p className="text-[13px] text-ink-500">Giá và tồn kho được chốt lại ở bước thanh toán.</p>
      </header>
      <CartView />
    </div>
  )
}
