import { redirect } from 'next/navigation'
import { currentCustomer } from '@/lib/session'
import { CheckoutFlow } from '@/components/checkout-flow'

export const metadata = { title: 'Thanh toán' }

export default async function CheckoutPage() {
  const user = await currentCustomer()
  if (!user) redirect('/dang-nhap?next=/thanh-toan')
  return (
    <div className="space-y-5">
      <header className="border-b border-ink-200 pb-3">
        <h1 className="text-[26px] leading-tight font-bold tracking-tight text-ink-900">Thanh toán</h1>
        <p className="mt-0.5 text-[13px] text-ink-500">
          Chỉ giao trong tỉnh Hưng Yên. Phí giao được chốt theo xã/phường bạn chọn.
        </p>
      </header>
      <CheckoutFlow />
    </div>
  )
}
