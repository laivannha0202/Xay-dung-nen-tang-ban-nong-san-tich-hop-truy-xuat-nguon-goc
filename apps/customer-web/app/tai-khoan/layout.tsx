import { redirect } from 'next/navigation'
import { currentCustomer } from '@/lib/session'
import { ADMIN_WEB } from '@/lib/config'
import { Icon } from '@agrimarket/ui'
import { AccountNav } from '@/components/account-nav'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await currentCustomer()
  if (!user) redirect('/dang-nhap?next=/tai-khoan')

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4 rounded-[var(--radius-panel)] bg-mint-50 px-5 py-5 sm:px-7">
        <span className="display grid h-14 w-14 place-items-center rounded-full bg-white text-[20px] text-brand-700 ring-1 ring-brand-600/15">
          {(user.name ?? user.email).trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="eyebrow">Tài khoản</p>
          <h1 className="display mt-1 truncate text-[24px] leading-tight text-ink-900 sm:text-[28px]">
            {user.name ?? user.email}
          </h1>
          <p className="truncate text-xs text-ink-600">{user.email}</p>
        </div>
        {user.role === 'ADMIN' && (
          <a href={`${ADMIN_WEB}/admin`} className="btn-secondary btn-sm ml-auto">
            <Icon name="dashboard" className="h-4 w-4" /> Trang quản trị
          </a>
        )}
      </header>

      <AccountNav />
      {children}
    </div>
  )
}
