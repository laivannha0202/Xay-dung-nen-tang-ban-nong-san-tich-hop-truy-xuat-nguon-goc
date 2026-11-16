import { Skeleton } from '@agrimarket/ui'

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-52" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}
