import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/session'
import { BrandLogo, Icon } from '@agrimarket/ui'
import { AdminLoginForm } from '@/components/admin-login-form'

export const metadata = { title: 'Đăng nhập quản trị' }

export default async function AdminLoginPage() {
  const user = await currentUser()
  if (user?.role === 'ADMIN') redirect('/admin')

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <BrandLogo size="lg" wordmark subtitle="Quản trị vận hành" />
      </div>
      <AdminLoginForm />
      <a
        href={process.env.NEXT_PUBLIC_CUSTOMER_WEB ?? 'http://localhost:3000'}
        className="btn-ghost btn-sm mt-4 self-center"
      >
        <Icon name="home" className="h-4 w-4" /> Về trang cửa hàng
      </a>
    </div>
  )
}
