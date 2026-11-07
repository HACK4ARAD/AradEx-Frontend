import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import type { ItineraryDto, ItineraryStop } from '@/shared/types/plan'

const get = vi.fn()
vi.mock('@/shared/api/itineraries', () => ({ itinerariesApi: { get: (id: string) => get(id), mine: vi.fn() } }))
vi.mock('vue-i18n', async (orig) => ({ ...(await orig<typeof import('vue-i18n')>()), useI18n: () => ({ t: (k: string) => k, locale: { value: 'ro' } }) }))

import {
  buildRoute, daysOf, legTotals, legsOf, loadDone, mapTarget, navigateUrl, progressPct, saveDone, stopHref, stopsForDay, toggleDone, useItinerary,
} from './useItinerary'

const stop = (order: number, day: 1 | 2 = 1, over: Partial<ItineraryStop> = {}): ItineraryStop => ({
  order, day, kind: 'PLACE', refId: order * 10, name: `S${order}`, subtitle: '', lat: 46.17 + order / 1000, lng: 21.31 + order / 1000,
  arriveAt: '2026-11-07T08:00:00Z', leaveAt: '2026-11-07T09:00:00Z', durationMin: 60, travelMinutesFromPrev: order * 2, travelKmFromPrev: order / 10,
  travelMode: 'WALK', hasGuide: false, ...over,
})
const itin = (stops: ItineraryStop[], days: 1 | 2 = 1): ItineraryDto => ({
  id: 7, title: 'T', summary: '', ask: '', date: '2026-11-07', days, transport: 'WALK', startTime: '10:00', totalMinutes: 0, totalKm: 0, offline: false, stops,
})

beforeEach(() => { setActivePinia(createPinia()); localStorage.clear(); get.mockReset() })

describe('days and stops', () => {
  it('groups the stops by day (sorted by order); a one-day itinerary shows them all', () => {
    const stops = [stop(3, 2), stop(1, 1), stop(4, 2), stop(2, 1)]
    expect(daysOf(itin(stops, 2))).toEqual([1, 2])
    expect(daysOf(itin([stop(1)]))).toEqual([1])
    expect(stopsForDay(stops, 1, 2).map((s) => s.order)).toEqual([1, 2])
    expect(stopsForDay(stops, 2, 2).map((s) => s.order)).toEqual([3, 4])
    expect(stopsForDay(stops, 2, 1).map((s) => s.order)).toEqual([1, 2, 3, 4])
  })

  it('legs connect consecutive stops of the shown day; totals skip the trip to the first stop', () => {
    const day2 = stopsForDay([stop(1), stop(2), stop(3, 2), stop(4, 2, { travelMode: 'CAR' })], 2, 2)
    const legs = legsOf(day2)
    expect(legs).toHaveLength(1)
    expect(legs[0]).toMatchObject({ minutes: 8, km: 0.4, mode: 'CAR' })
    expect(legs[0].from.order).toBe(3)
    expect(legTotals(day2)).toEqual({ minutes: 8, km: 0.4 })
    expect(legTotals([stop(1)])).toEqual({ minutes: 0, km: 0 })
  })
})

describe('links', () => {
  it('map target and detail page per stop kind', () => {
    expect(mapTarget({ kind: 'PLACE', refId: 3 })).toBe('/map?to=place:3')
    expect(mapTarget({ kind: 'EVENT', refId: 5 })).toBe('/map?to=event:5')
    expect(mapTarget({ kind: 'OFFER', refId: 9 })).toBe('/map?to=offer:9')
    expect(stopHref({ kind: 'PLACE', refId: 3 })).toBe('/places/3')
    expect(stopHref({ kind: 'EVENT', refId: 5 })).toBe('/events/5')
    expect(stopHref({ kind: 'OFFER', refId: 9 })).toBe('/offers/9')
  })
  it('Google Maps directions in the itinerary mode', () => {
    const p = { lat: 46.1, lng: 21.3 }
    expect(navigateUrl(p, 'WALK')).toContain('travelmode=walking')
    expect(navigateUrl(p, 'CAR')).toContain('travelmode=driving')
    expect(navigateUrl(p, 'PUBLIC')).toContain('travelmode=transit')
  })
})

