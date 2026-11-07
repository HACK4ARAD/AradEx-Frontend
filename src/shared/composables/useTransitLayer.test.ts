import { describe, expect, it } from 'vitest'
import { filterTransitModes, findTransit, transitLines } from './useTransitLayer'
import type { TransitRouteDto, TransitStopDto, TransitVehicleDto } from '@/shared/types/transit'

const stop: TransitStopDto = { id: 7, name: 'Gara', lat: 46.19, lng: 21.32, routeIds: [1], lines: ['1'] }
const veh: TransitVehicleDto = { id: 'v3', routeId: 1, routeShortName: '1', mode: 'TRAM', lat: 46.18, lng: 21.31, stale: false }

describe('findTransit', () => {
  it('finds the stop or vehicle behind a transit pin id', () => {
    expect(findTransit('stop:7', [stop], [veh])).toEqual({ kind: 'stop', stop })
    expect(findTransit('vehicle:v3', [stop], [veh])).toEqual({ kind: 'vehicle', vehicle: veh })
  })

  it('returns null for app pins, unknown ids and nothing selected', () => {
    expect(findTransit('event:7', [stop], [veh])).toBeNull()
    expect(findTransit('stop:99', [stop], [veh])).toBeNull()
    expect(findTransit(null, [stop], [veh])).toBeNull()
  })
})

describe('transitLines', () => {
  const route = (id: number, color: string | undefined, paths: [number, number][][]): TransitRouteDto => ({
    id, shortName: String(id), longName: '', mode: 'TRAM', color, patterns: paths.map((path, index) => ({ index, stopIds: [], path })),
  })

  it('draws every variant of every line in the line colour, skipping paths with fewer than 2 points', () => {
    const lines = transitLines([route(1, '#b80000', [[[46.1, 21.3], [46.2, 21.4]], [[46.2, 21.4], [46.1, 21.3]]]), route(2, undefined, [[[46.1, 21.3]]])])
    expect(lines).toEqual([
      { id: 'line:1:0', color: '#b80000', path: [[46.1, 21.3], [46.2, 21.4]] },
      { id: 'line:1:1', color: '#b80000', path: [[46.2, 21.4], [46.1, 21.3]] },
    ])
  })

  it('falls back to the transit blue when a line has no colour', () => {
    expect(transitLines([route(3, undefined, [[[46.1, 21.3], [46.2, 21.4]]])])[0].color).toBe('#1D5FD1')
  })
})

describe('filterTransitModes', () => {
  const r = (id: number, mode: 'TRAM' | 'BUS'): TransitRouteDto => ({ id, shortName: String(id), longName: '', mode, patterns: [] })
  const routes = [r(1, 'TRAM'), r(21, 'BUS')]
  const stops: TransitStopDto[] = [
    { ...stop, id: 1, routeIds: [1] }, { ...stop, id: 2, routeIds: [21] }, { ...stop, id: 3, routeIds: [1, 21] },
  ]
  const vehicles: TransitVehicleDto[] = [{ ...veh, id: 'a', routeId: 1, mode: 'TRAM' }, { ...veh, id: 'b', routeId: 21, mode: 'BUS' }, { ...veh, id: 'c', routeId: 21, mode: undefined }]

  it('keeps everything when trams and buses are both on', () => {
    expect(filterTransitModes(['TRAM', 'BUS'], routes, stops, vehicles)).toEqual({ routes, stops, vehicles })
  })
  it('buses only: bus lines, stops served by a bus, bus vehicles (unknown mode → by its route)', () => {
    const f = filterTransitModes(['BUS'], routes, stops, vehicles)
    expect(f.routes.map((x) => x.id)).toEqual([21])
    expect(f.stops.map((x) => x.id)).toEqual([2, 3])
    expect(f.vehicles.map((x) => x.id)).toEqual(['b', 'c'])
  })
  it('nothing selected: nothing shown', () => {
    expect(filterTransitModes([], routes, stops, vehicles)).toEqual({ routes: [], stops: [], vehicles: [] })
  })
  it('keeps the stops while the lines are not loaded yet', () => {
    expect(filterTransitModes(['TRAM'], [], stops, []).stops).toHaveLength(3)
  })
})
