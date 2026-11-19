/**
 * Diacritic-insensitive, lowercase — same shape as the API's `wards.search_text`,
 * so "pho hien" and "Phố Hiến" hit the same rows on both clients.
 */
export const normalizeVi = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()

const collator = new Intl.Collator('vi')

/** Vietnamese alphabetical order (ă/â after a, đ after d) — never rely on the API's type-first sort. */
export function sortWards<T extends { name: string }>(wards: readonly T[]): T[] {
  return [...wards].sort((a, b) => collator.compare(a.name, b.name))
}

/**
 * The complete matching list, never truncated: all 104 wards are shipped once per
 * session, so the dropdown scrolls instead of the shopper having to guess a query.
 */
export function filterWards<T extends { name: string }>(wards: readonly T[], query: string): T[] {
  const n = normalizeVi(query)
  return sortWards(n ? wards.filter((w) => normalizeVi(w.name).includes(n)) : wards)
}
