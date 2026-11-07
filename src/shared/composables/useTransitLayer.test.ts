import { describe, expect, it } from 'vitest'
import { findTransit } from './useTransitLayer'
import type { TransitStopDto, TransitVehicleDto } from '@/shared/types/transit'

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
