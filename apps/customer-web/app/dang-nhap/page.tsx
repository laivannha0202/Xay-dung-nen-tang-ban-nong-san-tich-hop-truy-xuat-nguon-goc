import Link from 'next/link'
import { LoginForm } from '@/components/forms'
import { BrandLogo } from '@agrimarket/ui'

export const metadata = { title: 'Đăng nhập' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const sp = await searchParams
  const next = sp.next && sp.next.startsWith('/') ? sp.next : undefined
  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <header className="text-center">
        <span className="flex justify-center"><BrandLogo size="lg" /></span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">Đăng nhập</h1>
        <p className="mt-1 text-sm text-ink-600">Dùng chung cho website và ứng dụng di động.</p>
      </header>
      <LoginForm next={next} />
      <p className="text-center text-sm text-ink-600">
        Chưa có tài khoản?{' '}
        <Link className="font-medium text-brand-700 underline" href="/dang-ky">Đăng ký</Link>
      </p>
      <div className="card-pad text-xs text-ink-600">
        <p className="font-medium text-ink-800">Tài khoản demo</p>
        <p>Khách: khach1@example.com / Khach@123456</p>
        <p>Quản trị: dùng trang quản trị riêng.</p>
      </div>
    </div>
  )
}
