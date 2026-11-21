import Link from 'next/link'
import { currentCustomer } from '@/lib/session'
import { ProfileForm } from '@/components/profile-form'
import { PageHeader } from '@agrimarket/ui'

export const metadata = { title: 'Hồ sơ cá nhân' }

export default async function ProfilePage() {
  const user = await currentCustomer()
  if (!user) return null
  return (
    <div className="space-y-4">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Tên và số điện thoại dùng để liên hệ khi giao hàng và xử lý khiếu nại."
        breadcrumb={<Link href="/tai-khoan" className="hover:underline">Tài khoản</Link>}
      />
      <div className="max-w-xl">
        <ProfileForm name={user.name} phone={user.phone} email={user.email} />
      </div>
    </div>
  )
}
