import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/session'
import { Icon } from '@agrimarket/ui'
import { AdminLoginForm } from '@/components/admin-login-form'

export const metadata = { title: 'Đăng nhập quản trị' }

export default async function AdminLoginPage() {
  const user = await currentUser()
  if (user?.role === 'ADMIN') redirect('/admin')

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
          <Icon name="leaf" className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-ink-900">AgriMarket Admin</p>
          <p className="text-xs text-ink-500">Vận hành bán hàng & truy xuất nguồn gốc</p>
        </div>
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
