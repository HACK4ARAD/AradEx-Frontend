import { describe, expect, it } from 'vitest'
import { filterItems, parseTarget, type MapItem } from './useMapData'

const item = (key: string): MapItem => ({ key, kind: key.split(':')[0] as MapItem['kind'], lat: 46.18, lng: 21.31, title: key, sub: '', href: '/' })

describe('parseTarget', () => {
  it('accepts kind:id targets from ?to=', () => {
    expect(parseTarget('place:3')).toBe('place:3')
    expect(parseTarget('event:12')).toBe('event:12')
    expect(parseTarget('offer:2')).toBe('offer:2')
    expect(parseTarget('action:7')).toBe('action:7')
  })

  it('ignores anything else', () => {
    expect(parseTarget('ev:3')).toBeNull()
    expect(parseTarget('place:abc')).toBeNull()
    expect(parseTarget(undefined)).toBeNull()
    expect(parseTarget(['place:3'])).toBeNull()
  })
})

describe('filterItems', () => {
  const all = [item('event:1'), item('place:2'), item('offer:3'), item('action:4')]

  it('keeps everything for "all" and one kind otherwise', () => {
    expect(filterItems(all, 'all')).toHaveLength(4)
    expect(filterItems(all, 'place').map((i) => i.key)).toEqual(['place:2'])
  })

  it('always keeps the target, even when its kind is filtered out', () => {
    expect(filterItems(all, 'event', 'place:2').map((i) => i.key)).toEqual(['event:1', 'place:2'])
  })

  it('"all" shows only featured places (with a guide), "place" shows every place', () => {
    const plain = { ...item('place:9'), featured: false }
    const guided = { ...item('place:2'), featured: true }
    expect(filterItems([plain, guided, item('event:1')], 'all').map((i) => i.key)).toEqual(['place:2', 'event:1'])
    expect(filterItems([plain, guided], 'place').map((i) => i.key)).toEqual(['place:9', 'place:2'])
    expect(filterItems([plain], 'all', 'place:9').map((i) => i.key)).toEqual(['place:9'])
  })
})
