import { ref } from 'vue'
import type { GeoPoint } from '@/shared/types/common'

/** Centrul Aradului (Piața Avram Iancu) — poziția implicită când nu avem GPS. */
export const ARAD_CENTER: GeoPoint = { lat: 46.1866, lng: 21.3123 }

/** Sub atâția metri poziția e „exactă” și nu mai așteptăm alte citiri. */
export const GOOD_ACCURACY_M = 25
/** Cât timp mai ascultăm GPS-ul după prima citire, ca să prindem una mai precisă. */
export const REFINE_MS = 15_000

/**
 * Poziția utilizatorului: `locate()` cere GPS-ul (doar la o acțiune a omului, nu la încărcare); fără permisiune,
 * fără GPS sau după timeout rămâne pe centrul Aradului cu `isFallback = true`, fără eroare în consolă.
 * Prima citire e adesea aproximativă (rețea / Wi-Fi, sute de metri), mai ales în browserul telefonului: `locate()` se
 * rezolvă la prima citire, dar ascultă GPS-ul încă `REFINE_MS` și mută poziția la fiecare citire mai precisă, până la
 * `GOOD_ACCURACY_M`. Nu folosește poziții vechi din cache (`maximumAge: 0`).
 * Folosit de hartă (T08), „lângă tine” (T06/T10), transport (T19).
 */
export function useGeo() {
  const position = ref<GeoPoint>({ ...ARAD_CENTER })
  const isFallback = ref(true)
  const loading = ref(false)
  const error = ref<string | null>(null)
  /** precizia ultimei poziții, în metri (null = centrul Aradului) */
  const accuracy = ref<number | null>(null)

  let watchId: number | null = null
  let stopTimer: ReturnType<typeof setTimeout> | null = null

  function stop() {
    if (watchId != null && typeof navigator !== 'undefined') navigator.geolocation?.clearWatch?.(watchId)
    watchId = null
    if (stopTimer) clearTimeout(stopTimer)
    stopTimer = null
  }

  function accept(p: GeolocationPosition) {
    position.value = { lat: p.coords.latitude, lng: p.coords.longitude }
    accuracy.value = Number.isFinite(p.coords.accuracy) ? p.coords.accuracy : null
    isFallback.value = false
    error.value = null
  }

  function locate(timeoutMs = 10_000): Promise<GeoPoint> {
    const geo = typeof navigator === 'undefined' ? undefined : navigator.geolocation
    if (!geo) {
      error.value = 'unavailable'
      return Promise.resolve(position.value)
    }
    stop()
    loading.value = true
    return new Promise((resolve) => {
      let resolved = false
      const done = () => {
        if (resolved) return
        resolved = true
        loading.value = false
        resolve(position.value)
      }
      const onFix = (p: GeolocationPosition) => {
        // prima citire se ia oricum; după aceea doar una mai precisă (sau la fel de precisă, dar mai nouă)
        const better = !resolved || accuracy.value == null || p.coords.accuracy <= accuracy.value
        if (better) accept(p)
        done()
        if (accuracy.value != null && accuracy.value <= GOOD_ACCURACY_M) stop()
      }
      const onError = (e: GeolocationPositionError) => {
        if (resolved) return // avem deja o poziție: o eroare târzie nu o strică
        error.value = e.code === 1 ? 'denied' : 'unavailable'
        stop()
        done()
      }
      const opts: PositionOptions = { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
      if (typeof geo.watchPosition === 'function') {
        watchId = geo.watchPosition(onFix, onError, opts)
        stopTimer = setTimeout(() => { stop(); if (!resolved) { error.value = 'unavailable'; done() } }, Math.max(REFINE_MS, timeoutMs))
      } else {
        geo.getCurrentPosition(onFix, onError, opts)
      }
    })
  }

  /** `near` pentru API (`lat,lng`), ex. GET /events?near=46.18,21.31 */
  const near = () => `${position.value.lat.toFixed(5)},${position.value.lng.toFixed(5)}`

  return { position, isFallback, loading, error, accuracy, locate, stop, near }
}
