/**
 * T08 · încărcarea Google Maps JavaScript API (o singură dată, fără pachet extern): scriptul oficial cu `loading=async`,
 * apoi bibliotecile prin `google.maps.importLibrary`. Cheia de browser vine la build din VITE_GOOGLE_MAPS_KEY
 * (restricționată pe domeniu / aplicație în Google Cloud); fără ea, harta folosește rezerva Leaflet.
 */
export const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined)?.trim() || ''
/** Map ID-ul e cerut de AdvancedMarkerElement; DEMO_MAP_ID e cel public de test al Google. */
export const GOOGLE_MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined)?.trim() || 'DEMO_MAP_ID'

let loading: Promise<void> | null = null

export function loadGoogleMaps(key = GOOGLE_MAPS_KEY): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
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
