import Link from 'next/link'
import { currentCustomer } from '@/lib/session'
import { ChangePassword } from '@/components/change-password'
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
        breadcrumb={<Link href="/tai-khoan" className="hover:underline">Tài khoản</Link>}
      />
      <div className="grid max-w-3xl gap-4 md:grid-cols-[1fr_1fr]">
        <ChangePassword />
        <section className="card-pad text-sm">
          <h2 className="font-semibold text-ink-900">Giữ tài khoản an toàn</h2>
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
