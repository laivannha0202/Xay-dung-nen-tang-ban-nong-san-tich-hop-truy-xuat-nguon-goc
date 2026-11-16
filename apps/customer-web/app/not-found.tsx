import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-sm font-medium text-brand-700">404</p>
      <h1 className="mt-1 text-xl font-semibold text-ink-900">Không tìm thấy nội dung</h1>
      <p className="mt-2 text-sm text-ink-500">
        Đường dẫn có thể đã đổi, hoặc mã tem QR không còn hiệu lực. Tem đã tạo lại sẽ không truy xuất được bằng đường dẫn cũ.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Link href="/" className="btn-primary">Về trang chủ</Link>
        <Link href="/tim-kiem" className="btn-secondary">Tra cứu tem</Link>
      </div>
    </div>
  )
}
