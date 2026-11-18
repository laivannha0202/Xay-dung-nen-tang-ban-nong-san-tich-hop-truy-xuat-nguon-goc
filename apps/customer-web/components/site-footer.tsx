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
      { href: '/tim-kiem', label: 'Tra cứu tem QR' },
      { href: '/chinh-sach/giao-hang', label: 'Chính sách giao hàng' },
      { href: '/chinh-sach/doi-tra', label: 'Đổi trả & hoàn tiền' },
      { href: '/chinh-sach/bao-mat', label: 'Bảo mật thông tin' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-brand-900 text-brand-100">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-white/12 text-white ring-1 ring-white/20 ring-inset">
              <Icon name="leaf" className="h-5 w-5" />
            </span>
            <span className="text-[19px] font-bold tracking-tight text-white">AgriMarket</span>
          </div>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-brand-100/80">
            Nông sản bán theo lô, mỗi lô một mã QR truy xuất tới nông trại, nhật ký canh tác và kết quả kiểm nghiệm.
          </p>
          {/* No hotline is published yet, so the footer points at a channel that really exists. */}
          <div className="mt-5 space-y-2 text-[13px] text-brand-100/80">
            <Link href="/tai-khoan/khieu-nai" className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-white">
              <Icon name="complaint" className="h-4 w-4 shrink-0" /> Gửi khiếu nại trong tài khoản
            </Link>
            <p className="flex items-center gap-2"><Icon name="pin" className="h-4 w-4 shrink-0" /> Giao nội tỉnh Hưng Yên</p>
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-[11.5px] font-semibold tracking-[0.12em] text-white uppercase">{col.title}</p>
            <ul className="mt-4 space-y-1 text-[13px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-9 items-center text-brand-100/75 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-5 text-[11.5px] text-brand-100/60 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} AgriMarket. Dữ liệu truy xuất do quản trị viên nông trại ghi nhận.</p>
          <p>Không dùng hình ảnh chứng từ làm nội dung quảng cáo.</p>
        </div>
      </div>
    </footer>
  )
}
