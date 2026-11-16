import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/session'

const NAV: Array<{ group: string; items: Array<{ href: string; label: string }> }> = [
  {
    group: 'Tổng quan',
    items: [
      { href: '/admin', label: 'Bảng điều khiển' },
      { href: '/admin/bao-cao', label: 'Báo cáo' },
    ],
  },
  {
    group: 'Danh mục',
    items: [
      { href: '/admin/san-pham', label: 'Sản phẩm' },
      { href: '/admin/danh-muc', label: 'Danh mục hàng' },
      { href: '/admin/khuyen-mai', label: 'Khuyến mãi' },
    ],
  },
  {
    group: 'Nguồn gốc',
    items: [
      { href: '/admin/nha-cung-cap', label: 'Nhà cung cấp & nông trại' },
      { href: '/admin/mua-vu', label: 'Mùa vụ & nhật ký' },
      { href: '/admin/lo-hang', label: 'Lô hàng & kiểm nghiệm' },
      { href: '/admin/ma-qr', label: 'Mã QR' },
      { href: '/admin/thu-hoi', label: 'Thu hồi' },
    ],
  },
  {
    group: 'Vận hành',
    items: [
      { href: '/admin/kho', label: 'Kho & tồn' },
      { href: '/admin/don-hang', label: 'Đơn hàng' },
      { href: '/admin/thanh-toan', label: 'Thanh toán & hoàn tiền' },
    ],
  },
  {
    group: 'Khách hàng',
    items: [
      { href: '/admin/khach-hang', label: 'Khách hàng' },
      { href: '/admin/danh-gia', label: 'Đánh giá' },
      { href: '/admin/khieu-nai', label: 'Khiếu nại' },
    ],
  },
  {
    group: 'Hệ thống',
    items: [{ href: '/admin/cai-dat', label: 'Cài đặt' }],
  },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/dang-nhap?next=/admin')
  if (user.role !== 'ADMIN') redirect('/')

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit lg:sticky lg:top-20">
        <div className="card p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-leaf-600">Quản trị</p>
          <nav className="space-y-3">
            {NAV.map((section) => (
              <div key={section.group}>
                <p className="px-2 text-[11px] font-medium uppercase tracking-wide text-leaf-500">{section.group}</p>
                <ul className="mt-0.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="block rounded-md px-2 py-1.5 text-sm text-leaf-800 hover:bg-leaf-50">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
