import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icon, PageHeader } from '@agrimarket/ui'

const POLICIES: Record<string, { title: string; intro: string; sections: Array<{ h: string; p: string }> }> = {
  'giao-hang': {
    title: 'Chính sách giao hàng',
    intro: 'AgriMarket hiện chỉ giao hàng trong tỉnh Hưng Yên (104 xã/phường sau sáp nhập), kể từ khi đơn được xác nhận.',
    sections: [
      { h: 'Phạm vi', p: 'Giao tận nơi trong tỉnh Hưng Yên. Bạn vẫn xem sản phẩm và tra cứu QR trên toàn quốc, nhưng địa chỉ nhận hàng phải thuộc Hưng Yên.' },
      { h: 'Phí giao', p: 'Đồng giá 20.000₫ cho đơn dưới 500.000₫. Miễn phí giao cho đơn từ 500.000₫. Phí được chốt theo địa chỉ bạn chọn.' },
      { h: 'Thời gian', p: 'Nội tỉnh: trong 24 giờ làm việc kể từ khi đơn được xác nhận.' },
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
        <p className="text-sm text-ink-600">Còn thắc mắc? Gửi khiếu nại trong mục Tài khoản để được xử lý theo đúng lô hàng.</p>
        <Link href="/tai-khoan/khieu-nai" className="btn-secondary btn-sm">Gửi khiếu nại</Link>
      </div>
    </div>
  )
}
