import { redirect } from 'next/navigation'
import { currentCustomer } from '@/lib/session'
import { AccountNav } from '@/components/account-nav'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await currentCustomer()
  if (!user) redirect('/dang-nhap?next=/tai-khoan')

  return (
    <div className="space-y-4">
      <AccountNav />
      {children}
    </div>
  )
}
