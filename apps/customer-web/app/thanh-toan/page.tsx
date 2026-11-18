import { redirect } from 'next/navigation'
import { currentCustomer } from '@/lib/session'
import { CheckoutFlow } from '@/components/checkout-flow'

export const metadata = { title: 'Thanh toán' }

export default async function CheckoutPage() {
  const user = await currentCustomer()
  if (!user) redirect('/dang-nhap?next=/thanh-toan')
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Bước 2 / 2</p>
        <h1 className="display mt-2 text-[32px] leading-[1.1] text-ink-900 sm:text-[40px]">Thanh toán</h1>
        <p className="mt-2 text-[13.5px] text-ink-600">
          Chỉ giao trong tỉnh Hưng Yên. Phí giao được chốt theo xã/phường bạn chọn.
        </p>
      </header>
      <CheckoutFlow />
    </div>
  )
}
