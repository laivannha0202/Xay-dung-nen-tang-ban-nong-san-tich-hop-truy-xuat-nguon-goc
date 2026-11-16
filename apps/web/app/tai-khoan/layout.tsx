import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/session'

const LINKS = [
  { href: '/tai-khoan', label: 'Tài khoản' },
  { href: '/tai-khoan/don-hang', label: 'Đơn hàng' },
  { href: '/tai-khoan/danh-gia', label: 'Đánh giá' },
  { href: '/tai-khoan/khieu-nai', label: 'Khiếu nại' },
]

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/dang-nhap?next=/tai-khoan')
  return (
    <div className="space-y-4">
      <nav className="flex gap-1 overflow-x-auto border-b border-leaf-100 pb-2 text-sm">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="btn-ghost whitespace-nowrap">{l.label}</Link>
        ))}
        {user.role === 'ADMIN' && <Link href="/admin" className="btn-ghost ml-auto">Quản trị</Link>}
      </nav>
      {children}
    </div>
  )
}
