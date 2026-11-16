import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-sm font-medium text-brand-700">404</p>
      <h1 className="mt-1 text-xl font-semibold text-ink-900">Không tìm thấy trang quản trị</h1>
      <p className="mt-2 text-sm text-ink-600">Đường dẫn có thể đã đổi hoặc bản ghi đã bị xoá.</p>
      <Link href="/admin" className="btn-primary mt-5">Về bảng điều khiển</Link>
    </div>
  )
}
