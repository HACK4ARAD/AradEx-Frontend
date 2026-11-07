import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { arrivalWhen, lineName, nextPerLine, transitMarkers, useNearestStop, useVisiblePolling, vehicleTitle, NEAREST_MAX_KM } from './useTransit'
import type { StopArrivalsDto, TransitArrivalDto, TransitStopDto, TransitVehicleDto } from '@/shared/types/transit'

const visibility = ref<'visible' | 'hidden'>('visible')
vi.mock('@vueuse/core', () => ({ useDocumentVisibility: () => visibility }))

const nearest = vi.fn()
vi.mock('@/shared/api/transit', () => ({ transitApi: { nearest: (...a: unknown[]) => nearest(...a) } }))

// t simplu: cheia + parametrii, ca să verificăm ce text se cere
const t = (key: string, p?: Record<string, unknown>) => (p ? `${key}(${Object.values(p).join(',')})` : key)

const arrival = (routeId: number, minutes: number, extra: Partial<TransitArrivalDto> = {}): TransitArrivalDto => ({
  routeId, routeShortName: String(routeId), mode: 'TRAM', stopId: 1, at: '2026-11-07T16:25:00Z', minutes, delaySeconds: 0, realtime: true, ...extra,
})
const stop: TransitStopDto = { id: 239, name: 'Primariei 1', lat: 46.1753, lng: 21.3178, routeIds: [11], lines: ['1'] }

describe('texts', () => {
  it('names the line by mode, falling back to the route id', () => {
    expect(lineName(t, { mode: 'TRAM', routeShortName: '1', routeId: 11 })).toBe('transit.tram(1)')
    expect(lineName(t, { mode: 'BUS', routeShortName: '21', routeId: 3 })).toBe('transit.bus(21)')
    expect(lineName(t, { routeId: 99 })).toBe('transit.line(99)')
  })
  it('says now / in N min / at HH:MM', () => {
    expect(arrivalWhen(t, arrival(1, 0))).toBe('transit.now')
    expect(arrivalWhen(t, arrival(1, 4))).toBe('transit.inMinutes(4)')
    expect(arrivalWhen(t, arrival(1, 75))).toBe('transit.at(18:25)') // 16:25 UTC = 18:25 în Arad
  })
  it('keeps the first arrival of each line', () => {
    expect(nextPerLine([arrival(1, 2), arrival(1, 5), arrival(3, 6), arrival(6, 7)]).map((a) => [a.routeId, a.minutes]))
      .toEqual([[1, 2], [3, 6]])
  })
})

describe('transitMarkers', () => {
  it('maps stops and live vehicles to the MapView marker format (short pin label), skipping stale vehicles', () => {
    const v = (id: string, stale: boolean): TransitVehicleDto =>
      ({ id, routeId: 13, routeShortName: '3', mode: 'TRAM', headsign: 'Gara', lat: 46.18, lng: 21.31, stale })
    expect(transitMarkers([stop], [v('334', false), v('9', true)])).toEqual([
      { id: 'stop:239', lat: 46.1753, lng: 21.3178, kind: 'stop', label: '' },
      { id: 'vehicle:334', lat: 46.18, lng: 21.31, kind: 'vehicle', label: '3' },
    ])
    expect(vehicleTitle(t, v('334', false))).toBe('transit.tram(3) → Gara')
  })
})

