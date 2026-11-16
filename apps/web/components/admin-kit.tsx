'use client'

import { useState } from 'react'
import { api, ApiFailure } from '@/lib/api'

/** Calls an endpoint then refreshes server data so the table stays authoritative. */
export function Act({
  path,
  body,
  method = 'POST',
  label,
  confirmText,
  className = 'btn-secondary',
  promptLabel,
  disabled,
}: {
  path: string
  body?: unknown
  method?: 'POST' | 'PATCH' | 'DELETE'
  label: string
  confirmText?: string
  className?: string
  promptLabel?: string
  disabled?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    let payload = body
    if (promptLabel) {
      const input = window.prompt(promptLabel)
      if (!input) return
      payload = { ...(body as Record<string, unknown> | undefined), reason: input, summary: input, resolution: input }
    }
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true)
    setError(null)
    try {
      await api(path, { method, body: payload === undefined ? undefined : JSON.stringify(payload) })
      window.location.reload()
    } catch (e) {
      setError(e instanceof ApiFailure ? e.payload.message : 'Thao tác thất bại.')
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col">
      <button type="button" className={className} onClick={run} disabled={busy || disabled}>
        {busy ? '…' : label}
      </button>
      {error && <span className="mt-1 text-xs text-red-700">{error}</span>}
    </span>
  )
}

export function Field({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
  placeholder,
  options,
  step,
  rows,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  defaultValue?: string | number
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  step?: string
  rows?: number
}) {
  if (options) {
    return (
      <div>
        <label className="label" htmlFor={name}>{label}</label>
        <select id={name} name={name} className="input" required={required} defaultValue={defaultValue}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    )
  }
  if (rows) {
    return (
      <div className="sm:col-span-2">
        <label className="label" htmlFor={name}>{label}</label>
        <textarea id={name} name={name} rows={rows} className="input" required={required} defaultValue={defaultValue} placeholder={placeholder} />
      </div>
    )
  }
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="input"
      />
    </div>
  )
}

/** Generic create form: serialises FormData to JSON, coercing numbers and booleans. */
export function CreateForm({
  path,
  title,
  fields,
  submitLabel = 'Tạo mới',
  collapsible = true,
  preset,
}: {
  path: string
  title: string
  fields: React.ReactNode
  submitLabel?: string
  collapsible?: boolean
  /** Fixed fields the user must not retype, e.g. the parent record id. */
  preset?: Record<string, unknown>
}) {
  const [open, setOpen] = useState(!collapsible)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const raw = Object.fromEntries(new FormData(form).entries()) as Record<string, string>
    const payload: Record<string, unknown> = {}
    const numeric = ['base_price_vnd', 'shelf_life_days', 'harvested_qty', 'area_ha', 'quantity', 'quantity_delta',
      'value', 'usage_limit', 'min_subtotal_vnd', 'sort_order', 'latitude', 'longitude', 'discount_percent', 'isolation_days']
    for (const [k, v] of Object.entries(raw)) {
      if (v === '') continue
      if (numeric.includes(k)) payload[k] = Number(v)
      else if (v === 'true' || v === 'false') payload[k] = v === 'true'
      else payload[k] = v
    }
    Object.assign(payload, preset)
    setBusy(true)
    setError(null)
    try {
      await api(path, { method: 'POST', body: JSON.stringify(payload) })
      form.reset()
      window.location.reload()
    } catch (err) {
      if (err instanceof ApiFailure) {
        setError(
          err.payload.field_errors
            ? Object.values(err.payload.field_errors).join(' ')
            : err.payload.message,
        )
      } else setError('Không thực hiện được.')
      setBusy(false)
    }
  }

  if (collapsible && !open) {
    return (
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>+ {title}</button>
    )
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {collapsible && <button type="button" className="btn-ghost text-sm" onClick={() => setOpen(false)}>Đóng</button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{fields}</div>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : submitLabel}</button>
    </form>
  )
}

/** Inline edit form that PATCHes one resource and refreshes the page. */
export function PatchForm({
  path,
  fields,
  submitLabel = 'Lưu thay đổi',
  title,
  method = 'PATCH',
}: {
  path: string
  fields: React.ReactNode
  submitLabel?: string
  title?: string
  method?: 'PATCH' | 'POST'
}) {
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const raw = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>
    const payload: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(raw)) {
      if (v === '') continue
      if (k === 'base_price_vnd' || k === 'shelf_life_days' || k === 'area_ha' || k === 'sort_order') payload[k] = Number(v)
      else if (v === 'true' || v === 'false') payload[k] = v === 'true'
      else payload[k] = v
    }
    setBusy(true)
    setError(null)
    setOk(false)
    try {
      await api(path, { method, body: JSON.stringify(payload) })
      setOk(true)
      window.location.reload()
    } catch (err) {
      setError(
        err instanceof ApiFailure
          ? err.payload.field_errors
            ? Object.values(err.payload.field_errors).join(' ')
            : err.payload.message
          : 'Không lưu được.',
      )
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      {title && <h2 className="font-semibold">{title}</h2>}
      <div className="grid gap-3 sm:grid-cols-2">{fields}</div>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {ok && <p className="text-sm text-leaf-800">Đã lưu.</p>}
      <button className="btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : submitLabel}</button>
    </form>
  )
}

/**
 * Uploads one file to the server, then optionally attaches it as evidence for a
 * domain record. The server sniffs the MIME from magic bytes, so the accept
 * attribute here is only a convenience.
 */
export function Uploader({
  ownerType,
  ownerId,
  isPublic = false,
  onUploaded,
  label = '+ Tải tệp',
}: {
  ownerType?: 'FARM' | 'BATCH' | 'CULTIVATION_LOG' | 'LAB_TEST' | 'CERTIFICATE' | 'BATCH_EVENT'
  ownerId?: string
  isPublic?: boolean
  onUploaded?: (url: string, mime: string) => void
  label?: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function send(file: File) {
    setBusy(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const up = await api<{ url: string; mime: string }>('/uploads', { method: 'POST', body: fd })
      if (ownerType && ownerId) {
        await api('/admin/evidence', {
          method: 'POST',
          body: JSON.stringify({
            owner_type: ownerType,
            owner_id: ownerId,
            url: up.url,
            mime: up.mime,
            description: file.name.slice(0, 120),
            is_public: isPublic,
          }),
        })
      }
      setDone(up.url)
      onUploaded?.(up.url, up.mime)
    } catch (e) {
      setError(e instanceof ApiFailure ? e.payload.message : 'Không tải được tệp.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-1">
      <label className="inline-flex cursor-pointer items-center rounded-lg border border-leaf-200 bg-white px-3 py-2 text-sm">
        {busy ? 'Đang tải…' : label}
        <input
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,application/pdf"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void send(f)
          }}
        />
      </label>
      {done && <p className="text-xs text-leaf-700">Đã tải: {done}</p>}
      {error && <p className="text-xs text-red-700" role="alert">{error}</p>}
    </div>
  )
}
