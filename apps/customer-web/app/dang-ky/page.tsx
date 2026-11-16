import { RegisterForm } from '@/components/forms'

export const metadata = { title: 'Đăng ký — AgriMarket' }

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <header className="text-center">
        <h1 className="text-2xl font-semibold">Tạo tài khoản</h1>
        <p className="mt-1 text-sm text-leaf-700">Tài khoản dùng chung cho Website và Ứng dụng.</p>
      </header>
      <RegisterForm />
      <p className="text-center text-sm text-leaf-700">
        Đã có tài khoản? <a className="underline" href="/dang-nhap">Đăng nhập</a>
      </p>
    </div>
  )
}
