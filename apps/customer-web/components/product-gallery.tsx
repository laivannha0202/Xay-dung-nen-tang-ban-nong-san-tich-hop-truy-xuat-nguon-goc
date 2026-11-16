'use client'

import { useState } from 'react'
import { Icon } from '@agrimarket/ui'

/** Thumbnail strip with a big preview; no lightbox dependency. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)
  if (images.length === 0) {
    return (
      <div className="grid aspect-4/3 place-items-center rounded-[var(--radius-card)] border border-ink-100 bg-brand-50/60 text-brand-300">
        <Icon name="leaf" className="h-12 w-12" />
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div className="aspect-4/3 overflow-hidden rounded-[var(--radius-card)] border border-ink-100 bg-brand-50/60">
        <img src={images[active]} alt={name} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ảnh ${i + 1}`}
              aria-pressed={i === active}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === active ? 'border-brand-500' : 'border-transparent hover:border-ink-200'
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
