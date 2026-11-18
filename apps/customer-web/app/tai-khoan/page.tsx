import { authCookie, currentCustomer } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { ADMIN_WEB } from '@/lib/config'
import { ProfileForm } from '@/components/profile-form'
import { AddressBook } from '@/components/address-book'
import { ChangePassword } from '@/components/change-password'
import type { Address } from '@agrimarket/core'

export default async function AccountPage() {
  const [user, cookie] = await Promise.all([currentCustomer(), authCookie()])
  const addresses = await serverFetch<Address[]>('/me/addresses', cookie)
  if (!user) return null

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-[var(--radius-panel)] bg-white p-5 sm:p-6">
        <h2 className="text-[16px] font-bold text-ink-900">Thông tin cá nhân</h2>
        <p className="page-sub mt-0.5">Dùng để liên hệ khi giao hàng và xử lý khiếu nại.</p>
        <div className="mt-4">
          <ProfileForm name={user.name} phone={user.phone} />
        </div>
      </section>

      <section className="rounded-[var(--radius-panel)] bg-white p-5 sm:p-6">
        <h2 className="text-[16px] font-bold text-ink-900">Đổi mật khẩu</h2>
        <p className="page-sub mt-0.5">Mật khẩu mới cần tối thiểu 8 ký tự.</p>
        <div className="mt-4">
          <ChangePassword />
        </div>
      </section>

      <section className="card-pad lg:col-span-2">
        <h2 className="text-[16px] font-bold text-ink-900">Địa chỉ giao hàng</h2>
        <p className="page-sub mt-0.5">Địa chỉ mặc định được chọn sẵn ở bước thanh toán.</p>
        <div className="mt-4">
          <AddressBook initial={addresses ?? []} />
        </div>
      </section>

      {user.role === 'ADMIN' && (
        <section className="card-pad lg:col-span-2">
          <h2 className="text-[16px] font-bold text-ink-900">Quyền quản trị</h2>
          <p className="mt-1 text-sm text-ink-600">
            Tài khoản này vận hành AgriMarket trên trang quản trị riêng.
          </p>
          <a href={`${ADMIN_WEB}/admin`} className="btn-primary mt-3">Mở bảng điều khiển</a>
        </section>
      )}
    </div>
  )
}
