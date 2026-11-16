'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/** Route-level error boundary: keeps the layout, offers a retry (CUS-12-01). */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="card mx-auto max-w-lg p-6 text-center">
      <h1 className="text-lg font-semibold">Không tải được trang này</h1>
      <p className="mt-2 text-sm text-leaf-700">
        Hệ thống gặp sự cố tạm thời. Dữ liệu bạn đã nhập vẫn còn, hãy thử lại.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button type="button" className="btn-primary" onClick={reset}>Thử lại</button>
        <Link href="/" className="btn-secondary">Về trang chủ</Link>
      </div>
    </div>
  )
}
