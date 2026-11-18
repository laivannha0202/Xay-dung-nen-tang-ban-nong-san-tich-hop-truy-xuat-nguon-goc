'use client'

import { Modal } from '@agrimarket/ui'
import { useEffect, useRef, useState } from 'react'
import { api, ApiFailure } from '@/lib/api'

/** Marks rows written by the demo seeders so nobody mistakes mock volume for real business data. */
export function DemoTag() {
  return (
    <span
      className="badge bg-ink-100 text-ink-600 ring-ink-200"
      title="Bản ghi minh hoạ do script seed-demo-* tạo, không phải dữ liệu kinh doanh thật"
    >
      DEMO
    </span>
  )
}
/** Calls an endpoint then refreshes server data so the table stays authoritative.
 *  Actions that carry a reason open an in-page modal instead of `window.prompt`.
 */
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
  const [reason, setReason] = useState<string | null>(null)

  async function submit(payload: unknown) {
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

  function start() {
    if (promptLabel) {
      setError(null)
      setReason('')
      return
    }
    if (!confirmText || window.confirm(confirmText)) void submit(body)
  }
  return (
    <span className="inline-flex flex-col">
      <button type="button" className={className} onClick={start} disabled={busy || disabled}>
        {busy ? '…' : label}
      </button>
      {error && !promptLabel && <span className="error-text mt-1 inline-block">{error}</span>}
      {promptLabel && (
        <Modal open={reason !== null} title={label} onClose={() => setReason(null)}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              const text = (reason ?? '').trim()
              if (text.length < 5) {
                setError('Cần nhập tối thiểu 5 ký tự.')
                return
              }
              void submit({ ...(body as Record<string, unknown> | undefined), reason: text, summary: text, resolution: text })
            }}
          >
            <label className="label" htmlFor={`reason-${path}`}>
              {promptLabel}
            </label>
            <textarea
              id={`reason-${path}`}
              className="input"
              rows={3}
              value={reason ?? ''}
              onChange={(e) => setReason(e.target.value)}
            />
            {error && <p className="error-text">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setReason(null)}>
                Hủy
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? '…' : 'Xác nhận'}
              </button>
            </div>
          </form>
        </Modal>
      )}
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
  searchable,
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
  /** Long pickers (100+ batches/products) get a filter box above the select. */
  searchable?: boolean
}) {
  if (options) {
    return (
      <div>
        <label className="label" htmlFor={name}>{label}</label>
        <Choice name={name} options={options} required={required} defaultValue={defaultValue} searchable={searchable ?? options.length > 20} />
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


/**
 * Browser-level guard for a half-filled form: closing the tab or hitting F5 would lose
 * the season / batch / supplier just typed. Only fires once a field actually changed.
 */
function useDirtyGuard() {
  const dirty = useRef(false)
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])
  return { onDirty: () => void (dirty.current = true), clear: () => void (dirty.current = false) }
}

/** Generic create form: serialises FormData to JSON, coercing numbers and booleans. */
export function CreateForm({
  path,
  title,
  fields,
  submitLabel = 'Tạo mới',
  collapsible = true,
  preset,
  defaultOpen,
}: {
  path: string
  title: string
  fields: React.ReactNode
  submitLabel?: string
  collapsible?: boolean
  /** Fixed fields the user must not retype, e.g. the parent record id. */
  preset?: Record<string, unknown>
  /** Deep links that already know the context open the form straight away. */
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen || !collapsible)
  const guard = useDirtyGuard()
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
      guard.clear()
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
    <form onSubmit={submit} onInput={guard.onDirty} className="card-pad space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {collapsible && <button type="button" className="btn-ghost text-sm" onClick={() => setOpen(false)}>Đóng</button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{fields}</div>
      {error && <p className="error-text" role="alert">{error}</p>}
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
  const guard = useDirtyGuard()
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
      guard.clear()
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
    <form onSubmit={submit} onInput={guard.onDirty} className="card-pad space-y-3">
      {title && <h2 className="font-semibold">{title}</h2>}
      <div className="grid gap-3 sm:grid-cols-2">{fields}</div>
      {error && <p className="error-text" role="alert">{error}</p>}
      {ok && <p className="text-sm text-brand-800">Đã lưu.</p>}
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
  adminUpload = false,
  onUploaded,
  label = '+ Tải tệp',
}: {
  ownerType?: 'FARM' | 'BATCH' | 'CULTIVATION_LOG' | 'LAB_TEST' | 'CERTIFICATE' | 'BATCH_EVENT'
  ownerId?: string
  isPublic?: boolean
  /** Catalogue images are public assets; everything else stays private until attached. */
  adminUpload?: boolean
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
      const up = await api<{ url: string; mime: string }>(adminUpload ? '/admin/uploads' : '/uploads', {
        method: 'POST',
        body: fd,
      })
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
      <label className="inline-flex cursor-pointer items-center rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm hover:border-brand-300">
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
      {done && <p className="text-xs text-ink-600">Đã tải: {done}</p>}
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  )
}

/**
 * Native select, optionally with a diacritic-insensitive filter box. Keeps the form a
 * plain FormData submit — no custom widget that could lose its value on re-render.
 */
function Choice({
  name,
  options,
  required,
  defaultValue,
  searchable,
}: {
  name: string
  options: Array<{ value: string; label: string }>
  required?: boolean
  defaultValue?: string | number
  searchable?: boolean
}) {
  const [term, setTerm] = useState('')
  const [value, setValue] = useState(defaultValue !== undefined ? String(defaultValue) : (options[0]?.value ?? ''))
  const key = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u0323]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
  const shown = term ? options.filter((o) => key(o.label).includes(key(term))) : options
  return (
    <div className="space-y-1">
      {searchable && (
        <input
          className="input"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={`Lọc ${options.length} lựa chọn…`}
          aria-label={`Lọc ${name}`}
        />
      )}
      <select id={name} name={name} className="input" required={required} value={value} onChange={(e) => setValue(e.target.value)}>
        {shown.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {term && shown.length === 0 && <p className="hint">Không khớp — sửa từ khoá để chọn.</p>}
    </div>
  )
}
