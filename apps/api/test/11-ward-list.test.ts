import { describe, expect, it } from 'vitest'
import { filterWards, normalizeVi, sortWards } from '@agrimarket/core'

/** The client ward list must never truncate and must order/tìm theo tiếng Việt. */
const wards = [
  { code: '1', name: 'Phố Hiến' },
  { code: '2', name: 'Đức Hợp' },
  { code: '3', name: 'Ân Thi' },
  { code: '4', name: 'Bần Yên Nhân' },
  { code: '5', name: 'Ăn Khê' },
  ...Array.from({ length: 99 }, (_, i) => ({ code: `x${i}`, name: `Xã ${String(i).padStart(3, '0')}` })),
]

describe('ward list for the shopper pickers', () => {
  it('returns the full list when nothing is typed', () => {
    expect(filterWards(wards, '')).toHaveLength(104)
    expect(filterWards(wards, '   ')).toHaveLength(104)
  })

  it('sorts Vietnamese alphabetically, not by the API type-first order', () => {
    const names = filterWards(wards, '').map((w) => w.name)
    expect(names.slice(0, 4)).toEqual(['Ăn Khê', 'Ân Thi', 'Bần Yên Nhân', 'Đức Hợp'])
    expect(sortWards(wards).map((w) => w.code).indexOf('1')).toBe(4)
  })

  it('matches with and without diacritics', () => {
    expect(filterWards(wards, 'pho hien').map((w) => w.code)).toEqual(['1'])
    expect(filterWards(wards, 'Phố Hiến').map((w) => w.code)).toEqual(['1'])
    expect(filterWards(wards, 'duc hop').map((w) => w.code)).toEqual(['2'])
    expect(filterWards(wards, 'AN THI').map((w) => w.code)).toEqual(['3'])
    expect(normalizeVi('Đức Hợp')).toBe('duc hop')
  })

  it('keeps every match while searching, in the same alphabetical order', () => {
    const hits = filterWards(wards, 'Xã 00')
    expect(hits).toHaveLength(10)
    expect(hits.map((w) => w.code)).toEqual(Array.from({ length: 10 }, (_, i) => `x${i}`))
  })

  it('does not mutate the caller array', () => {
    const input = [...wards]
    filterWards(input, '')
    expect(input.map((w) => w.code)).toEqual(wards.map((w) => w.code))
  })
})
