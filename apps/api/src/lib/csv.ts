/** RFC 4180 cell: quote when the value could break a column, always escape quotes. */
function cell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * CSV for Excel on a Vietnamese Windows box: UTF-8 BOM so "Hưng Yên" is not mojibake,
 * CRLF line ends, and a leading `=` neutralised so a product name can never become a formula.
 */
export function csv(rows: Array<Record<string, unknown>>, headers?: Array<[string, string]>): string {
  const cols = headers ?? Object.keys(rows[0] ?? {}).map((k) => [k, k] as [string, string])
  const safe = (v: unknown) => (String(v ?? '') === '' ? '' : /^[=+\-@]/.test(String(v)) ? `'${String(v)}` : v)
  const lines = [
    cols.map(([, label]) => cell(label)).join(','),
    ...rows.map((r) => cols.map(([key]) => cell(safe(r[key]))).join(',')),
  ]
  return `\uFEFF${lines.join('\r\n')}\r\n`
}

/** Sends a CSV download without letting a proxy strip the Vietnamese-safe encoding. */
export function sendCsv<T>(reply: { header: (k: string, v: string) => unknown; send: (b: T) => unknown }, filename: string, body: string) {
  reply.header('content-type', 'text/csv; charset=utf-8')
  reply.header('content-disposition', `attachment; filename="${filename}"`)
  return reply.send(body as unknown as T)
}
