import Link from 'next/link'
import { authCookie, currentCustomer } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { AddressBook } from '@/components/address-book'
import { PageHeader } from '@agrimarket/ui'
import type { Address } from '@agrimarket/core'

export const metadata = { title: 'Địa chỉ giao hàng' }

export default async function AddressesPage() {
  const [user, cookie] = await Promise.all([currentCustomer(), authCookie()])
  if (!user) return null
  const addresses = await serverFetch<Address[]>('/me/addresses', cookie)
  return (
    <div className="space-y-4">
      <PageHeader
        title="Địa chỉ giao hàng"
        description="AgriMarket giao trong tỉnh Hưng Yên. Địa chỉ mặc định được chọn sẵn ở bước thanh toán."
        breadcrumb={<Link href="/tai-khoan" className="hover:underline">Tài khoản</Link>}
      />
      <AddressBook initial={addresses ?? []} profile={{ name: user.name, phone: user.phone }} />
    </div>
  )
}
