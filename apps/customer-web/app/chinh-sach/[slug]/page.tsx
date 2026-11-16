import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icon, PageHeader } from '@agrimarket/ui'

const POLICIES: Record<string, { title: string; intro: string; sections: Array<{ h: string; p: string }> }> = {
  'giao-hang': {
    title: 'Chính sách giao hàng',
    intro: 'Đơn được giao trong 24 giờ tại nội thành và 2–4 ngày với các tỉnh khác kể từ khi xác nhận.',
    sections: [
      { h: 'Phí giao', p: 'Miễn phí cho đơn từ 500.000₫. Đơn dưới mức này thu 30.000₫ toàn quốc.' },
      { h: 'Thời gian', p: 'Nội thành TP.HCM và Hà Nội: trong ngày. Tỉnh khác: 2–4 ngày làm việc.' },
      { h: 'Kiểm hàng', p: 'Bạn được mở kiểm trước khi thanh toán. Từ chối nhận nếu tem QR không khớp với lô đã đặt.' },
    ],
  },
  'doi-tra': {
    title: 'Đổi trả & hoàn tiền',
    intro: 'Nông sản tươi được đổi hoặc hoàn tiền khi không đúng lô, hư hỏng khi nhận, hoặc thiếu cân.',
    sections: [
      { h: 'Thời hạn', p: 'Gửi yêu cầu trong 24 giờ kể từ khi nhận đối với hàng tươi, 48 giờ với hàng khô.' },
      { h: 'Cách gửi', p: 'Mở đơn hàng trong mục Tài khoản và gửi khiếu nại kèm ảnh, hoặc quét tem QR để báo vấn đề đúng lô.' },
      { h: 'Hoàn tiền', p: 'Chuyển khoản trong 1–3 ngày làm việc sau khi đối soát. Đơn thanh toán COD được hoàn qua tài khoản ngân hàng của bạn.' },
    ],
  },
  'bao-mat': {
    title: 'Bảo mật thông tin',
    intro: 'Chúng tôi chỉ dùng dữ liệu cần thiết để giao hàng, xử lý khiếu nại và truy xuất nguồn gốc.',
    sections: [
      { h: 'Dữ liệu thu thập', p: 'Họ tên, email, số điện thoại, địa chỉ giao hàng và lịch sử đơn. Không lưu số thẻ.' },
      { h: 'Chia sẻ', p: 'Chỉ chia sẻ với đơn vị vận chuyển phần thông tin cần để giao hàng.' },
      { h: 'Quyền của bạn', p: 'Cập nhật hoặc xoá hồ sơ bất kỳ lúc nào trong mục Tài khoản.' },
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }))
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const policy = POLICIES[slug]
  if (!policy) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={policy.title}
        description={policy.intro}
        breadcrumb={
          <>
            <Link href="/" className="hover:underline">Trang chủ</Link> / {policy.title}
          </>
        }
      />
      <div className="space-y-3">
        {policy.sections.map((s) => (
          <section key={s.h} className="card-pad">
            <h2 className="flex items-center gap-2 font-semibold text-ink-900">
              <Icon name="check" className="h-4 w-4 text-brand-600" /> {s.h}
            </h2>
            <p className="mt-1 text-sm text-ink-600">{s.p}</p>
          </section>
        ))}
      </div>
      <div className="card-pad flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600">Còn thắc mắc? Gọi 1900 0000 hoặc gửi khiếu nại trong mục Tài khoản.</p>
        <Link href="/tai-khoan/khieu-nai" className="btn-secondary btn-sm">Gửi khiếu nại</Link>
      </div>
    </div>
  )
}
