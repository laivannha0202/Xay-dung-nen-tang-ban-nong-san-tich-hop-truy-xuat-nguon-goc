/**
 * Home payloads overlap on purpose (a product can be featured and new), and a React list
 * keyed by id crashes on the repeat. One product, one card: every storefront row uses this.
 */
export function uniqueById<T extends { id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)))
}
