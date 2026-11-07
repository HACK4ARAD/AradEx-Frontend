import { describe, expect, it } from 'vitest'
import {
  ARRIVALS_LIMIT, DEFAULT_WAIT_MIN, bikeOption, buildPlan, carOption, departureRows, lineColors, lineDirections, nearbyStops,
  parkingPaidNow, patternGeo, rideMinutes, stopPathIndexes, transitCandidates, walkOption, withDepartures, type Dest,
} from './useTripPlanner'
import type { BikeStation } from '@/shared/data/bikes/bikes'
import type { ParkingSpot } from '@/shared/data/parking/parking'
import type { TransitArrivalDto, TransitRouteDto, TransitStopDto } from '@/shared/types/transit'

// o linie dreaptă spre nord, din ~100 m în ~100 m de latitudine (0.0009° ≈ 100 m)
const stop = (id: number, name: string, k: number): TransitStopDto => ({ id, name, lat: 46.17 + k * 0.0045, lng: 21.31, routeIds: [1], lines: ['1'] })
const S = [stop(1, 'Sud', 0), stop(2, 'Primărie', 1), stop(3, 'Teatru', 2), stop(4, 'Piața', 3), stop(5, 'Gara', 4)]
const path = S.flatMap((s, i) => (i ? [[s.lat - 0.00225, s.lng], [s.lat, s.lng]] : [[s.lat, s.lng]])) as [number, number][]
const tram: TransitRouteDto = {
  id: 1, shortName: '1', longName: 'Sud-Gara', mode: 'TRAM', color: '#b80000',
  patterns: [
    { index: -12, stopIds: [1, 2, 3, 4, 5], path },
    { index: -11, stopIds: [5, 4, 3, 2, 1], path: [...path].reverse() },
  ],
}
const byId = new Map(S.map((s) => [s.id, s]))
const near = (s: TransitStopDto) => ({ lat: s.lat, lng: s.lng + 0.001 }) // ~80 m spre est
const dest: Dest = { key: 'poi:gara', name: 'Gara Arad', type: 'Gară CFR', icon: 'train', ...near(S[4]) }
const arrival = (o: Partial<TransitArrivalDto>): TransitArrivalDto => ({ routeId: 1, stopId: 1, at: '2026-11-07T10:00:00Z', minutes: 3, delaySeconds: 0, realtime: true, ...o })

describe('line geometry', () => {
  it('maps each stop to its point on the path, in order', () => {
    expect(stopPathIndexes(path, S)).toEqual([0, 2, 4, 6, 8])
  })

  it('estimates ride minutes from the distance along the path plus the stops in between', () => {
    const g = patternGeo(tram.patterns[0], byId)
    expect(rideMinutes(g, 0, 4)).toBeGreaterThanOrEqual(6) // 2 km la 20 km/h = 6 min + 3 opriri
    expect(rideMinutes(g, 0, 1)).toBeGreaterThanOrEqual(1)
  })
})

describe('transitCandidates', () => {
  it('boards near the start and gets off near the destination, in the right direction', () => {
    const [c] = transitCandidates(near(S[0]), dest, [tram], byId)
    expect(c.board.name).toBe('Sud')
    expect(c.alight.name).toBe('Gara')
    expect(c.pattern.index).toBe(-12)
    expect(c.stops).toHaveLength(5)
    expect(c.path[0]).toEqual([S[0].lat, S[0].lng])
    expect(c.path.at(-1)).toEqual([S[4].lat, S[4].lng])
    expect(c.total).toBe(c.walk1Min + DEFAULT_WAIT_MIN + c.rideMin + c.walk2Min)
  })

  it('finds nothing when no stop is within walking distance', () => {
    expect(transitCandidates({ lat: 46.3, lng: 21.5 }, dest, [tram], byId)).toEqual([])
  })
})

describe('withDepartures', () => {
  const [c] = transitCandidates(near(S[0]), dest, [tram], byId)

  it('takes the first departure you can still catch after walking to the stop', () => {
    const o = withDepartures(c, true, [arrival({ minutes: 0 }), arrival({ minutes: c.walk1Min + 4 })])!
    expect(o.departMin).toBe(c.walk1Min + 4)
    expect(o.waitMin).toBe(4)
    expect(o.total).toBe(c.walk1Min + 4 + c.rideMin + c.walk2Min)
  })

  it('keeps the estimate without live data, drops a line that does not leave from there', () => {
    expect(withDepartures(c, false, [])).toBe(c)
    expect(withDepartures(c, true, [arrival({ routeId: 9 })])).toBeNull()
  })

  it('keeps the estimate when the stop list is full (the line may come later)', () => {
    const full = Array.from({ length: ARRIVALS_LIMIT }, () => arrival({ routeId: 9 }))
    expect(withDepartures(c, true, full)).toBe(c)
  })
})

