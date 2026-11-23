import Link from 'next/link'
import { currentCustomer } from '@/lib/session'
import { PageHeader } from '@agrimarket/ui'
import { OfferBoard } from '@/components/offer-board'

export const metadata = {
  title: 'Ưu đãi AgriMarket',
  description: 'Mã giảm giá đang chạy cho đơn nông sản Hưng Yên. Lưu voucher và dùng khi thanh toán.',
}

export default async function OffersPage() {
  const user = await currentCustomer()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ưu đãi AgriMarket"
        description="Mã giảm giá đang chạy. Lưu về ví để chọn nhanh khi thanh toán — áp dụng mã không bắt buộc phải lưu trước."
        actions={
          user ? (
            <Link href="/tai-khoan/voucher" className="btn-secondary btn-sm">
              Ví voucher của tôi
            </Link>
          ) : (
            <Link href="/dang-nhap?next=/uu-dai" className="btn-primary btn-sm">
              Đăng nhập để lưu mã
            </Link>
          )
        }
      />
      <OfferBoard authed={Boolean(user)} />
    </div>
  )
}
