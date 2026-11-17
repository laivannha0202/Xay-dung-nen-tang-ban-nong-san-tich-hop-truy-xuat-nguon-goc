import Link from 'next/link'
import { Icon } from '@agrimarket/ui'

export const metadata = { title: 'Không có quyền' }

export default function NoAccessPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sand-50 text-sand-700">
        <Icon name="shield" className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-ink-900">Không có quyền truy cập</h1>
      <p className="mt-2 text-sm text-ink-600">
        Tài khoản hiện tại là khách mua hàng. Khu vực này chỉ dành cho quản trị viên.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <a href={process.env.NEXT_PUBLIC_CUSTOMER_WEB ?? 'http://localhost:3000'} className="btn-primary">
          Về cửa hàng
        </a>
        <Link href="/dang-nhap" className="btn-secondary">Đăng nhập tài khoản khác</Link>
      </div>
    </div>
  )
}
