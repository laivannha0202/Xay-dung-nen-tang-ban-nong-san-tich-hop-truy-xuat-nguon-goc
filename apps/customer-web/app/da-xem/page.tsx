import { SavedProducts } from '@/components/saved-products'

export const metadata = { title: 'Đã xem gần đây' }

export default function ViewedPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-ink-900">Đã xem gần đây</h1>
        <p className="mt-1 text-sm text-ink-600">Danh sách lưu trên thiết bị này; giá và tồn kho luôn lấy mới từ cửa hàng.</p>
      </header>
      <SavedProducts kind="viewed" />
    </div>
  )
}
