import { afterEach, describe, expect, it, vi } from 'vitest'
import { ARAD_CENTER, GOOD_ACCURACY_M, MOVING_MPS, REFINE_MS, TRACK_MAX_ACCURACY_M, TRACK_MAX_AGE_MS, resetLastFix, useGeo } from './useGeo'

const original = navigator.geolocation

afterEach(() => {
  Object.defineProperty(navigator, 'geolocation', { value: original, configurable: true })
  resetLastFix()
  vi.useRealTimers()
})

/** pornirea ascultării așteaptă verificarea permisiunii (câteva microtask-uri) */
const started = async () => { for (let i = 0; i < 6; i++) await Promise.resolve() }

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
    await started()
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
    await started()
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
    await started()
    vi.advanceTimersByTime(REFINE_MS + 1)
    await expect(p).resolves.toEqual(ARAD_CENTER)
    expect(g.error.value).toBe('unavailable')
  })

  it('resolves a request that a newer one replaces, instead of leaving it hanging', async () => {
    mockWatch()
    const g = useGeo()
    const first = g.locate()
    void g.locate()
    await expect(first).resolves.toEqual(ARAD_CENTER)
  })

  it('starts the next screen on the last good fix', async () => {
    const w = mockWatch()
    const a = useGeo()
    const p = a.locate()
    await started()
    w.emit(fix(46.17, 21.32, 8))
    await p
    const b = useGeo()
    expect(b.isFallback.value).toBe(false)
    expect(b.position.value).toEqual({ lat: 46.17, lng: 21.32 })
  })

  it('waits for the permission prompt before the timeout starts, and stops at a denied permission', async () => {
    vi.useFakeTimers()
    const w = mockWatch()
    const perms = { query: vi.fn(async () => ({ state: 'prompt' })) }
    Object.defineProperty(navigator, 'permissions', { value: perms, configurable: true })
    const g = useGeo()
    const p = g.locate()
    await started()
    vi.advanceTimersByTime(REFINE_MS + 1) // fereastra de permisiune e încă deschisă: nu renunțăm
    w.emit(fix(46.17, 21.32, 10))
    await expect(p).resolves.toEqual({ lat: 46.17, lng: 21.32 })
    perms.query.mockResolvedValue({ state: 'denied' })
    const q = useGeo()
    resetLastFix()
    const r = useGeo()
    await expect(r.locate()).resolves.toEqual(ARAD_CENTER)
    expect(r.error.value).toBe('denied')
    expect(q).toBeTruthy()
    Object.defineProperty(navigator, 'permissions', { value: undefined, configurable: true })
  })

  it('shows the last known position at once, then moves to the fresh GPS fix', async () => {
    const w = mockWatch()
    const quick = vi.fn((ok: PositionCallback, _e?: PositionErrorCallback | null, o?: PositionOptions) => { if (o?.maximumAge) ok(fix(46.18, 21.31, 900)) })
    ;(navigator.geolocation as unknown as { getCurrentPosition: typeof quick }).getCurrentPosition = quick
    const g = useGeo()
    const p = g.locate()
    await started()
    await expect(p).resolves.toEqual({ lat: 46.18, lng: 21.31 }) // fără să aștepte GPS-ul
    expect(quick.mock.calls[0][2]).toMatchObject({ enableHighAccuracy: false })
    w.emit(fix(46.17, 21.32, 12))
    expect(g.position.value).toEqual({ lat: 46.17, lng: 21.32 })
    expect(g.accuracy.value).toBe(12)
  })
})

describe('useGeo.track', () => {
  const moving = (lat: number, lng: number, accuracy: number, speed: number | null, heading: number | null) =>
    ({ coords: { latitude: lat, longitude: lng, accuracy, speed, heading } }) as GeolocationPosition

  it('follows every precise fix with direction while moving, and drops the direction when you stop', async () => {
    const w = mockWatch()
    const g = useGeo()
    g.track()
    await started()
    expect(w.state.opts).toMatchObject({ enableHighAccuracy: true, maximumAge: TRACK_MAX_AGE_MS })
    w.emit(moving(46.17, 21.31, 8, 5, 92))
    expect(g.position.value).toEqual({ lat: 46.17, lng: 21.31 })
    expect(g.heading.value).toBe(92)
    w.emit(moving(46.171, 21.311, 9, 5.5, 95))
    expect(g.position.value).toEqual({ lat: 46.171, lng: 21.311 })
    w.emit(moving(46.171, 21.311, 9, MOVING_MPS / 2, 300))   // pe loc: direcția GPS nu mai e de încredere
    expect(g.heading.value).toBeNull()
    g.untrack()
    expect(w.state.cleared).toBe(1)
  })

  it('does not jump from a good fix to a rough network fix', async () => {
    const w = mockWatch()
    const g = useGeo()
    g.track()
    await started()
    w.emit(moving(46.17, 21.31, 10, null, null))
    w.emit(moving(46.30, 21.50, TRACK_MAX_ACCURACY_M + 200, null, null))
    expect(g.position.value).toEqual({ lat: 46.17, lng: 21.31 })
    g.untrack()
  })

  it('pauses while the app is in the background', async () => {
    const w = mockWatch()
    const g = useGeo()
    g.track()
    await started()
    const vis = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(w.state.cleared).toBe(1)
    vis.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await started()
    expect((navigator.geolocation.watchPosition as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2)
    vis.mockRestore()
    g.untrack()
  })
})
