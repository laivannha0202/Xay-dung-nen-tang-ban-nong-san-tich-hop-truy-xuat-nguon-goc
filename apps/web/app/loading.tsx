export default function Loading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <div className="h-7 w-48 animate-pulse rounded bg-leaf-100" />
      <div className="h-24 animate-pulse rounded-xl bg-leaf-50" />
      <div className="h-24 animate-pulse rounded-xl bg-leaf-50" />
    </div>
  )
}
