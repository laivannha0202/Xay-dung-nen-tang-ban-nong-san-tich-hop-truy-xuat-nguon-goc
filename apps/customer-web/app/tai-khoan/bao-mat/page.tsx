import Link from 'next/link'
import { currentCustomer } from '@/lib/session'
import { ChangePassword } from '@/components/change-password'
import { AccountBreadcrumb } from '@/components/account-nav'
import { PageHeader } from '@agrimarket/ui'

export const metadata = { title: 'Đăng nhập & bảo mật' }

export default async function SecurityPage() {
  const user = await currentCustomer()
  if (!user) return null
  return (
    <div className="space-y-4">
      <PageHeader
        title="Đăng nhập & bảo mật"
        description={`Tài khoản đăng nhập bằng ${user.email}.`}
        breadcrumb={<AccountBreadcrumb />}
      />
      <div className="grid gap-6 md:grid-cols-[minmax(0,26rem)_1fr]">
        <ChangePassword />
        <section aria-labelledby="sec-tips" className="text-sm md:border-l md:border-ink-100 md:pl-6">
          <h2 id="sec-tips" className="font-semibold text-ink-900">Giữ tài khoản an toàn</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink-700">
            <li>Dùng mật khẩu riêng cho AgriMarket, không dùng lại mật khẩu email hay ngân hàng.</li>
            <li>Đổi mật khẩu sẽ đăng xuất các thiết bị khác; đăng nhập lại trên máy bạn đang dùng.</li>
            <li>Không chia sẻ mã đăng nhập cho người khác. AgriMarket không bao giờ hỏi mật khẩu qua điện thoại.</li>
            <li>Nếu nghi ngờ bị lộ, hãy đổi mật khẩu ngay và gửi khiếu nại để được hỗ trợ.</li>
          </ul>
          <Link href="/tai-khoan/khieu-nai" className="btn-secondary btn-sm mt-3">
            Liên hệ hỗ trợ
          </Link>
        </section>
      </div>
    </div>
  )
}
