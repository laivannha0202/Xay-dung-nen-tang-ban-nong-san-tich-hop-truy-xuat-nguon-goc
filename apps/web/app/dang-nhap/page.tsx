import { LoginForm } from '@/components/forms'

export const metadata = { title: 'Đăng nhập — AgriMarket' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const sp = await searchParams
  const next = sp.next && sp.next.startsWith('/') ? sp.next : undefined
  return (
    <div className="mx-auto max-w-md space-y-4">
      <header className="text-center">
        <h1 className="text-2xl font-semibold">Đăng nhập</h1>
        <p className="mt-1 text-sm text-leaf-700">Dùng chung cho Website và Ứng dụng di động.</p>
      </header>
      <LoginForm next={next} />
      <p className="text-center text-sm text-leaf-700">
        Chưa có tài khoản? <a className="underline" href="/dang-ky">Đăng ký</a>
      </p>
      <div className="card p-4 text-xs text-leaf-700">
        <p className="font-medium text-leaf-800">Tài khoản demo</p>
        <p>Khách: khach1@example.com / Khach@123456</p>
        <p>Quản trị: admin@agrimarket.vn / Admin@123456</p>
      </div>
    </div>
  )
}