describe('useVisiblePolling', () => {
  beforeEach(() => { vi.useFakeTimers(); visibility.value = 'visible' })
  afterEach(() => vi.useRealTimers())

  it('polls every 30 s only while visible and never overlaps', async () => {
    let resolve: () => void = () => {}
    const task = vi.fn(() => new Promise<void>((r) => { resolve = r }))
    const scope = effectScope()
    const p = scope.run(() => useVisiblePolling(task))!
    expect(task).toHaveBeenCalledTimes(1)

    await p.refresh()                       // cererea e încă în curs: nu pornește alta
    expect(task).toHaveBeenCalledTimes(1)
    resolve(); await Promise.resolve(); await Promise.resolve()
    await vi.advanceTimersByTimeAsync(0)    // refresh-ul cerut între timp rulează imediat după
    expect(task).toHaveBeenCalledTimes(2)
    resolve(); await vi.advanceTimersByTimeAsync(30_000)
    expect(task).toHaveBeenCalledTimes(3)

    resolve(); visibility.value = 'hidden'; await nextTick()
    await vi.advanceTimersByTimeAsync(120_000)
    expect(task).toHaveBeenCalledTimes(3)   // ascuns: nicio cerere

    visibility.value = 'visible'; await nextTick()
    expect(task).toHaveBeenCalledTimes(4)   // la revenire: imediat
    resolve(); scope.stop()
    await vi.advanceTimersByTimeAsync(120_000)
    expect(task).toHaveBeenCalledTimes(4)   // oprit la ieșirea din ecran
  })
})

describe('useNearestStop', () => {
  beforeEach(() => { visibility.value = 'visible'; nearest.mockReset() })

  it('loads the nearest stop for the point and hides it when it is too far to walk', async () => {
    const near: StopArrivalsDto = { stop, distanceKm: 0.1, live: true, attribution: 'Date: CTP Arad / Telelink', arrivals: [arrival(11, 4)] }
    nearest.mockResolvedValueOnce(near).mockResolvedValueOnce({ ...near, distanceKm: NEAREST_MAX_KM + 1 })
    const point = ref<{ lat: number; lng: number } | null>({ lat: 46.1754, lng: 21.3193 })
    const scope = effectScope()
    const r = scope.run(() => useNearestStop(point))!
    await vi.waitFor(() => expect(r.nearby.value?.stop.id).toBe(239))
    expect(nearest).toHaveBeenCalledWith(46.1754, 21.3193)
    await new Promise((r) => setTimeout(r, 20))
    expect(nearest).toHaveBeenCalledTimes(1) // o singură cerere la montare

    point.value = { lat: 46.1378, lng: 21.6048 }
    await vi.waitFor(() => expect(r.data.value?.distanceKm).toBe(NEAREST_MAX_KM + 1))
    expect(r.nearby.value).toBeNull()
    scope.stop()
  })

  it('ignores the late answer for the previous point', async () => {
    let first: (v: StopArrivalsDto) => void = () => {}
    let second: (v: StopArrivalsDto) => void = () => {}
    const old: StopArrivalsDto = { stop, distanceKm: 0.1, live: true, attribution: '', arrivals: [] }
    nearest.mockReturnValueOnce(new Promise((r) => { first = r })).mockReturnValueOnce(new Promise((r) => { second = r }))
    const point = ref<{ lat: number; lng: number } | null>({ lat: 46.17, lng: 21.31 })
    const scope = effectScope()
    const r = scope.run(() => useNearestStop(point))!
    point.value = { lat: 46.18, lng: 21.32 }   // se schimbă cât prima cerere e încă în curs
    await nextTick()
    first(old)                                 // răspunsul vechi vine târziu: nu se arată
    await vi.waitFor(() => expect(nearest).toHaveBeenCalledTimes(2))
    expect(r.data.value).toBeNull()
    second({ ...old, stop: { ...stop, id: 120, name: 'Podgoria' } })
    await vi.waitFor(() => expect(r.data.value?.stop.id).toBe(120))
    scope.stop()
  })

  it('stays empty without a point and keeps quiet on errors', async () => {
    nearest.mockRejectedValue(new Error('down'))
    const point = ref<{ lat: number; lng: number } | null>(null)
    const scope = effectScope()
    const r = scope.run(() => useNearestStop(point))!
    await Promise.resolve()
    expect(nearest).not.toHaveBeenCalled()
    point.value = { lat: 46.17, lng: 21.31 }
    await vi.waitFor(() => expect(r.error.value).toBe('down'))
    expect(r.nearby.value).toBeNull()
    scope.stop()
  })
})
