import { STORE, storeContactLines } from '@agrimarket/core'
import { BrandLogo } from '@agrimarket/ui'

/** Vietnamese date on paper: day/month/year, never a two-digit year. */
const ISSUED = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Ho_Chi_Minh',
})

export interface DocSignoff {
  label: string
  note?: string
}

/**
 * Printed document frame shared by every phiếu: A4, store letterhead, optional contact lines.
 * Rendered outside the admin shell so nothing but the document reaches paper (see print.css).
 */
export function PrintDoc({
  title,
  code,
  issuedAt,
  subtitle,
  demo,
  signoffs = [],
  children,
}: {
  title: string
  code: string
  issuedAt?: string
  subtitle?: string
  /** Demo rows must never read as a real business document. */
  demo?: boolean
  signoffs?: DocSignoff[]
  children: React.ReactNode
}) {
  const contacts = storeContactLines()
  return (
    <article className="doc">
      <header className="doc-head">
        <div className="doc-brand">
          <BrandLogo size="lg" wordmark />
          {STORE.legalName && <p className="doc-legal">{STORE.legalName}</p>}
          {contacts.map((line) => (
            <p key={line} className="doc-contact">
              {line}
            </p>
          ))}
        </div>
        <div className="doc-id">
          <h1 className="doc-title">{title}</h1>
          <p className="doc-code">Số: {code}</p>
          <p className="doc-date">Ngày lập: {ISSUED.format(new Date(issuedAt ?? Date.now()))}</p>
          {subtitle && <p className="doc-sub">{subtitle}</p>}
          {demo && <p className="doc-demo">DỮ LIỆU MINH HOẠ (DEMO) — không dùng làm chứng từ thật</p>}
        </div>
      </header>

      {children}

      {signoffs.length > 0 && (
        <div className="doc-signoffs">
          {signoffs.map((s) => (
            <div key={s.label} className="doc-signoff">
              <p className="doc-signoff-label">{s.label}</p>
              <p className="doc-signoff-note">{s.note ?? 'Ký, ghi rõ họ tên'}</p>
              <div className="doc-signoff-space" />
            </div>
          ))}
        </div>
      )}

      <footer className="doc-foot">
        <span>{STORE.name} — in từ hệ thống quản trị AgriMarket</span>
        <span>Trang in A4 · tiền tệ VND</span>
      </footer>
    </article>
  )
}

/** Titled block inside a document; `table` sections keep the header on every printed page. */
export function DocSection({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="doc-section">
      <h2 className="doc-section-title">
        {title}
        {note && <span className="doc-section-note">{note}</span>}
      </h2>
      {children}
    </section>
  )
}

/** Key/value pairs printed in a bounded grid — the field list differs per document type. */
export function DocFields({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="doc-fields">
      {rows
        .filter(([, v]) => v !== '' && v !== null && v !== undefined)
        .map(([k, v]) => (
          <div key={k} className="doc-field">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
    </dl>
  )
}

export function DocTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <table className="doc-table">
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={h} className={i === 0 ? undefined : 'num'}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) => (
              <td key={j} className={j === 0 ? undefined : 'num'}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
