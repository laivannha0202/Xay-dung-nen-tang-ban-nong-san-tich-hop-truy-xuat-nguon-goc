import { authCookie, currentUser } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { AddressBook } from '@/components/address-book'

interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
}

interface Address {
  id: string
  recipient_name: string
  phone: string
  province: string
  district: string
  ward: string
  street_detail: string
  is_default: boolean
}

export default async function AccountPage() {
  const user = await currentUser()
  const cookie = await authCookie()
  const [me, addresses] = await Promise.all([
    serverFetch<User>('/me', cookie),
    serverFetch<Address[]>('/me/addresses', cookie),
  ])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card p-5">
        <h1 className="font-semibold">Thông tin cá nhân</h1>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-leaf-600">Họ tên</dt><dd>{me?.name ?? '—'}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-leaf-600">Email</dt><dd>{me?.email}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-leaf-600">Điện thoại</dt><dd>{me?.phone ?? '—'}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-leaf-600">
          Tài khoản dùng chung cho Website và Ứng dụng di động: giỏ hàng, đơn hàng và hồ sơ luôn đồng bộ.
        </p>
        <a href="/doi-mat-khau" className="btn-secondary mt-3">Đổi mật khẩu</a>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Địa chỉ giao hàng</h2>
        <AddressBook initial={addresses ?? []} />
      </section>

      {user?.role === 'ADMIN' && (
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-semibold">Quyền quản trị</h2>
          <p className="mt-1 text-sm text-leaf-700">Tài khoản này có quyền vào khu vực quản trị.</p>
          <a href="/admin" className="btn-primary mt-3">Mở bảng điều khiển</a>
        </section>
      )}
    </div>
  )
}
