import { describe, expect, it } from 'vitest'
import { browseRange, pageCount, paginate } from './useEventBrowse'

// sâmbătă 7 nov. 2026, 10:00 în Arad
const SAT = new Date('2026-11-07T08:00:00Z')

describe('browseRange', () => {
  it('"all" = the next 30 days, starting now (no from)', () => {
    expect(browseRange('all', SAT)).toEqual({ to: '2026-12-06' })
  })
  it('the other periods are the same as the app chips', () => {
    expect(browseRange('today', SAT)).toEqual({ to: '2026-11-07' })
    expect(browseRange('week', SAT)).toEqual({ to: '2026-11-13' })
  })
})

describe('paging', () => {
  const list = Array.from({ length: 20 }, (_, i) => i)
  it('page count is at least 1', () => {
    expect(pageCount(0)).toBe(1)
    expect(pageCount(9)).toBe(1)
    expect(pageCount(10)).toBe(2)
    expect(pageCount(20)).toBe(3)
  })
  it('slices 9 per page and clamps the page into range', () => {
    expect(paginate(list, 0)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(paginate(list, 2)).toEqual([18, 19])
    expect(paginate(list, 7)).toEqual([18, 19])
    expect(paginate(list, -1)).toHaveLength(9)
    expect(paginate([], 3)).toEqual([])
  })
})
