'use client'

import { useEffect } from 'react'
import { Icon } from '@agrimarket/ui'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="card-pad mx-auto max-w-lg text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-rose-50 text-rose-700">
        <Icon name="alert" />
      </span>
      <h1 className="mt-3 font-semibold text-ink-900">Không tải được dữ liệu</h1>
      <p className="mt-1 text-sm text-ink-600">Máy chủ không phản hồi hoặc phiên đăng nhập đã hết hạn.</p>
      <button type="button" onClick={reset} className="btn-primary mt-4">Thử lại</button>
    </div>
  )
}
