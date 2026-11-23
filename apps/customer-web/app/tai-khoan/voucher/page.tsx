import { redirect } from 'next/navigation'
import { authCookie, currentCustomer } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { AccountBreadcrumb } from '@/components/account-nav'
import { PageHeader } from '@agrimarket/ui'
import Link from 'next/link'
import { VoucherWallet } from '@/components/voucher-wallet'

export const metadata = { title: 'Ví voucher' }

export default async function VoucherWalletPage() {
  const user = await currentCustomer()
  if (!user) redirect('/dang-nhap?next=/tai-khoan/voucher')

  return (
    <div className="space-y-4">
      <PageHeader
        title="Ví voucher của tôi"
        description="Mã bạn đã lưu. Trạng thái và số tiền giảm được kiểm tra lại theo chương trình gốc mỗi lần xem."
        breadcrumb={<AccountBreadcrumb />}
        actions={
          <Link href="/uu-dai" className="btn-secondary btn-sm">
            Xem ưu đãi
          </Link>
        }
      />
      <VoucherWallet />
    </div>
  )
}
