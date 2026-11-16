/** Storefront keeps its historical `StatusBadge map={…}` API over the shared pill. */
import { toneFor } from '@agrimarket/core'
import { Badge } from '@agrimarket/ui'

export function StatusBadge({ map, value }: { map: Record<string, string>; value: string }) {
  return <Badge tone={toneFor(value)}>{map[value] ?? value}</Badge>
}

export { EmptyState as Empty } from '@agrimarket/ui'
