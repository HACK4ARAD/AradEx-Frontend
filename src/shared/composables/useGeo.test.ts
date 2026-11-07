import { afterEach, describe, expect, it, vi } from 'vitest'
import { ARAD_CENTER, useGeo } from './useGeo'

const original = navigator.geolocation

afterEach(() => { Object.defineProperty(navigator, 'geolocation', { value: original, configurable: true }) })

function mockGeo(impl: Geolocation['getCurrentPosition']) {
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: impl }, configurable: true })
}

describe('useGeo', () => {
  it('starts on the centre of Arad', () => {
    const g = useGeo()
    expect(g.position.value).toEqual(ARAD_CENTER)
    expect(g.isFallback.value).toBe(true)
    expect(g.near()).toBe('46.18660,21.31230')
  })

  it('uses the GPS position when allowed', async () => {
    mockGeo(vi.fn((ok: PositionCallback) => ok({ coords: { latitude: 46.17, longitude: 21.32 } } as GeolocationPosition)))
    const g = useGeo()
    await expect(g.locate()).resolves.toEqual({ lat: 46.17, lng: 21.32 })
    expect(g.isFallback.value).toBe(false)
  })

  it('keeps the fallback when permission is denied', async () => {
    mockGeo(vi.fn((_ok: PositionCallback, err?: PositionErrorCallback | null) => err?.({ code: 1 } as GeolocationPositionError)))
    const g = useGeo()
    await expect(g.locate()).resolves.toEqual(ARAD_CENTER)
    expect(g.error.value).toBe('denied')
    expect(g.isFallback.value).toBe(true)
  })
})