describe('progress persistence', () => {
  it('saves and loads the ticked stops per itinerary', () => {
    saveDone(7, [1, 3])
    expect(loadDone(7)).toEqual([1, 3])
    expect(loadDone(8)).toEqual([])
    expect(toggleDone([1, 3], 3)).toEqual([1])
    expect(toggleDone([1], 2)).toEqual([1, 2])
    expect(progressPct(1, 3)).toBe(33)
    expect(progressPct(0, 0)).toBe(0)
  })
  it('survives broken or blocked storage', () => {
    localStorage.setItem('ax.itinerary.done.7', '{oops')
    expect(loadDone(7)).toEqual([])
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(() => saveDone(7, [1])).not.toThrow()
    spy.mockRestore()
  })
})

describe('buildRoute', () => {
  const osrm = (coords: [number, number][]) => ({ ok: true, json: async () => ({ routes: [{ duration: 600, distance: 800, geometry: { coordinates: coords } }] }) })

  it('chains the legs into one street line without repeating the joints', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(osrm([[21.1, 46.1], [21.15, 46.15], [21.2, 46.2]]))
      .mockResolvedValueOnce(osrm([[21.2, 46.2], [21.3, 46.3]]))
    const r = await buildRoute([{ lat: 46.1, lng: 21.1 }, { lat: 46.2, lng: 21.2 }, { lat: 46.3, lng: 21.3 }], 'foot', fetchFn as unknown as typeof fetch)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(String(fetchFn.mock.calls[0][0])).toContain('routed-foot')
    expect(r).toEqual({ line: [[46.1, 21.1], [46.15, 21.15], [46.2, 21.2], [46.3, 21.3]], approximate: false })
  })

  it('falls back to straight lines (approximate) when OSRM fails; nothing for a single stop', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('offline'))
    const r = await buildRoute([{ lat: 46.1, lng: 21.1 }, { lat: 46.2, lng: 21.2 }], 'car', fetchFn as unknown as typeof fetch)
    expect(r).toEqual({ line: [[46.1, 21.1], [46.2, 21.2]], approximate: true })
    expect(await buildRoute([{ lat: 46.1, lng: 21.1 }], 'foot')).toBeNull()
  })
})

describe('useItinerary', () => {
  it('loads by id, keeps the ticks in localStorage and tracks the next stop', async () => {
    get.mockResolvedValue(itin([stop(1), stop(2)]))
    saveDone(7, [1])
    const u = useItinerary(ref('7'))
    await vi.waitFor(() => expect(u.it.value).not.toBeNull())
    expect(get).toHaveBeenCalledWith('7')
    expect(u.doneCount.value).toBe(1)
    expect(u.next.value?.order).toBe(2)
    expect(u.legAfter.value.get(1)?.to.order).toBe(2)
    u.toggle(u.stops.value[1])
    await nextTick()
    expect(u.allDone.value).toBe(true)
    expect(u.pct.value).toBe(100)
    expect(loadDone(7)).toEqual([1, 2])
  })

  it('switches days on a two-day itinerary while progress counts every stop', async () => {
    get.mockResolvedValue(itin([stop(1), stop(2), stop(3, 2)], 2))
    const u = useItinerary(ref('abc'), 2)
    await vi.waitFor(() => expect(u.it.value).not.toBeNull())
    expect(u.days.value).toEqual([1, 2])
    expect(u.stops.value.map((s) => s.order)).toEqual([3])
    expect(u.total.value).toBe(3)
    u.day.value = 1
    expect(u.stops.value.map((s) => s.order)).toEqual([1, 2])
  })

  it('a 404 is "not found", without a white screen', async () => {
    const { ApiError } = await import('@/shared/api/client')
    get.mockRejectedValue(new ApiError(404, 'Nu există'))
    const u = useItinerary(ref('99'))
    await vi.waitFor(() => expect(u.loading.value).toBe(false))
    expect(u.notFound.value).toBe(true)
    expect(u.it.value).toBeNull()
  })
})
