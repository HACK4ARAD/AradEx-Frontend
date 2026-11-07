import { describe, expect, it } from 'vitest'
import { busiestStops, linesNear, matchRank, popularPlaces, rankBy } from './useSuggest'
import type { PlaceSummary } from '@/shared/types/places'
import type { TransitRouteDto, TransitStopDto } from '@/shared/types/transit'

const route = (id: number, shortName: string, mode: 'TRAM' | 'BUS'): TransitRouteDto => ({ id, shortName, longName: '', mode, patterns: [] })
const stop = (id: number, name: string, lat: number, routeIds: number[]): TransitStopDto => ({ id, name, lat, lng: 21.31, routeIds, lines: [] })

describe('matchRank', () => {
  it('ranks names starting with the letters first, then a word starting with them, then anything containing them', () => {
    expect(matchRank('Palatul Cultural', 'pal')).toBe(0)
    expect(matchRank('Catedrala „Sfânta Treime”', 'sfa')).toBe(1)
    expect(matchRank('Teatrul de marionete', 'rion')).toBe(2)
    expect(matchRank('Gara', 'xyz')).toBe(-1)
  })

  it('ignores diacritics and case', () => {
    expect(matchRank('Piața Romană', 'piata r')).toBe(0)
  })
})

describe('rankBy', () => {
  it('keeps matches only, best match first, then the given (popularity) order', () => {
    const names = ['Teatrul de marionete', 'Teatrul Clasic', 'Palatul Teatrului']
    expect(rankBy(names, (n) => n, 'tea')).toEqual(['Teatrul de marionete', 'Teatrul Clasic', 'Palatul Teatrului'])
    expect(rankBy(names, (n) => n, 'cla')).toEqual(['Teatrul Clasic'])
  })
})

describe('linesNear', () => {
  it('lists the lines stopping within 400 m once, trams first, then by number', () => {
    const routes = [route(1, '19', 'BUS'), route(2, '3', 'TRAM'), route(3, '1', 'TRAM'), route(4, '46', 'BUS')]
    const stops = [stop(10, 'A', 46.17, [1, 2]), stop(11, 'B', 46.1702, [3, 2]), stop(12, 'Departe', 46.2, [4])]
    expect(linesNear({ lat: 46.17, lng: 21.31 }, stops, routes).map((r) => r.shortName)).toEqual(['1', '3', '19'])
  })
})

describe('popular', () => {
  it('puts places with a virtual guide first and keeps one stop per name', () => {
    const p = (id: number, g: number) => ({ id, guidePointsCount: g }) as PlaceSummary
    expect(popularPlaces([p(1, 0), p(2, 5), p(3, 2)]).map((x) => x.id)).toEqual([2, 3, 1])
    expect(busiestStops([stop(1, 'Atrium 1', 46.1, [1, 2, 3]), stop(2, 'Atrium 2', 46.1, [1, 2]), stop(3, 'Gara', 46.1, [1])]).map((s) => s.id)).toEqual([1, 3])
  })
})
