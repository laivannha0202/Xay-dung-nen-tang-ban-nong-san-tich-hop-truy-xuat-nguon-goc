import { redirect } from 'next/navigation'
import { currentCustomer } from '@/lib/session'
import { ADMIN_WEB } from '@/lib/config'
import { AccountNav } from '@/components/account-nav'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await currentCustomer()
  if (!user) redirect('/dang-nhap?next=/tai-khoan')

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3 border-b border-ink-200 pb-4">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-[17px] font-bold text-brand-700">
          {(user.name ?? user.email).trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-[20px] leading-tight font-bold text-ink-900">{user.name ?? user.email}</h1>
          <p className="truncate text-[12.5px] text-ink-500">{user.email}</p>
        </div>
        {user.role === 'ADMIN' && (
          <a href={`${ADMIN_WEB}/admin`} className="btn-secondary btn-sm ml-auto">Trang quản trị</a>
        )}
      </header>

      <AccountNav />
      {children}
    </div>
  )
}
