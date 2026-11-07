import { describe, expect, it } from 'vitest'
import { BIKE_OFFICIAL_COUNT, BIKE_STATIONS, bikeMarkers, findBike, type BikeStation } from './bikes'

const st = (id: string, kind: BikeStation['kind'] = 'dock'): BikeStation => ({ id, kind, name: id, lat: 46.18, lng: 21.31 })

describe('bike stations', () => {
  it('turns each station into a bike pin (the label is the Material Symbols ligature)', () => {
    expect(bikeMarkers([st('dock-3')])).toEqual([{ id: 'bike:dock-3', lat: 46.18, lng: 21.31, kind: 'bike', label: 'pedal_bike' }])
  })
  it('finds the station behind a bike pin and ignores other pins', () => {
    expect(findBike('bike:dock-3', [st('dock-3')])?.name).toBe('dock-3')
    expect(findBike('parking:dock-3', [st('dock-3')])).toBeNull()
    expect(findBike(null, [st('dock-3')])).toBeNull()
  })
  it('the generated data has only stations with a real point in Arad, and no more docks than the official list', () => {
    const docks = BIKE_STATIONS.filter((s) => s.kind === 'dock')
    expect(docks.length).toBeGreaterThan(0)
    expect(docks.length).toBeLessThanOrEqual(BIKE_OFFICIAL_COUNT)
    expect(new Set(BIKE_STATIONS.map((s) => s.id)).size).toBe(BIKE_STATIONS.length)
    for (const s of BIKE_STATIONS) {
      expect(s.lat, s.id).toBeGreaterThan(46.1); expect(s.lat, s.id).toBeLessThan(46.25)
      expect(s.lng, s.id).toBeGreaterThan(21.2); expect(s.lng, s.id).toBeLessThan(21.45)
      if (s.kind === 'dock') expect(s.address, s.id).toBeTruthy()
    }
  })
})
