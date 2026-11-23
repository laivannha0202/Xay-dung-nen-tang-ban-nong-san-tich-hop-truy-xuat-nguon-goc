'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, ApiFailure } from '@/lib/api'
import { VoucherCard } from '@/components/voucher-card'
import { EmptyState, SectionHeader } from '@agrimarket/ui'
import type { Voucher } from '@agrimarket/core'

/**
 * Public board. Which vouchers exist, their value and their window all come from the API —
 * nothing here is invented, and a finished or paused program never reaches this list.
 */
export function OfferBoard({ authed }: { authed: boolean }) {
  const [vouchers, setVouchers] = useState<Voucher[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    api<Voucher[]>('/promotions')
      .then((v) => live && setVouchers(v))
      .catch((e) => live && setError(e instanceof ApiFailure ? e.payload.message : 'Không tải được ưu đãi.'))
    return () => {
      live = false
    }
  }, [])

  if (error) return <p className="error-text">{error}</p>
  if (!vouchers) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-36" />)}
      </div>
    )
  }

  const ready = vouchers.filter((v) => v.state === 'AVAILABLE')
  const later = vouchers.filter((v) => v.state !== 'AVAILABLE')

  return (
    <div className="space-y-6">
      {!authed && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
          <Link href="/dang-nhap?next=/uu-dai" className="font-semibold underline">
            Đăng nhập
          </Link>{' '}
          để lưu voucher vào ví và dùng khi thanh toán.
        </p>
      )}

      {vouchers.length === 0 ? (
        <EmptyState
          icon="promotion"
          title="Chưa có ưu đãi nào đang chạy"
          hint="Ưu đãi mới sẽ xuất hiện ở đây ngay khi được mở."
        />
      ) : (
        <>
          {ready.length > 0 && (
            <section className="space-y-3">
              <SectionHeader
                title="Đang áp dụng"
                hint={`${ready.length} chương trình có thể dùng ngay. Lưu mã rồi chọn ở bước thanh toán.`}
              />
              <ul className="grid gap-3 sm:grid-cols-2">
                {ready.map((v) => (
                  <li key={v.id}>
                    <VoucherCard voucher={v} canSave={authed} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {later.length > 0 && (
            <section className="space-y-3">
              <SectionHeader title="Điều kiện chưa đủ hoặc sắp mở" hint="Vẫn lưu được để dùng khi đủ điều kiện." />
              <ul className="grid gap-3 sm:grid-cols-2">
                {later.map((v) => (
                  <li key={v.id}>
                    <VoucherCard voucher={v} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
