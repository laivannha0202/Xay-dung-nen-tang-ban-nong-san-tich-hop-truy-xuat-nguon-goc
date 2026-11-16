import Link from 'next/link'

export const metadata = { title: 'Không tìm thấy — AgriMarket' }

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-lg p-6 text-center">
      <h1 className="text-lg font-semibold">Không tìm thấy nội dung</h1>
      <p className="mt-2 text-sm text-leaf-700">
        Đường dẫn không tồn tại, hoặc mã tem QR đã bị thay đổi. Hãy kiểm tra lại tem trên bao bì.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Link href="/" className="btn-primary">Về trang chủ</Link>
        <Link href="/tim-kiem" className="btn-secondary">Tra cứu tem QR</Link>
      </div>
    </div>
  )
}
