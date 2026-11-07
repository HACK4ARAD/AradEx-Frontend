import { describe, expect, it, vi } from 'vitest'
import { distanceKm, fetchDirections, googleMapsUrl } from './useDirections'

const FROM = { lat: 46.1866, lng: 21.3123 }
const TO = { lat: 46.1720, lng: 21.3290 }

describe('distanceKm', () => {
  it('is about 2 km between Piața Avram Iancu and the Fortress area', () => {
    expect(distanceKm(FROM, TO)).toBeGreaterThan(1.8)
    expect(distanceKm(FROM, TO)).toBeLessThan(2.3)
  })
})

describe('fetchDirections', () => {
  it('asks OSRM for the mode and returns the line as lat/lng with minutes and km', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [{ duration: 1500, distance: 2100, geometry: { coordinates: [[21.3123, 46.1866], [21.329, 46.172]] } }] }),
    })
    const d = await fetchDirections(FROM, TO, 'foot', fetchFn as unknown as typeof fetch)

    expect(fetchFn.mock.calls[0][0]).toBe('https://routing.openstreetmap.de/routed-foot/route/v1/driving/21.3123,46.1866;21.329,46.172?overview=full&geometries=geojson')
    expect(d.line).toEqual([[46.1866, 21.3123], [46.172, 21.329]])
    expect(d.durationMin).toBe(25)
    expect(d.distanceKm).toBe(2.1)
    expect(d.approximate).toBe(false)
  })

  it('falls back to a straight line at 5 km/h on foot when OSRM fails', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('offline'))
    const d = await fetchDirections(FROM, TO, 'foot', fetchFn as unknown as typeof fetch)

    expect(d.approximate).toBe(true)
    expect(d.line).toEqual([[FROM.lat, FROM.lng], [TO.lat, TO.lng]])
    expect(d.durationMin).toBe(Math.round((distanceKm(FROM, TO) / 5) * 60))
  })

  it('falls back at 30 km/h by car, also when OSRM answers without a route', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: 'NoRoute', routes: [] }) })
    const d = await fetchDirections(FROM, TO, 'car', fetchFn as unknown as typeof fetch)

    expect(d.approximate).toBe(true)
    expect(d.durationMin).toBe(Math.max(1, Math.round((distanceKm(FROM, TO) / 30) * 60)))
  })
})

describe('googleMapsUrl', () => {
  it('opens directions to the point', () => {
    expect(googleMapsUrl(TO, 'foot')).toBe('https://www.google.com/maps/dir/?api=1&destination=46.172,21.329&travelmode=walking')
    expect(googleMapsUrl(TO, 'car')).toBe('https://www.google.com/maps/dir/?api=1&destination=46.172,21.329&travelmode=driving')
  })
})
