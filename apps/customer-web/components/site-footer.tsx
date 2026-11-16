import Link from 'next/link'
import { Icon } from '@agrimarket/ui'

const COLUMNS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: 'Mua sắm',
    links: [
      { href: '/san-pham', label: 'Tất cả sản phẩm' },
      { href: '/danh-muc/trai-cay', label: 'Trái cây' },
      { href: '/danh-muc/rau-cu', label: 'Rau củ' },
      { href: '/danh-muc/gao-ngu-coc', label: 'Gạo & ngũ cốc' },
    ],
  },
  {
    title: 'Tài khoản',
    links: [
      { href: '/tai-khoan', label: 'Hồ sơ của tôi' },
      { href: '/tai-khoan/don-hang', label: 'Đơn hàng' },
      { href: '/tai-khoan/danh-gia', label: 'Đánh giá' },
      { href: '/tai-khoan/khieu-nai', label: 'Khiếu nại' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { href: '/tim-kiem', label: 'Tra cứu tem QR' },
      { href: '/chinh-sach/giao-hang', label: 'Chính sách giao hàng' },
      { href: '/chinh-sach/doi-tra', label: 'Đổi trả & hoàn tiền' },
      { href: '/chinh-sach/bao-mat', label: 'Bảo mật thông tin' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Icon name="leaf" className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-brand-800">AgriMarket</span>
          </div>
          <p className="mt-3 text-sm text-ink-500">
            Nông sản bán theo lô, mỗi lô một mã QR truy xuất tới nông trại, nhật ký canh tác và kết quả kiểm nghiệm.
          </p>
          <p className="mt-3 text-sm text-ink-500">
            <Icon name="phone" className="mr-1 inline h-4 w-4" /> 1900 0000
            <br />
            <Icon name="pin" className="mr-1 inline h-4 w-4" /> 12 Lý Tự Trọng, TP. Hồ Chí Minh
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-ink-800">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ink-500 transition-colors hover:text-brand-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ink-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-ink-500">
          <p>© {new Date().getFullYear()} AgriMarket. Dữ liệu truy xuất do quản trị viên nông trại ghi nhận.</p>
          <p>Không dùng hình ảnh chứng từ làm nội dung quảng cáo.</p>
        </div>
      </div>
    </footer>
  )
}
