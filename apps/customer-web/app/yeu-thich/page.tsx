import { SavedProducts } from '@/components/saved-products'

export const metadata = { title: 'Sản phẩm yêu thích' }

export default function FavouritesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-ink-900">Sản phẩm yêu thích</h1>
        <p className="mt-1 text-sm text-ink-600">Lưu trên thiết bị này. Giá và tồn kho lấy mới mỗi lần mở.</p>
      </header>
      <SavedProducts kind="favourites" />
    </div>
  )
}
