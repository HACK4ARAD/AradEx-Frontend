import { describe, expect, it } from 'vitest'
import type { EventSummary } from '@/shared/types/events'
import type { PlaceSummary, PlaceType } from '@/shared/types/places'
import { groupByDay, isSightType, publicEvents, sortSights } from './usePublicPages'

const NOW = new Date('2026-11-11T10:00:00Z')
const ev = (id: number, startAt: string, patch: Partial<EventSummary> = {}): EventSummary => ({
  id, title: `E${id}`, category: 'CONCERT', startAt, locationName: 'L', lat: 46, lng: 21, ticketType: 'FREE', isHot: false, isDemo: false,
  participantsCount: 0, organizerName: 'O', organizerType: 'CITY', ratingCount: 0, ...patch,
})
const pl = (id: number, type: PlaceType, name: string, guidePointsCount = 0): PlaceSummary => ({
  id, name, type, lat: 46, lng: 21, visitMinutes: 30, tags: [], guidePointsCount, guideMinutes: 0, exteriorOnly: false,
})

describe('publicEvents', () => {
  it('drops the demo events and the ones that already ended, sorted by date', () => {
    const list = [
      ev(3, '2026-11-14T18:00:00Z'),
      ev(24, '2026-11-13T18:00:00Z', { isDemo: true }),
      ev(1, '2026-11-12T17:00:00Z'),
      ev(9, '2026-11-01T10:00:00Z', { endAt: '2026-11-02T10:00:00Z' }),                  // s-a încheiat
      ev(36, '2026-11-03T08:00:00Z', { endAt: '2026-11-30T16:00:00Z' }),                 // expoziție în curs
    ]
    expect(publicEvents(list, NOW).map((e) => e.id)).toEqual([36, 1, 3])
  })

  it('groups by Arad day; an ongoing event goes under today', () => {
    const list = publicEvents([
      ev(36, '2026-11-03T08:00:00Z', { endAt: '2026-11-30T16:00:00Z' }),
      ev(5, '2026-11-11T16:00:00Z'),
      ev(1, '2026-11-12T17:00:00Z'),
      ev(2, '2026-11-12T22:30:00Z'),                                                     // 00:30 pe 13 nov., ora Aradului
    ], NOW)
    expect(groupByDay(list, NOW).map((g) => [g.day, g.items.map((e) => e.id)])).toEqual([
      ['2026-11-11', [36, 5]], ['2026-11-12', [1]], ['2026-11-13', [2]],
    ])
  })
})

describe('sights', () => {
  it('keeps only attractions, museums, nature and parks; guided ones first, then by name', () => {
    const list = [pl(1, 'RESTAURANT', 'Zorba', 0), pl(2, 'MUSEUM', 'Muzeul Județean', 0), pl(3, 'ATTRACTION', 'Cetatea Aradului', 5),
      pl(4, 'PARK', 'Parcul Eminescu', 0), pl(5, 'ATTRACTION', 'Palatul Cultural', 7), pl(6, 'CAFE', 'Cafea', 0), pl(7, 'NATURE', 'Ceala', 0)]
    expect(sortSights(list).map((p) => p.id)).toEqual([5, 3, 7, 2, 4])
    expect(isSightType('WINERY')).toBe(false)
    expect(isSightType('NATURE')).toBe(true)
  })
})
