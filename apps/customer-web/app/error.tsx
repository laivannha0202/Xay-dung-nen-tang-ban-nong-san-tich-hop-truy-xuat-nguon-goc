'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-semibold text-ink-900">Trang này đang gặp sự cố</h1>
      <p className="mt-2 text-sm text-ink-500">
        Dữ liệu chưa tải được. Bạn thử lại, hoặc quay về trang chủ nếu lỗi vẫn tiếp diễn.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-5">Thử lại</button>
    </div>
  )
}
