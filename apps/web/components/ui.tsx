export function StatusBadge({ map, value }: { map: Record<string, { label: string; className: string }>; value: string }) {
  const item = map[value] ?? { label: value, className: 'bg-slate-100 text-slate-700' }
  return <span className={`badge ${item.className}`}>{item.label}</span>
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="card grid place-items-center gap-2 p-10 text-center">
      <p className="font-medium text-leaf-800">{title}</p>
      {hint && <p className="text-sm text-leaf-600">{hint}</p>}
      {action}
    </div>
  )
}

export function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-leaf-900">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}
