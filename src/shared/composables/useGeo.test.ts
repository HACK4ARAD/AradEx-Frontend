import { afterEach, describe, expect, it, vi } from 'vitest'
import { ARAD_CENTER, GOOD_ACCURACY_M, REFINE_MS, useGeo } from './useGeo'

const original = navigator.geolocation

afterEach(() => {
  Object.defineProperty(navigator, 'geolocation', { value: original, configurable: true })
  vi.useRealTimers()
})

const fix = (lat: number, lng: number, accuracy = 10) => ({ coords: { latitude: lat, longitude: lng, accuracy } }) as GeolocationPosition

function mockGeo(impl: Geolocation['getCurrentPosition']) {
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: impl }, configurable: true })
}

/** watchPosition controlat din test: `emit(fix)` / `fail(code)`; `cleared` = de câte ori s-a oprit. */
function mockWatch() {
  let ok: PositionCallback | null = null
  let err: PositionErrorCallback | null | undefined = null
  const state = { cleared: 0, opts: undefined as PositionOptions | undefined }
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn((o: PositionCallback, e?: PositionErrorCallback | null, opts?: PositionOptions) => { ok = o; err = e; state.opts = opts; return 7 }),
      clearWatch: vi.fn(() => { state.cleared++ }),
    },
  })
  return { state, emit: (p: GeolocationPosition) => ok?.(p), fail: (code: number) => err?.({ code } as GeolocationPositionError) }
}

describe('useGeo', () => {
  it('starts on the centre of Arad', () => {
    const g = useGeo()
    expect(g.position.value).toEqual(ARAD_CENTER)
    expect(g.isFallback.value).toBe(true)
    expect(g.near()).toBe('46.18660,21.31230')
  })

  it('uses the GPS position when allowed (browsers without watchPosition)', async () => {
    mockGeo(vi.fn((ok: PositionCallback) => ok(fix(46.17, 21.32))))
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

  it('resolves on the first fix, then moves to more accurate fixes and stops once accurate enough', async () => {
    const w = mockWatch()
    const g = useGeo()
    const p = g.locate()
    expect(w.state.opts).toMatchObject({ enableHighAccuracy: true, maximumAge: 0 })
    w.emit(fix(46.18, 21.30, 900)) // Wi-Fi / rețea: aproximativ
    await expect(p).resolves.toEqual({ lat: 46.18, lng: 21.30 })
    expect(g.accuracy.value).toBe(900)

    w.emit(fix(46.10, 21.10, 2000)) // mai proastă: ignorată
    expect(g.position.value).toEqual({ lat: 46.18, lng: 21.30 })

    w.emit(fix(46.1751, 21.3201, GOOD_ACCURACY_M - 5)) // GPS: exactă → oprim ascultarea
    expect(g.position.value).toEqual({ lat: 46.1751, lng: 21.3201 })
    expect(w.state.cleared).toBe(1)
  })

  it('stops listening after the refine window, and a late error does not drop a good position', async () => {
    vi.useFakeTimers()
    const w = mockWatch()
    const g = useGeo()
    const p = g.locate()
    w.emit(fix(46.17, 21.31, 60))
    await p
    w.fail(3)
    expect(g.isFallback.value).toBe(false)
    expect(g.error.value).toBeNull()
    vi.advanceTimersByTime(REFINE_MS + 1)
    expect(w.state.cleared).toBe(1)
  })

  it('falls back to the centre when no fix arrives at all', async () => {
    vi.useFakeTimers()
    mockWatch()
    const g = useGeo()
    const p = g.locate(5000)
    vi.advanceTimersByTime(REFINE_MS + 1)
    await expect(p).resolves.toEqual(ARAD_CENTER)
    expect(g.error.value).toBe('unavailable')
  })
})
