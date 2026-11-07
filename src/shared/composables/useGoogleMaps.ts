/**
 * T08 · încărcarea Google Maps JavaScript API (o singură dată, fără pachet extern): scriptul oficial cu `loading=async`,
 * apoi bibliotecile prin `google.maps.importLibrary`. Cheia de browser vine la build din VITE_GOOGLE_MAPS_KEY
 * (restricționată pe domeniu / aplicație în Google Cloud); fără ea, harta folosește rezerva Leaflet.
 */
export const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined)?.trim() || ''
/** Map ID-ul e cerut de AdvancedMarkerElement; DEMO_MAP_ID e cel public de test al Google. */
export const GOOGLE_MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined)?.trim() || 'DEMO_MAP_ID'

let loading: Promise<void> | null = null

/**
 * Google cheamă `window.gm_authFailure` când refuză cheia (de ex. restricția pe site-uri nu acceptă originea aplicației
 * iOS, `capacitor://localhost`): harta ar rămâne gri. Atunci Google e „indisponibil” pentru toată sesiunea și fiecare
 * hartă trece pe rezerva Leaflet.
 */
let unavailable = false
const listeners = new Set<() => void>()

export function googleUnavailable(): boolean {
  return unavailable
}

/** `cb` e chemat când Google devine indisponibil (sau imediat, dacă deja e); întoarce dezabonarea. */
export function onGoogleUnavailable(cb: () => void): () => void {
  if (unavailable) { cb(); return () => {} }
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function markGoogleUnavailable() {
  if (unavailable) return
  unavailable = true
  for (const cb of [...listeners]) cb()
  listeners.clear()
}

if (typeof window !== 'undefined') {
  (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = markGoogleUnavailable
}

export function loadGoogleMaps(key = GOOGLE_MAPS_KEY): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (unavailable) return Promise.reject(new Error('Google Maps key refused'))
  if ((window as { google?: { maps?: { importLibrary?: unknown } } }).google?.maps?.importLibrary) return Promise.resolve()
  loading ??= new Promise<void>((resolve, reject) => {
    const cb = '__axGoogleMapsReady'
    ;(window as unknown as Record<string, () => void>)[cb] = () => resolve()
    const s = document.createElement('script')
    const q = new URLSearchParams({ key, v: 'weekly', loading: 'async', language: 'ro', region: 'RO', callback: cb })
    s.src = `https://maps.googleapis.com/maps/api/js?${q}`
    s.async = true
    s.onerror = () => { loading = null; reject(new Error('Google Maps could not load')) }
    document.head.append(s)
  })
  return loading
}