describe('buildPlan', () => {
  const bikes: BikeStation[] = [
    { id: 'a', kind: 'dock', name: 'Sud', lat: S[0].lat, lng: S[0].lng },
    { id: 'b', kind: 'dock', name: 'Gara', lat: S[4].lat, lng: S[4].lng },
    { id: 'r', kind: 'rental', name: 'Închiriere', lat: S[0].lat, lng: S[0].lng },
  ]
  const spot = { id: 'p1', name: 'Str. Gării', zone: 1, capacity: 20, maxStayMin: null, lat: S[4].lat, lng: S[4].lng, paths: [] } as ParkingSpot

  it('lists at most 2 transit options plus walking, fastest first, then bike and car', () => {
    const from = near(S[0])
    const transit = transitCandidates(from, dest, [tram], byId)
    const plan = buildPlan(dest, from, transit, bikes, [spot])
    expect(plan.options.map((o) => o.kind).sort()).toEqual(['transit', 'walk'])
    expect(plan.options[0].total).toBeLessThanOrEqual(plan.options[1].total)
    expect(plan.others.map((o) => o.kind)).toEqual(['bike', 'car'])
    expect(plan.bestTransit?.route.id).toBe(1)
  })

  it('leaves a slow transit option out of the list but keeps it for the note', () => {
    const from = near(S[0])
    const [c] = transitCandidates(from, dest, [tram], byId)
    const slow = { ...c, total: walkOption(from, dest).total + 30 }
    const plan = buildPlan(dest, from, [slow], [], [])
    expect(plan.options.map((o) => o.kind)).toEqual(['walk'])
    expect(plan.bestTransit).toBe(slow)
  })

  it('uses only bike-sharing docks and the parking closest to the destination', () => {
    expect(bikeOption(near(S[0]), dest, bikes)?.from.id).toBe('a')
    expect(carOption(near(S[0]), dest, [spot]).parking?.id).toBe('p1')
    expect(carOption(near(S[0]), { lat: 46.4, lng: 21.6 }, [spot]).parking).toBeNull()
  })
})

describe('stops and departures', () => {
  it('keeps one stop per name (platforms across the street share it), closest first', () => {
    const twin = { ...S[1], id: 22 }
    expect(nearbyStops([S[1], twin, S[2]], S[1], 3).map((r) => r.stop.id)).toEqual([2, 3])
  })

  it('groups departures by line and direction, with the one after', () => {
    const rows = departureRows([arrival({ stopId: 2, minutes: 6 }), arrival({ stopId: 2, minutes: 14 }), arrival({ stopId: 2, routeId: 1, minutes: 2, headsign: 'X' })], [tram], byId)
    expect(rows).toHaveLength(1)
    expect(rows[0].to).toBe('Gara')
    expect(rows[0].first.minutes).toBe(2)
    expect(rows[0].then?.minutes).toBe(6)
  })

  it('gives each direction of a line once', () => {
    expect(lineDirections(tram, byId).map((d) => d.to)).toEqual(['Gara', 'Sud'])
  })
})

describe('lineColors', () => {
  it('picks readable text on light line colours', () => {
    expect(lineColors({ color: '#fccb00', mode: 'TRAM' }).fg).toBe('#111111')
    expect(lineColors({ color: '#b80000', mode: 'TRAM' }).fg).toBe('#FFFFFF')
    expect(lineColors({ mode: 'BUS' }).bg).toBe('#5C5C5C')
    expect(lineColors({ color: '#fccb00', textColor: '#ffffff', mode: 'BUS' }).fg).toBe('#111111')
    expect(lineColors({ color: '#b80000', textColor: '#ffffff', mode: 'TRAM' }).fg).toBe('#ffffff')
  })
})

describe('parkingPaidNow', () => {
  it('is paid on weekdays 08–17 and on Sunday morning only around Obor', () => {
    expect(parkingPaidNow({}, new Date('2026-11-09T08:00:00Z'))).toBe(true) // luni 10:00 la București
    expect(parkingPaidNow({}, new Date('2026-11-09T17:00:00Z'))).toBe(false) // luni 19:00
    expect(parkingPaidNow({}, new Date('2026-11-08T08:00:00Z'))).toBe(false) // duminică 10:00
    expect(parkingPaidNow({ sundayObor: true }, new Date('2026-11-08T08:00:00Z'))).toBe(true)
  })
})

describe('stopLabel', () => {
  it('drops the Telelink platform number', async () => {
    const { stopLabel } = await import('./useTripPlanner')
    expect(stopLabel('Atrium 2')).toBe('Atrium')
    expect(stopLabel('Gara CFR 1')).toBe('Gara CFR')
    expect(stopLabel('Primărie')).toBe('Primărie')
  })
})
