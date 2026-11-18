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
      { href: '/danh-muc/dac-san', label: 'Đặc sản Hưng Yên' },
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
      { href: '/tim-kiem', label: 'Tra cứu nguồn gốc' },
      { href: '/chinh-sach/giao-hang', label: 'Giao hàng' },
      { href: '/chinh-sach/doi-tra', label: 'Đổi trả & hoàn tiền' },
      { href: '/chinh-sach/bao-mat', label: 'Bảo mật thông tin' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-ink-200 bg-ink-100">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-5 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
              <Icon name="leaf" className="h-4.5 w-4.5" />
            </span>
            <span className="text-[18px] font-bold tracking-tight text-ink-900">AgriMarket</span>
          </div>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-600">
            Nông sản Hưng Yên giao tận cửa. Mỗi gói hàng có mã tem để tra nguồn gốc khi bạn cần.
          </p>
          <Link href="/tai-khoan/khieu-nai" className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-[13px] font-medium text-brand-700 hover:underline">
            <Icon name="complaint" className="h-4 w-4" /> Gửi khiếu nại trong tài khoản
          </Link>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-[13px] font-bold text-ink-900">{col.title}</p>
            <ul className="mt-2.5 space-y-0.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-9 items-center text-[13px] text-ink-600 hover:text-brand-700 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ink-200">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-[11.5px] text-ink-500 sm:px-5">
          <p>© {new Date().getFullYear()} AgriMarket · Giao hàng nội tỉnh Hưng Yên</p>
          <p>Giá và tồn kho cập nhật theo lô hàng đang bán.</p>
        </div>
      </div>
    </footer>
  )
}
