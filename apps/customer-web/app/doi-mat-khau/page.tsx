import Link from 'next/link'
import { ChangePassword } from '@/components/change-password'
import { PageHeader } from '@agrimarket/ui'

export const metadata = { title: 'Đổi mật khẩu' }

/** Kept so old links and bookmarks keep working; `/tai-khoan/bao-mat` is the canonical entry. */
export default function ChangePasswordPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <PageHeader
        title="Đổi mật khẩu"
        description="Sau khi đổi, hãy đăng nhập lại trên các thiết bị khác."
        breadcrumb={<Link href="/tai-khoan/bao-mat" className="hover:underline">Bảo mật</Link>}
      />
      <ChangePassword />
    </div>
  )
}
