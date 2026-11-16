'use client'

import { useState } from 'react'
import { api, ApiFailure } from '@/lib/api'
import { Uploader } from './admin-kit'

interface Image {
  url: string
  alt: string
}

/**
 * Product gallery editor. The PATCH replaces the whole image list, so every
 * change is submitted together; order in this array is the display order.
 */
export function ProductImages({ productId, initial }: { productId: string; initial: Image[] }) {
  const [images, setImages] = useState<Image[]>(initial)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState('')

  async function save(next: Image[]) {
    setBusy(true)
    setError(null)
    try {
      await api(`/admin/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ images: next }),
      })
      setImages(next)
    } catch (e) {
      setError(e instanceof ApiFailure ? e.payload.message : 'Không lưu được ảnh.')
    } finally {
      setBusy(false)
    }
  }

  function move(index: number, delta: number) {
    const next = [...images]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item!)
    void save(next)
  }

  return (
    <section className="card-pad space-y-3">
      <h2 className="font-semibold">Ảnh sản phẩm ({images.length})</h2>
      {images.length === 0 ? (
        <p className="text-sm text-ink-600">Chưa có ảnh. Tải ảnh để hiển thị trên Website và Ứng dụng.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <li key={`${img.url}-${i}`} className="rounded-lg border border-ink-200 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt || `Ảnh ${i + 1}`} className="h-32 w-full rounded object-cover" />
              <input
                className="input mt-2 text-xs"
                value={img.alt}
                placeholder="Mô tả ảnh (alt)"
                onChange={(e) => {
                  const next = [...images]
                  next[i] = { ...img, alt: e.target.value }
                  setImages(next)
                }}
                onBlur={() => void save(images)}
              />
              <div className="mt-2 flex gap-1 text-xs">
                <button type="button" className="btn-ghost" disabled={busy || i === 0} onClick={() => move(i, -1)}>↑</button>
                <button type="button" className="btn-ghost" disabled={busy || i === images.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button
                  type="button"
                  className="btn-ghost text-red-700"
                  disabled={busy}
                  onClick={() => void save(images.filter((_, j) => j !== i))}
                >
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <Uploader
          label="+ Tải ảnh lên"
          onUploaded={(u) => void save([...images, { url: u, alt: '' }])}
        />
        <div className="flex flex-1 items-end gap-2">
          <div className="flex-1">
            <label className="label" htmlFor="imgurl">Hoặc dán đường dẫn ảnh</label>
            <input id="imgurl" className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/images/products/ca-chua-bien.jpg" />
          </div>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy || url.trim().length === 0}
            onClick={() => {
              void save([...images, { url: url.trim(), alt: '' }])
              setUrl('')
            }}
          >
            Thêm
          </button>
        </div>
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
    </section>
  )
}
