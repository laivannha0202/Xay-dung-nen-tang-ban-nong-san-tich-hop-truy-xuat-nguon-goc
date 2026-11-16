/** Admin keeps its historical `StatusBadge map={…}` API on top of the shared pill. */
import { TONE_CLASS, toneFor } from '@agrimarket/core'
import { Badge } from '@agrimarket/ui'

export function StatusBadge({ map, value }: { map: Record<string, string>; value: string }) {
  return <Badge tone={toneFor(value)}>{map[value] ?? value}</Badge>
}

export { EmptyState as Empty } from '@agrimarket/ui'
export { TONE_CLASS }
