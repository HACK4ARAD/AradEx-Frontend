import { ref } from 'vue'
import type { GeoPoint } from '@/shared/types/common'

/** Centrul Aradului (Piața Avram Iancu) — poziția implicită când nu avem GPS. */
export const ARAD_CENTER: GeoPoint = { lat: 46.1866, lng: 21.3123 }

/**
 * Poziția utilizatorului: `locate()` cere GPS-ul (doar la o acțiune a omului, nu la încărcare); fără permisiune,
 * fără GPS sau după timeout rămâne pe centrul Aradului cu `isFallback = true`, fără eroare în consolă.
 * Folosit de hartă (T08), „lângă tine” (T06/T10), transport (T19).
 */
export function useGeo() {
  const position = ref<GeoPoint>({ ...ARAD_CENTER })
  const isFallback = ref(true)
  const loading = ref(false)
  const error = ref<string | null>(null)

  function locate(timeoutMs = 8000): Promise<GeoPoint> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      error.value = 'unavailable'
      return Promise.resolve(position.value)
    }
    loading.value = true
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          position.value = { lat: p.coords.latitude, lng: p.coords.longitude }
          isFallback.value = false
          error.value = null
          loading.value = false
          resolve(position.value)
        },
        (e) => {
          error.value = e.code === 1 ? 'denied' : 'unavailable'
          loading.value = false
          resolve(position.value)
        },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
      )
    })
  }

  /** `near` pentru API (`lat,lng`), ex. GET /events?near=46.18,21.31 */
  const near = () => `${position.value.lat.toFixed(5)},${position.value.lng.toFixed(5)}`

  return { position, isFallback, loading, error, locate, near }
}
