import { redirect } from 'next/navigation'
import { currentCustomer } from '@/lib/session'
import { CheckoutFlow } from '@/components/checkout-flow'

export const metadata = { title: 'Thanh toán' }

export default async function CheckoutPage() {
  const user = await currentCustomer()
  if (!user) redirect('/dang-nhap?next=/thanh-toan')
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Thanh toán</h1>
      <CheckoutFlow />
    </div>
  )
}
